/* 
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT
    
    ============================================
    UI: Modals + Toast + Context Menu
    ============================================ 
*/

/* ── TOAST ── */
CS.ToastUI = {
    show(message, type = 'info', duration = null) {
        const container = document.getElementById('toast-container');
        // Max 3 toasts
        while (container.children.length >= 3) {
            container.removeChild(container.firstChild);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
        toast.innerHTML = `
      <span>${icons[type] || ''} ${CS.SidebarUI.escapeHtml(message)}</span>
      <button class="toast-close">✕</button>
    `;

        container.appendChild(toast);

        // Auto dismiss
        const timeout = duration || (type === 'error' ? 5000 : 3000);
        const timer = setTimeout(() => this.dismiss(toast), timeout);

        // Click to dismiss
        toast.addEventListener('click', (e) => {
            if (!e.target.classList.contains('toast-close')) return;
            clearTimeout(timer);
            this.dismiss(toast);
        });

        // Hover to pause
        toast.addEventListener('mouseenter', () => clearTimeout(timer));
        toast.addEventListener('mouseleave', () => {
            setTimeout(() => this.dismiss(toast), 1000);
        });
    },

    dismiss(toast) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 150);
    },
};

/* ── MODAL MANAGER ── */
CS.ModalUI = {
    currentType: null,    // 'role' | 'context'
    currentId: null,      // id if editing, null if creating
    deleteCallback: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Overlay click to close
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-overlay')) this.closeAll();
        });

        // Item modal buttons
        document.getElementById('modal-item-close').addEventListener('click', () => this.closeAll());
        document.getElementById('modal-item-cancel').addEventListener('click', () => this.closeAll());
        document.getElementById('modal-item-save').addEventListener('click', () => this.saveItem());

        // Delete modal
        document.getElementById('modal-delete-close').addEventListener('click', () => this.closeAll());
        document.getElementById('modal-delete-cancel').addEventListener('click', () => this.closeAll());
        document.getElementById('modal-delete-confirm').addEventListener('click', () => {
            if (this.deleteCallback) this.deleteCallback();
            this.closeAll();
        });

        // Import modal
        document.getElementById('modal-import-close').addEventListener('click', () => this.closeAll());
        document.getElementById('modal-import-cancel').addEventListener('click', () => this.closeAll());

        // Shortcuts modal
        document.getElementById('modal-shortcuts-close').addEventListener('click', () => this.closeAll());

        // Preset modal
        document.getElementById('modal-preset-close').addEventListener('click', () => this.closeAll());
        document.getElementById('modal-preset-cancel').addEventListener('click', () => this.closeAll());
        document.getElementById('modal-preset-save').addEventListener('click', () => this.savePreset());

        // Live stats in editor
        document.getElementById('item-content').addEventListener('input', () => this.updateItemStats());
    },

    openCreate(type) {
        this.currentType = type;
        this.currentId = null;

        document.getElementById('modal-item-title').textContent = `Create ${type === 'role' ? 'Role' : 'Context'}`;
        document.getElementById('item-title').value = '';
        document.getElementById('item-emoji').value = type === 'role' ? '🎭' : '📄';
        document.getElementById('item-content').value = '';
        this.updateItemStats();

        this.showModal('modal-item');
        document.getElementById('item-title').focus();
    },

    async openEdit(type, id) {
        this.currentType = type;
        this.currentId = id;

        const repo = type === 'role' ? CS.RoleRepo : CS.ContextRepo;
        const item = await repo.findById(id);
        if (!item) return;

        document.getElementById('modal-item-title').textContent = `Edit ${type === 'role' ? 'Role' : 'Context'}`;
        document.getElementById('item-title').value = item.title || '';
        document.getElementById('item-emoji').value = item.emoji || '';
        document.getElementById('item-content').value = item.content || '';
        this.updateItemStats();

        this.showModal('modal-item');
        document.getElementById('item-title').focus();
    },

    openDelete(type, id, title) {
        this.deleteCallback = async () => {
            const repo = type === 'role' ? CS.RoleRepo :
                type === 'context' ? CS.ContextRepo : CS.PresetRepo;
            await repo.delete(id);
            CS.MergeUI.items = CS.MergeUI.items.filter(i => i.refId !== id);
            CS.SidebarUI.render();
            CS.MergeUI.render();
            CS.MergeUI.triggerMerge();
            CS.ToastUI.show(`Deleted "${title}"`, 'success');
        };

        document.getElementById('delete-message').textContent = `Yakin ingin menghapus "${title}"?`;
        this.showModal('modal-delete');
    },

    openSavePreset() {
        if (CS.MergeUI.items.length === 0) {
            CS.ToastUI.show('Add items to merge first', 'warning');
            return;
        }
        document.getElementById('preset-title').value = '';
        document.getElementById('preset-emoji').value = '📌';
        this.showModal('modal-preset');
        document.getElementById('preset-title').focus();
    },

    openImportPreview(data) {
        this.pendingImportData = data;
        const roles = data.roles?.length || 0;
        const ctxs = data.contexts?.length || 0;
        const presets = data.presets?.length || 0;

        document.getElementById('import-info').innerHTML = `
      📦 Data: ${roles} Roles · ${ctxs} Context · ${presets} Presets<br>
      📅 Exported: ${data.meta?.exportedAt || 'Unknown'}<br>
      🏷️ Version: ${data.meta?.version || 'Unknown'}
    `;

        document.getElementById('modal-import-confirm').onclick = () => this.executeImport();
        this.showModal('modal-import');
    },

    async executeImport() {
        const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';
        const data = this.pendingImportData;
        if (!data) return;

        try {
            const st = CS.Storage.getAdapter();
            await st.importAll(data.data || data, mode);
            this.closeAll();
            CS.SidebarUI.render();
            CS.MergeUI.render();
            CS.MergeUI.triggerMerge();
            CS.ToastUI.show('Data imported successfully! ✅', 'success');
        } catch (err) {
            CS.ToastUI.show('Import failed: ' + err.message, 'error');
        }
    },

    async saveItem() {
        const title = document.getElementById('item-title').value.trim();
        const emoji = document.getElementById('item-emoji').value.trim();
        const content = document.getElementById('item-content').value;

        if (!title) {
            CS.ToastUI.show('Title is required', 'error');
            return;
        }

        const repo = this.currentType === 'role' ? CS.RoleRepo : CS.ContextRepo;

        if (this.currentId) {
            await repo.update(this.currentId, { title, emoji, content });
            CS.ToastUI.show(`Updated "${title}"`, 'success');
        } else {
            await repo.create({ title, emoji, content });
            CS.ToastUI.show(`Created "${title}"`, 'success');
        }

        this.closeAll();
        CS.SidebarUI.render();
        CS.MergeUI.render();
    },

    async savePreset() {
        const title = document.getElementById('preset-title').value.trim();
        const emoji = document.getElementById('preset-emoji').value.trim() || '📌';

        if (!title) {
            CS.ToastUI.show('Preset name is required', 'error');
            return;
        }

        await CS.PresetRepo.create({
            title,
            emoji,
            items: CS.MergeUI.items.map(i => ({ type: i.type, refId: i.refId })),
            templateId: CS.MergeUI.currentTemplateId,
        });

        this.closeAll();
        CS.SidebarUI.render();
        CS.ToastUI.show(`Preset "${title}" saved`, 'success');
    },

    updateItemStats() {
        const content = document.getElementById('item-content').value;
        document.getElementById('item-char-count').textContent = `${CS.Token.countChars(content)} chars`;
        document.getElementById('item-word-count').textContent = `${CS.Token.countWords(content)} words`;
        document.getElementById('item-token-count').textContent = `~${CS.Token.estimate(content)} tokens`;
    },

    showModal(id) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    },

    closeAll() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        this.currentId = null;
        this.currentType = null;
        this.deleteCallback = null;
        this.pendingImportData = null;
        this.hideContextMenu();
    },

    showContextMenu(e, item, type) {
        const menu = document.getElementById('context-menu');
        const x = e.clientX;
        const y = e.clientY;

        let items = [];

        if (type === 'role' || type === 'context') {
            items = [
                { label: '✏️ Edit', shortcut: 'Enter', action: () => CS.ModalUI.openEdit(type, item.id) },
                { label: '📋 Copy Content', shortcut: 'Ctrl+⏎', action: () => CS.Clipboard.copy(item.content || '') },
                { label: '➕ Add to Merge', shortcut: 'Ctrl+⇧+M', action: () => CS.MergeUI.addItem(type, item.id) },
                { label: '-' },
                { label: '🗑️ Delete', shortcut: 'Del', danger: true, action: () => CS.ModalUI.openDelete(type, item.id, item.title) },
            ];
        } else if (type === 'preset') {
            items = [
                { label: '📂 Load Preset', shortcut: '⏎', action: () => CS.MergeUI.loadPreset(item) },
                { label: '🗑️ Delete', shortcut: 'Del', danger: true, action: () => CS.ModalUI.openDelete('preset', item.id, item.title) },
            ];
        } else if (type === 'merge') {
            items = [
                { label: '✏️ Edit Source', action: () => CS.ModalUI.openEdit(item.type, item.refId) },
                { label: '-' },
                { label: '🔼 Move Up', shortcut: 'Alt+↑', action: () => CS.MergeUI.moveItem(item.refId, -1) },
                { label: '🔽 Move Down', shortcut: 'Alt+↓', action: () => CS.MergeUI.moveItem(item.refId, 1) },
                { label: '-' },
                { label: '✕ Remove', shortcut: 'Del', danger: true, action: () => CS.MergeUI.removeItem(item.refId) },
            ];
        }

        menu.innerHTML = '';
        for (const item of items) {
            if (item.label === '-') {
                const sep = document.createElement('div');
                sep.className = 'ctx-separator';
                menu.appendChild(sep);
                continue;
            }
            const el = document.createElement('div');
            el.className = 'ctx-item' + (item.danger ? ' danger' : '');
            el.innerHTML = `<span>${item.label}</span><span class="shortcut">${item.shortcut || ''}</span>`;
            el.addEventListener('click', () => {
                item.action();
                this.hideContextMenu();
            });
            menu.appendChild(el);
        }

        menu.classList.remove('hidden');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // Adjust if overflow
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
    },

    hideContextMenu() {
        document.getElementById('context-menu').classList.add('hidden');
    },
};