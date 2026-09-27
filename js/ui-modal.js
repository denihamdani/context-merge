/*
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT

    ============================================
    UI: Modals + Toast + Context Menu (Action Sheet)
    ============================================
*/

/* ── TOAST ── */
CS.ToastUI = {
    show(message, type, duration) {
        if (type === undefined) type = 'info';
        if (duration === undefined) duration = null;

        var container = document.getElementById('toast-container');
        // Max 3 toasts
        while (container.children.length >= 3) {
            container.removeChild(container.firstChild);
        }

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;

        var icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
        toast.innerHTML =
            '<span>' + (icons[type] || '') + ' ' + CS.SidebarUI.escapeHtml(message) + '</span>' +
            '<button class="toast-close">✕</button>';

        container.appendChild(toast);

        // Auto dismiss
        var timeout = duration || (type === 'error' ? 5000 : 3000);
        var timer = setTimeout(function () {
            CS.ToastUI.dismiss(toast);
        }, timeout);

        // Click to dismiss
        toast.addEventListener('click', function (e) {
            if (!e.target.classList.contains('toast-close')) return;
            clearTimeout(timer);
            CS.ToastUI.dismiss(toast);
        });

        // Hover to pause
        toast.addEventListener('mouseenter', function () {
            clearTimeout(timer);
        });
        toast.addEventListener('mouseleave', function () {
            setTimeout(function () {
                CS.ToastUI.dismiss(toast);
            }, 1000);
        });
    },

    dismiss(toast) {
        toast.classList.add('removing');
        setTimeout(function () {
            if (toast.parentNode) toast.remove();
        }, 150);
    },
};

