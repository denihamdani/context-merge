/* ============================================
   Merge: Engine + Templates + Token Counter
   ────────────────────────────────────────────
   ⚡ Token estimation: Level 3 Hybrid
   🔀 Merge pipeline: 7 steps
   ────────────────────────────────────────────
   ============================================ */

/* ── TOKEN ESTIMATION ── */
CS.Token = {
    estimate(text) {
        if (!text) return 0;
        const chars = text.length;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        // Detect code ratio
        const codeChars = (text.match(/[{}()\[\];<>=+\-*/&|!%^~?@#$]|^\s{2,}/gm) || []).join('').length;
        const codeRatio = chars > 0 ? codeChars / chars : 0;
        if (codeRatio > 0.3) return Math.ceil(chars / 3);
        if (codeRatio < 0.05 && words > 0) return Math.ceil(words * 1.3);
        return Math.ceil(chars / 4);
    },

    countWords(text) {
        return (text || '').trim().split(/\s+/).filter(Boolean).length;
    },

    countChars(text) {
        return (text || '').length;
    },

    countLines(text) {
        return (text || '').split('\n').length;
    },
};

/* ── BUILT-IN MERGE TEMPLATES ── */
CS.MergeTemplates = {
    builtins: [
        {
            id: 't_default',
            name: 'Markdown Header',
            isBuiltin: true,
            config: {
                separator: '\n\n---\n\n',
                roleHeader: '## ROLE: {{title}}\n\n',
                roleFooter: '',
                contextHeader: '## CONTEXT: {{title}}\n\n',
                contextFooter: '',
                outputPrefix: '',
                outputSuffix: '',
                wrapInCodeBlock: false,
            },
        },
        {
            id: 't_xml',
            name: 'XML Tags',
            isBuiltin: true,
            config: {
                separator: '\n\n',
                roleHeader: '<role name="{{title}}">\n',
                roleFooter: '\n</role>',
                contextHeader: '<context name="{{title}}">\n',
                contextFooter: '\n</context>',
                outputPrefix: '<system>\n',
                outputSuffix: '\n</system>',
                wrapInCodeBlock: false,
            },
        },
        {
            id: 't_compact',
            name: 'Compact',
            isBuiltin: true,
            config: {
                separator: '\n\n',
                roleHeader: '[ROLE: {{title}}] ',
                roleFooter: '',
                contextHeader: '\n\n[{{title}}] ',
                contextFooter: '',
                outputPrefix: '',
                outputSuffix: '',
                wrapInCodeBlock: false,
            },
        },
    ],
};

/* ── TEMPLATE VARIABLE INTERPOLATOR ── */
function interpolate(template, data) {
    return template.replace(/\{\{(\w+)(?::(\d+))?\}\}/g, (_, key, truncLen) => {
        let val = String(data[key] ?? '');
        if (truncLen && val.length > +truncLen) {
            val = val.substring(0, +truncLen) + '…';
        }
        return val;
    });
}

/* ── MERGE ENGINE ── */
CS.MergeEngine = {
    async merge(mergeItems, templateId) {
        const selected = mergeItems
            .filter(i => i.selected)
            .sort((a, b) => a.order - b.order);

        if (selected.length === 0) {
            return { output: '', stats: this._emptyStats(), errors: ['No items selected'] };
        }

        // Step 2: Resolve content from storage
        const st = CS.Storage.getAdapter();
        const resolved = [];
        const errors = [];

        for (const item of selected) {
            const entity = item.type === 'role' ? 'roles' : 'contexts';
            const data = await st.findById(entity, item.refId);
            if (!data) {
                errors.push(`Item "${item.refId}" not found`);
                continue;
            }
            if (!data.content || !data.content.trim()) {
                errors.push(`"${data.title}" has empty content — skipped`);
                continue;
            }
            resolved.push({ ...item, ...data });
        }

        if (resolved.length === 0) {
            return { output: '', stats: this._emptyStats(), errors };
        }

        // Step 3: Load template
        const template = await CS.TemplateRepo.findById(templateId) || CS.MergeTemplates.builtins[0];
        const cfg = template.config;

        // Step 4: Format sections
        const sections = [];
        const perSection = [];

        for (const item of resolved) {
            const isRole = item.type === 'role';
            const headerTpl = isRole ? cfg.roleHeader : cfg.contextHeader;
            const footerTpl = isRole ? cfg.roleFooter : cfg.contextFooter;

            const varData = {
                title: item.title,
                content: item.content,
                emoji: item.emoji || '',
                type: item.type,
                id: item.refId,
                tags: (item.tags || []).join(', '),
                order: sections.length + 1,
                charCount: CS.Token.countChars(item.content),
                wordCount: CS.Token.countWords(item.content),
                tokenEst: CS.Token.estimate(item.content),
                lineCount: CS.Token.countLines(item.content),
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0],
            };

            const section = interpolate(headerTpl, varData) + item.content + interpolate(footerTpl, varData);
            sections.push(section);

            perSection.push({
                title: item.title,
                type: item.type,
                emoji: item.emoji,
                chars: section.length,
                tokens: CS.Token.estimate(section),
            });
        }

        // Step 5: Join & assemble
        let body = sections.join(cfg.separator);
        if (cfg.wrapInCodeBlock) {
            body = '```markdown\n' + body + '\n```';
        }
        let output = (cfg.outputPrefix || '') + body + (cfg.outputSuffix || '');

        // Step 6: Post-process (preserve code blocks)
        output = this._normalize(output, true);

        // Step 7: Stats
        const stats = {
            charCount: output.length,
            wordCount: CS.Token.countWords(output),
            lineCount: output.split('\n').length,
            tokenEst: CS.Token.estimate(output),
            sectionCount: sections.length,
            perSection,
        };

        return { output, stats, errors };
    },

    _normalize(text, preserveCodeBlocks) {
        if (!preserveCodeBlocks) {
            return text
                .replace(/\r\n/g, '\n')
                .replace(/\n{4,}/g, '\n\n\n')
                .replace(/[ \t]+$/gm, '')
                .replace(/^\n+/, '')
                .replace(/\n+$/, '');
        }
        // Preserve code blocks
        const blocks = [];
        let processed = text.replace(/(```[\s\S]*?```)/g, (m) => {
            blocks.push(m);
            return `\x00BLOCK_${blocks.length - 1}\x00`;
        });
        processed = processed
            .replace(/\r\n/g, '\n')
            .replace(/\n{4,}/g, '\n\n\n')
            .replace(/[ \t]+$/gm, '')
            .replace(/^\n+/, '')
            .replace(/\n+$/, '');
        blocks.forEach((block, i) => {
            processed = processed.replace(`\x00BLOCK_${i}\x00`, block);
        });
        return processed;
    },

    _emptyStats() {
        return { charCount: 0, wordCount: 0, lineCount: 0, tokenEst: 0, sectionCount: 0, perSection: [] };
    },
};