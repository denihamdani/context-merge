/*
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT

    ============================================
    UI: Keyboard Shortcuts + Touch Long-Press
    ============================================
*/

CS.ShortcutsUI = {
    // Touch tracking for long-press vs scroll detection
    _touchStartX: 0,
    _touchStartY: 0,
    _touchMoved: false,
    _TOUCH_THRESHOLD: 10,

    init() {
        document.addEventListener('keydown', function (e) {
            CS.ShortcutsUI.handle(e);
        });

        // Close context menu on click anywhere
        document.addEventListener('click', function () {
            CS.ModalUI.hideContextMenu();
        });

        // ── TOUCH TRACKING (long-press vs scroll) ──
        document.addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
                CS.ShortcutsUI._touchStartX = e.touches[0].clientX;
                CS.ShortcutsUI._touchStartY = e.touches[0].clientY;
                CS.ShortcutsUI._touchMoved = false;
            }
        }, { passive: true });

        document.addEventListener('touchmove', function (e) {
            if (e.touches.length === 1 && !CS.ShortcutsUI._touchMoved) {
                var dx = Math.abs(e.touches[0].clientX - CS.ShortcutsUI._touchStartX);
                var dy = Math.abs(e.touches[0].clientY - CS.ShortcutsUI._touchStartY);
                if (dx > CS.ShortcutsUI._TOUCH_THRESHOLD || dy > CS.ShortcutsUI._TOUCH_THRESHOLD) {
                    CS.ShortcutsUI._touchMoved = true;
                }
            }
        }, { passive: true });

        // ── CONTEXT MENU HANDLER ──
        document.addEventListener('contextmenu', function (e) {
            // On touch: suppress context menu if user was scrolling (touchMoved)
            if (CS.ShortcutsUI._touchMoved) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Prevent default browser context menu outside sidebar/merge items
            if (!e.target.closest('.item-list li') && !e.target.closest('.merge-item')) {
                e.preventDefault();
            }
        }, true); // capture phase — intercept before item handlers
    },

    handle(e) {
        var isInput = e.target.matches('input, textarea');
        var ctrl = e.ctrlKey || e.metaKey;
        var shift = e.shiftKey;
        var key = e.key;
        var alt = e.altKey;

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
            var modalItem = document.getElementById('modal-item');
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
            var mode = CS.PreviewUI.mode === 'raw' ? 'rendered' : 'raw';
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
            var sel = CS.SidebarUI.getSelected();
            if (sel.id && sel.type) {
                CS.MergeUI.addItem(sel.type, sel.id);
            }
            return;
        }

        // Enter: Edit selected
        if (key === 'Enter') {
            e.preventDefault();
            var selEdit = CS.SidebarUI.getSelected();
            if (selEdit.id && selEdit.type) {
                CS.ModalUI.openEdit(selEdit.type, selEdit.id);
            }
            return;
        }

        // Ctrl+Enter: Copy selected item
        if (ctrl && key === 'Enter') {
            e.preventDefault();
            CS.ShortcutsUI.copySelectedItem();
            return;
        }

        // Delete: Delete selected
        if (key === 'Delete' || key === 'Backspace') {
            e.preventDefault();
            CS.ShortcutsUI.deleteSelectedItem();
            return;
        }

        // Alt+↑/↓: Move merge item
        // TODO (BUG): Currently moves items[0], not selected item. Tracked separately per spec §6 P2.
        if (alt && key === 'ArrowUp') {
            e.preventDefault();
            if (CS.MergeUI.items.length > 0) {
                CS.MergeUI.moveItem(CS.MergeUI.items[0].refId, -1);
            }
            return;
        }

        if (alt && key === 'ArrowDown') {
            e.preventDefault();
            if (CS.MergeUI.items.length > 0) {
                CS.MergeUI.moveItem(CS.MergeUI.items[0].refId, 1);
            }
            return;
        }
    },

    async copySelectedItem() {
        var sel = CS.SidebarUI.getSelected();
        if (!sel.id) return;
        var repo = sel.type === 'role' ? CS.RoleRepo : CS.ContextRepo;
        var item = await repo.findById(sel.id);
        if (item) {
            CS.Clipboard.copy(item.content || '');
            CS.ToastUI.show('Copied "' + item.title + '"', 'success');
        }
    },

    deleteSelectedItem() {
        var sel = CS.SidebarUI.getSelected();
        if (!sel.id) return;
        CS.ModalUI.openDelete(sel.type, sel.id, 'this item');
    },
};