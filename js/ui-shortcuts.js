/* ============================================
   UI: Keyboard Shortcuts
   ============================================ */

CS.ShortcutsUI = {
    init() {
        document.addEventListener('keydown', (e) => this.handle(e));

        // Close context menu on click anywhere
        document.addEventListener('click', () => CS.ModalUI.hideContextMenu());
        document.addEventListener('contextmenu', (e) => {
            // Prevent default context menu outside sidebar/merge items
            if (!e.target.closest('.item-list li') && !e.target.closest('.merge-item')) {
                e.preventDefault();
            }
        });
    },

    handle(e) {
        const isInput = e.target.matches('input, textarea');
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const key = e.key;
        const alt = e.altKey;

        // ── ALWAYS ACTIVE (even while typing) ──

        // Escape: close modal / context menu
        if (key === 'Escape') {
            e.preventDefault();
            CS.ModalUI.hideContextMenu();
            CS.ModalUI.closeAll();
            return;
        }

        // Ctrl+S: save in modal
        if (ctrl && key === 's') {
            e.preventDefault();
            const modalItem = document.getElementById('modal-item');
            if (!modalItem.classList.contains('hidden')) {
                CS.ModalUI.saveItem();
            }
            return;
        }

        // ── SKIP when typing in input ──
        if (isInput) return;

        // ── GLOBAL SHORTCUTS ──

        // Alt+N: New Role
        if (alt && !shift && key === 'n') {
            e.preventDefault();
            CS.ModalUI.openCreate('role');
            return;
        }

        // Alt+K: New Context
        if (alt && !shift && key === 'k') {
            e.preventDefault();
            CS.ModalUI.openCreate('context');
            return;
        }

        // Alt+C: Copy All
        if (alt && key.toLowerCase() === 'c') {
            e.preventDefault();
            CS.MergeUI.copyAll();
            return;
        }

        // Ctrl+Shift+E: Export
        if (ctrl && shift && key.toLowerCase() === 'e') {
            e.preventDefault();
            CS.Utils.exportJSON();
            return;
        }

        // Alt+I: Import
        if (alt && key.toLowerCase() === 'i') {
            e.preventDefault();
            document.getElementById('file-import').click();
            return;
        }

        // Alt+D: Download .md
        if (alt && key.toLowerCase() === 'd') {
            e.preventDefault();
            CS.MergeUI.downloadMd();
            return;
        }

        // Ctrl+F: Focus search
        if (ctrl && !shift && key.toLowerCase() === 'f') {
            e.preventDefault();
            document.getElementById('search-input').focus();
            return;
        }

        // Ctrl+P: Toggle preview mode
        if (ctrl && !shift && key.toLowerCase() === 'p') {
            e.preventDefault();
            const mode = CS.PreviewUI.mode === 'raw' ? 'rendered' : 'raw';
            CS.PreviewUI.setMode(mode);
            return;
        }

        // Ctrl+/: Shortcuts help
        if (ctrl && key === '/') {
            e.preventDefault();
            CS.ModalUI.showModal('modal-shortcuts');
            return;
        }

        // Ctrl+Shift+M: Add selected to merge
        if (ctrl && shift && key.toLowerCase() === 'm') {
            e.preventDefault();
            const sel = CS.SidebarUI.getSelected();
            if (sel.id && sel.type) {
                CS.MergeUI.addItem(sel.type, sel.id);
            }
            return;
        }

        // Enter: Edit selected
        if (key === 'Enter') {
            e.preventDefault();
            const sel = CS.SidebarUI.getSelected();
            if (sel.id && sel.type) {
                CS.ModalUI.openEdit(sel.type, sel.id);
            }
            return;
        }

        // Ctrl+Enter: Copy selected item
        if (ctrl && key === 'Enter') {
            e.preventDefault();
            this.copySelectedItem();
            return;
        }

        // Delete: Delete selected
        if (key === 'Delete' || key === 'Backspace') {
            e.preventDefault();
            this.deleteSelectedItem();
            return;
        }

        // Ctrl+Shift+M handled above
        // Alt+↑/↓: Move merge item
        if (e.altKey && key === 'ArrowUp') {
            e.preventDefault();
            // Move last selected merge item up (simplified)
            if (CS.MergeUI.items.length > 0) {
                CS.MergeUI.moveItem(CS.MergeUI.items[0].refId, -1);
            }
            return;
        }

        if (e.altKey && key === 'ArrowDown') {
            e.preventDefault();
            if (CS.MergeUI.items.length > 0) {
                CS.MergeUI.moveItem(CS.MergeUI.items[0].refId, 1);
            }
            return;
        }
    },

    async copySelectedItem() {
        const sel = CS.SidebarUI.getSelected();
        if (!sel.id) return;
        const repo = sel.type === 'role' ? CS.RoleRepo : CS.ContextRepo;
        const item = await repo.findById(sel.id);
        if (item) {
            CS.Clipboard.copy(item.content || '');
            CS.ToastUI.show(`Copied "${item.title}"`, 'success');
        }
    },

    deleteSelectedItem() {
        const sel = CS.SidebarUI.getSelected();
        if (!sel.id) return;
        CS.ModalUI.openDelete(sel.type, sel.id, 'this item');
    },
};