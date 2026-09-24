/* ============================================
   Utils: Export + Import + Clipboard
   ============================================ */

/* ── CLIPBOARD ── */
CS.Clipboard = {
    async copy(text) {
        // Method 1: Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch { }
        }

        // Method 2: execCommand fallback
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
            return true;
        } catch { }

        // Method 3: Show manual copy
        CS.ToastUI.show('Clipboard unavailable — download as .md instead', 'warning');
        return false;
    },
};

/* ── UTILS ── */
CS.Utils = {
    downloadBlob(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },

    async exportJSON() {
        const st = CS.Storage.getAdapter();
        const data = await st.exportAll();
        const now = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

        const backup = {
            $schema: 'context-studio/backup/v1',
            meta: {
                app: 'context-studio',
                version: '0.1.0',
                dataVersion: CS.CONST.DATA_VERSION,
                exportedAt: new Date().toISOString(),
                source: 'localStorage',
                counts: {
                    roles: data.roles.length,
                    contexts: data.contexts.length,
                    presets: data.presets.length,
                    templates: data.templates.length,
                },
            },
            data: data,
        };

        const json = JSON.stringify(backup, null, 2);
        this.downloadBlob(json, `context-studio-backup-${now}.json`, 'application/json');
        CS.ToastUI.show(`Backup exported (${(json.length / 1024).toFixed(1)} KB)`, 'success');
        return backup;
    },

    async importJSON(fileOrData) {
        try {
            let data;
            if (fileOrData instanceof File) {
                const text = await fileOrData.text();
                data = JSON.parse(text);
            } else {
                data = fileOrData;
            }

            // Detect format
            let importData;
            if (data.$schema && data.data) {
                // Our backup format
                importData = data;
            } else if (data.roles || data.contexts) {
                // Raw data object
                importData = { data };
            } else if (Array.isArray(data)) {
                // Array of items → treat as roles
                importData = { data: { roles: data, contexts: [], presets: [], templates: [] } };
            } else {
                CS.ToastUI.show('Unrecognized file format', 'error');
                return;
            }

            CS.ModalUI.openImportPreview(importData);
        } catch (err) {
            CS.ToastUI.show('Invalid JSON: ' + err.message, 'error');
        }
    },

    async importMarkdown(file, type = 'context') {
        try {
            const content = await file.text();
            const filename = file.name.replace(/\.md$/i, '');

            // Extract title from first heading
            const heading = content.match(/^#{1,2}\s+(.+)$/m);
            const title = heading ? heading[1].trim() : filename;

            const repo = type === 'role' ? CS.RoleRepo : CS.ContextRepo;
            await repo.create({
                title,
                content,
                emoji: type === 'role' ? '🎭' : '📄',
            });

            CS.SidebarUI.render();
            CS.ToastUI.show(`Imported "${title}" as ${type}`, 'success');
        } catch (err) {
            CS.ToastUI.show('Import failed: ' + err.message, 'error');
        }
    },
};

/* ── DRAG & DROP HANDLER ── */
CS.DragDropUI = {
    init() {
        const overlay = document.getElementById('drop-overlay');

        let dragCounter = 0;

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            overlay.classList.remove('hidden');
        });

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                overlay.classList.add('hidden');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            overlay.classList.add('hidden');

            const files = e.dataTransfer.files;
            if (!files.length) return;

            for (const file of files) {
                const ext = file.name.split('.').pop().toLowerCase();
                if (ext === 'json') {
                    CS.Utils.importJSON(file);
                } else if (ext === 'md') {
                    CS.Utils.importMarkdown(file, 'context');
                } else {
                    CS.ToastUI.show(`Unsupported: ${file.name}`, 'warning');
                }
            }
        });
    },
};