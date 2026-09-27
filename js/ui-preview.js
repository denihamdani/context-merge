/* 
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT
    
    ============================================
    UI: Preview Panel (Raw + Rendered)
    ============================================ 
*/

CS.PreviewUI = {
    mode: 'raw', // 'raw' | 'rendered'

    init() {
        document.getElementById('btn-raw').addEventListener('click', () => this.setMode('raw'));
        document.getElementById('btn-rendered').addEventListener('click', () => this.setMode('rendered'));
    },

    setMode(mode) {
        this.mode = mode;
        document.getElementById('btn-raw').classList.toggle('active', mode === 'raw');
        document.getElementById('btn-rendered').classList.toggle('active', mode === 'rendered');
        document.getElementById('preview-raw').classList.toggle('hidden', mode !== 'raw');
        document.getElementById('preview-rendered').classList.toggle('hidden', mode !== 'rendered');

        if (mode === 'rendered' && this.lastOutput) {
            this.renderMarkdown(this.lastOutput);
        }
    },

    update(output) {
        this.lastOutput = output || '';
        document.getElementById('preview-text').textContent = this.lastOutput || 'Select items to see merged output...';

        if (this.mode === 'rendered') {
            this.renderMarkdown(this.lastOutput);
        }
    },

    _sanitizeRendered(container) {
        const ALLOWED_TAGS = new Set([
            'P', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI',
            'STRONG', 'EM', 'CODE', 'PRE', 'BLOCKQUOTE', 'A', 'BR', 'HR'
        ]);
        const SAFE_PROTO = /^(https?:|#|mailto:)/i;
        const DANGEROUS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'BASE', 'FORM']);

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
        const toRemove = [];

        while (walker.nextNode()) {
            const el = walker.currentNode;

            if (!ALLOWED_TAGS.has(el.tagName)) {
                toRemove.push(el);
                continue;
            }

            // Hapus semua atribut kecuali href pada <a>
            for (const attr of [...el.attributes]) {
                const name = attr.name.toLowerCase();
                if (el.tagName === 'A' && name === 'href') {
                    if (!SAFE_PROTO.test(attr.value.trim())) {
                        el.removeAttribute('href');
                    }
                    el.setAttribute('rel', 'noopener noreferrer');
                    el.setAttribute('target', '_blank');
                } else {
                    el.removeAttribute(attr.name);
                }
            }
        }

        // Buang elemen terlarang / ganti dengan teks
        for (const el of toRemove.reverse()) {
            if (DANGEROUS.has(el.tagName)) {
                el.remove();
            } else {
                el.replaceWith(document.createTextNode(el.textContent));
            }
        }
    },

    renderMarkdown(text) {
        const el = document.getElementById('preview-rendered');
        if (!text) {
            el.innerHTML = '<p style="color:var(--text-disabled)">No content to preview</p>';
            return;
        }

        // Simple markdown renderer (no dependency)
        let html = this.escapeHtml(text);

        // Code blocks (```)
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
            return `<pre><code>${code}</code></pre>`;
        });

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bold & Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // HR
        html = html.replace(/^---$/gm, '<hr>');

        // Unordered lists
        html = html.replace(/^[\s]*[-*] (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        html = html.replace(/<\/ul>\s*<ul>/g, '');

        // Line breaks
        html = html.replace(/\n\n/g, '<br><br>');

        el.innerHTML = html;
        this._sanitizeRendered(el);
    },

    escapeHtml(text) {
        return String(text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
};