/* ── MODAL MANAGER ── */
CS.ModalUI = {
    currentType: null,
    currentId: null,
    deleteCallback: null,
    pendingImportData: null,

    // Focus management
    _lastFocused: null,
    _modalFocusHandler: null,
    _ctxTrigger: null,
    _ctxFocusHandler: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Overlay click to close
        document.getElementById('modal-overlay').addEventListener('click', function (e) {
            if (e.target === document.getElementById('modal-overlay')) {
                CS.ModalUI.closeAll();
            }
        });

        // Item modal buttons
        document.getElementById('modal-item-close').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });
        document.getElementById('modal-item-cancel').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });
        document.getElementById('modal-item-save').addEventListener('click', function () {
            CS.ModalUI.saveItem();
        });

        // Delete modal
        document.getElementById('modal-delete-close').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });
        document.getElementById('modal-delete-cancel').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });
        document.getElementById('modal-delete-confirm').addEventListener('click', function () {
            if (CS.ModalUI.deleteCallback) CS.ModalUI.deleteCallback();
            CS.ModalUI.closeAll();
        });

        // Import modal
        document.getElementById('modal-import-close').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });
        document.getElementById('modal-import-cancel').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });

        // Shortcuts modal
        document.getElementById('modal-shortcuts-close').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });

        // Preset modal
        document.getElementById('modal-preset-close').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });
        document.getElementById('modal-preset-cancel').addEventListener('click', function () {
            CS.ModalUI.closeAll();
        });
        document.getElementById('modal-preset-save').addEventListener('click', function () {
            CS.ModalUI.savePreset();
        });

        // Live stats in editor
        document.getElementById('item-content').addEventListener('input', function () {
            CS.ModalUI.updateItemStats();
        });
    },

    openCreate(type) {
        this.currentType = type;
        this.currentId = null;

        document.getElementById('modal-item-title').textContent = 'Create ' + (type === 'role' ? 'Role' : 'Context');
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

        var repo = type === 'role' ? CS.RoleRepo : CS.ContextRepo;
        var item = await repo.findById(id);
        if (!item) return;

        document.getElementById('modal-item-title').textContent = 'Edit ' + (type === 'role' ? 'Role' : 'Context');
        document.getElementById('item-title').value = item.title || '';
        document.getElementById('item-emoji').value = item.emoji || '';
        document.getElementById('item-content').value = item.content || '';
        this.updateItemStats();

        this.showModal('modal-item');
        document.getElementById('item-title').focus();
    },

    openDelete(type, id, title) {
        CS.ModalUI.deleteCallback = async function () {
            var repo = type === 'role'
                ? CS.RoleRepo
                : type === 'context'
                    ? CS.ContextRepo
                    : CS.PresetRepo;
            await repo.delete(id);
            CS.MergeUI.items = CS.MergeUI.items.filter(function (i) {
                return i.refId !== id;
            });
            CS.SidebarUI.render();
            CS.MergeUI.render();
            CS.MergeUI.triggerMerge();
            CS.ToastUI.show('Deleted "' + title + '"', 'success');
        };

        document.getElementById('delete-message').textContent = 'Yakin ingin menghapus "' + title + '"?';
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
        var roles = data.roles ? data.roles.length : 0;
        var ctxs = data.contexts ? data.contexts.length : 0;
        var presets = data.presets ? data.presets.length : 0;

        document.getElementById('import-info').innerHTML =
            '📦 Data: ' + roles + ' Roles · ' + ctxs + ' Context · ' + presets + ' Presets<br>' +
            '📅 Exported: ' + CS.SidebarUI.escapeHtml(data.meta ? data.meta.exportedAt : 'Unknown') + '<br>' +
            '🏷️ Version: ' + CS.SidebarUI.escapeHtml(data.meta ? data.meta.version : 'Unknown');

        document.getElementById('modal-import-confirm').onclick = function () {
            CS.ModalUI.executeImport();
        };
        this.showModal('modal-import');
    },

    async executeImport() {
        var modeEl = document.querySelector('input[name="import-mode"]:checked');
        var mode = modeEl ? modeEl.value : 'merge';
        var data = this.pendingImportData;
        if (!data) return;

        try {
            var st = CS.Storage.getAdapter();
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
        var title = document.getElementById('item-title').value.trim();
        var emoji = document.getElementById('item-emoji').value.trim();
        var content = document.getElementById('item-content').value;

        // Validasi title
        if (!title || typeof title !== 'string') {
            CS.ToastUI.show('Title is required', 'error');
            return;
        }
        if (title.length > 200) {
            CS.ToastUI.show('Title too long (max 200 chars)', 'error');
            return;
        }

        // Validasi emoji
        if (emoji.length > 8) {
            emoji = emoji.slice(0, 8);
        }

        // Validasi content
        if (typeof content !== 'string') content = '';
        if (content.length > 500000) {
            CS.ToastUI.show('Content too large (max 500 KB)', 'error');
            return;
        }

        var repo = this.currentType === 'role' ? CS.RoleRepo : CS.ContextRepo;

        if (this.currentId) {
            await repo.update(this.currentId, { title: title, emoji: emoji, content: content });
            CS.ToastUI.show('Updated "' + title + '"', 'success');
        } else {
            await repo.create({ title: title, emoji: emoji, content: content });
            CS.ToastUI.show('Created "' + title + '"', 'success');
        }

        this.closeAll();
        CS.SidebarUI.render();
        CS.MergeUI.render();
    },

    async savePreset() {
        var title = document.getElementById('preset-title').value.trim();
        var emoji = document.getElementById('preset-emoji').value.trim() || '📌';

        // Validasi title
        if (!title || typeof title !== 'string') {
            CS.ToastUI.show('Preset name is required', 'error');
            return;
        }
        if (title.length > 200) {
            CS.ToastUI.show('Preset name too long (max 200 chars)', 'error');
            return;
        }

        // Validasi emoji
        if (emoji.length > 8) emoji = emoji.slice(0, 8);

        // Validasi items — hanya simpan field yang diizinkan
        var cleanItems = CS.MergeUI.items
            .filter(function (i) { return i && typeof i === 'object'; })
            .slice(0, 50)
            .map(function (i) {
                return {
                    type: i.type === 'role' ? 'role' : 'context',
                    refId: typeof i.refId === 'string' ? i.refId.slice(0, 64) : '',
                };
            });

        // Validasi templateId
        var templateId = (typeof CS.MergeUI.currentTemplateId === 'string')
            ? CS.MergeUI.currentTemplateId.slice(0, 64)
            : 't_default';

        await CS.PresetRepo.create({
            title: title,
            emoji: emoji,
            items: cleanItems,
            templateId: templateId,
        });

        this.closeAll();
        CS.SidebarUI.render();
        CS.ToastUI.show('Preset "' + title + '" saved', 'success');
    },

    updateItemStats() {
        var content = document.getElementById('item-content').value;
        document.getElementById('item-char-count').textContent = CS.Token.countChars(content) + ' chars';
        document.getElementById('item-word-count').textContent = CS.Token.countWords(content) + ' words';
        document.getElementById('item-token-count').textContent = '~' + CS.Token.estimate(content) + ' tokens';
    },

    /* ── MODAL SHOW / CLOSE ── */

    showModal(id) {
        // Save current focus for restoration
        this._lastFocused = document.activeElement;

        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal').forEach(function (m) {
            m.classList.add('hidden');
        });

        var modal = document.getElementById(id);
        modal.classList.remove('hidden');

        // Setup focus trap
        this._releaseModalFocusTrap();
        this._setupModalFocusTrap(modal);
    },

    closeAll() {
        this._releaseModalFocusTrap();

        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(function (m) {
            m.classList.add('hidden');
        });

        this.currentId = null;
        this.currentType = null;
        this.deleteCallback = null;
        this.pendingImportData = null;

        this.hideContextMenu();

        // Restore focus to trigger element
        if (this._lastFocused
            && typeof this._lastFocused.focus === 'function'
            && this._lastFocused.offsetParent !== null) {
            this._lastFocused.focus();
        }
        this._lastFocused = null;
    },

    /* ── FOCUS TRAP (Modal) ── */

    _setupModalFocusTrap(modal) {
        var selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

        this._modalFocusHandler = function (e) {
            if (e.key !== 'Tab') return;

            var focusable = modal.querySelectorAll(selector);
            if (focusable.length === 0) return;

            var first = focusable[0];
            var last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        modal.addEventListener('keydown', this._modalFocusHandler);
    },

    _releaseModalFocusTrap() {
        if (this._modalFocusHandler) {
            document.querySelectorAll('.modal').forEach(function (m) {
                m.removeEventListener('keydown', CS.ModalUI._modalFocusHandler);
            });
            this._modalFocusHandler = null;
        }
    },

    /* ── CONTEXT MENU / ACTION SHEET ── */

    showContextMenu(e, item, type) {
        var menu = document.getElementById('context-menu');
        var isMobile = window.matchMedia('(max-width: 767px)').matches;
        var isTouch = window.matchMedia('(hover: none)').matches;

        // Save trigger for focus restoration
        this._ctxTrigger = e.target;

        var items = [];

        if (type === 'role' || type === 'context') {
            items = [
                { label: '✏️ Edit', shortcut: 'Enter', action: function () { CS.ModalUI.openEdit(type, item.id); } },
                { label: '📋 Copy Content', shortcut: 'Ctrl+⏎', action: function () { CS.Clipboard.copy(item.content || ''); } },
                { label: '➕ Add to Merge', shortcut: 'Ctrl+⇧+M', action: function () { CS.MergeUI.addItem(type, item.id); } },
                { label: '-' },
                { label: '🗑️ Delete', shortcut: 'Del', danger: true, action: function () { CS.ModalUI.openDelete(type, item.id, item.title); } },
            ];
        } else if (type === 'preset') {
            items = [
                { label: '📂 Load Preset', shortcut: '⏎', action: function () { CS.MergeUI.loadPreset(item); } },
                { label: '🗑️ Delete', shortcut: 'Del', danger: true, action: function () { CS.ModalUI.openDelete('preset', item.id, item.title); } },
            ];
        } else if (type === 'merge') {
            items = [
                { label: '✏️ Edit Source', action: function () { CS.ModalUI.openEdit(item.type, item.refId); } },
                { label: '-' },
                { label: '🔼 Move Up', shortcut: 'Alt+↑', action: function () { CS.MergeUI.moveItem(item.refId, -1); } },
                { label: '🔽 Move Down', shortcut: 'Alt+↓', action: function () { CS.MergeUI.moveItem(item.refId, 1); } },
                { label: '-' },
                { label: '✕ Remove', shortcut: 'Del', danger: true, action: function () { CS.MergeUI.removeItem(item.refId); } },
            ];
        }

        // Build DOM
        menu.innerHTML = '';
        for (var i = 0; i < items.length; i++) {
            var menuItem = items[i];

            if (menuItem.label === '-') {
                var sep = document.createElement('div');
                sep.className = 'ctx-separator';
                menu.appendChild(sep);
                continue;
            }

            var el = document.createElement('div');
            el.className = 'ctx-item' + (menuItem.danger ? ' danger' : '');

            // Hide keyboard shortcut labels in touch mode
            var shortcutHtml = isTouch
                ? ''
                : '<span class="shortcut">' + (menuItem.shortcut || '') + '</span>';
            el.innerHTML = '<span>' + menuItem.label + '</span>' + shortcutHtml;

            (function (act) {
                el.addEventListener('click', function () {
                    act();
                    CS.ModalUI.hideContextMenu();
                });
            })(menuItem.action);

            menu.appendChild(el);
        }

        // Positioning
        menu.classList.remove('hidden');

        if (isMobile) {
            // Action sheet: CSS handles bottom-anchored positioning.
            // Clear inline desktop positioning so CSS rules apply.
            menu.style.left = '';
            menu.style.top = '';
        } else {
            // Desktop: position at cursor
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';

            var rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = (e.clientX - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = (e.clientY - rect.height) + 'px';
            }
        }

        // Focus first action item
        var firstCtxItem = menu.querySelector('.ctx-item');
        if (firstCtxItem) {
            firstCtxItem.setAttribute('tabindex', '0');
            firstCtxItem.focus();
        }

        // Setup focus trap in context menu
        this._releaseCtxFocusTrap();
        this._setupCtxFocusTrap(menu);
    },

    hideContextMenu() {
        var menu = document.getElementById('context-menu');

        this._releaseCtxFocusTrap();
        menu.classList.add('hidden');

        // Restore focus to trigger
        if (this._ctxTrigger
            && typeof this._ctxTrigger.focus === 'function'
            && this._ctxTrigger.offsetParent !== null) {
            this._ctxTrigger.focus();
        }
        this._ctxTrigger = null;
    },

    /* ── FOCUS TRAP (Context Menu) ── */

    _setupCtxFocusTrap(menu) {
        this._ctxFocusHandler = function (e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                CS.ModalUI.hideContextMenu();
                return;
            }

            if (e.key !== 'Tab') return;

            var focusable = menu.querySelectorAll('.ctx-item');
            if (focusable.length === 0) return;

            var first = focusable[0];
            var last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        menu.addEventListener('keydown', this._ctxFocusHandler);
    },

    _releaseCtxFocusTrap() {
        if (this._ctxFocusHandler) {
            var menu = document.getElementById('context-menu');
            if (menu) menu.removeEventListener('keydown', this._ctxFocusHandler);
            this._ctxFocusHandler = null;
        }
    },
};