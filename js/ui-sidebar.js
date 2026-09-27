/*
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT

    ============================================
    UI: Sidebar — Roles + Context + Presets
    ============================================
*/

CS.SidebarUI = {
    selectedId: null,
    selectedType: null,
    filterText: '',
    _isRendering: false,

    // ── Preset double-tap confirmation ──
    _presetPendingId: null,
    _presetConfirmTimer: null,
    _PRESET_CONFIRM_TIMEOUT: 3000,

    // ── Long-press reinforcement ──
    _lpTimer: null,
    _lpFired: false,
    _lpStartX: 0,
    _lpStartY: 0,
    _LP_DURATION: 600,
    _LP_MOVE_THRESHOLD: 10,
    _isIOS: false,

    init() {
        this._isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterText = e.target.value.toLowerCase();
            this.render();
        });

        document.getElementById('btn-add-role').addEventListener('click', () => {
            CS.ModalUI.openCreate('role');
        });

        document.getElementById('btn-add-ctx').addEventListener('click', () => {
            CS.ModalUI.openCreate('context');
        });
    },

    /* ══════════════════════════════════════════════
       LONG-PRESS + CONTEXT MENU REINFORCEMENT
       ══════════════════════════════════════════════ */

    _attachTouchHandlers(li, item, type) {
        const self = this;
        const isPreset = (type === 'preset');

        // ── Primary: contextmenu event (Android long-press) ──
        li.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            self._lpFired = true;
            clearTimeout(self._lpTimer);
            if (!isPreset) self.selectItem(item.id, type);
            CS.ModalUI.showContextMenu(e, item, type);
        });

        // ── Fallback: manual long-press timer (non-iOS only) ──
        // iOS: ⋮ button only per locked decision #10
        if (this._isIOS) return;

        li.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            self._lpFired = false;
            self._lpStartX = e.touches[0].clientX;
            self._lpStartY = e.touches[0].clientY;
            clearTimeout(self._lpTimer);
            self._lpTimer = setTimeout(() => {
                if (!self._lpFired) {
                    self._lpFired = true;

                    // Suppress synthetic click that follows touchend
                    li.style.pointerEvents = 'none';
                    setTimeout(() => {
                        li.style.pointerEvents = '';
                    }, 300);

                    CS.ModalUI.showContextMenu(
                        {
                            clientX: self._lpStartX,
                            clientY: self._lpStartY,
                            target: li,
                            preventDefault: () => { },
                        },
                        item,
                        type
                    );
                }
            }, self._LP_DURATION);
        }, { passive: true });

        li.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            const dx = Math.abs(e.touches[0].clientX - self._lpStartX);
            const dy = Math.abs(e.touches[0].clientY - self._lpStartY);
            if (dx > self._LP_MOVE_THRESHOLD || dy > self._LP_MOVE_THRESHOLD) {
                clearTimeout(self._lpTimer);
            }
        }, { passive: true });

        li.addEventListener('touchend', () => {
            clearTimeout(self._lpTimer);
        }, { passive: true });

        li.addEventListener('touchcancel', () => {
            clearTimeout(self._lpTimer);
        }, { passive: true });
    },

    /* ══════════════════════════════════════════════
       PRESET DOUBLE-TAP CONFIRMATION
       ══════════════════════════════════════════════ */

    _handlePresetTap(item) {
        if (this._presetPendingId === item.id) {
            // ── Second tap on same preset: load it ──
            clearTimeout(this._presetConfirmTimer);
            this._presetPendingId = null;
            CS.MergeUI.loadPreset(item);
        } else {
            // ── First tap: request confirmation ──
            clearTimeout(this._presetConfirmTimer);
            this._presetPendingId = item.id;
            CS.ToastUI.show(
                `Tap again to load "${item.title}"`,
                'info',
                this._PRESET_CONFIRM_TIMEOUT
            );
            this._presetConfirmTimer = setTimeout(() => {
                this._presetPendingId = null;
            }, this._PRESET_CONFIRM_TIMEOUT);
        }
    },

    /* ══════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════ */

    async render() {
        if (this._isRendering) return;
        this._isRendering = true;

        try {
            const [roles, contexts, presets] = await Promise.all([
                CS.RoleRepo.findAll(),
                CS.ContextRepo.findAll(),
                CS.PresetRepo.findAll(),
            ]);

            const filteredRoles = this.filterItems(roles);
            const filteredCtxs = this.filterItems(contexts);

            this.renderList('role-list', filteredRoles, 'role');
            this.renderList('ctx-list', filteredCtxs, 'context');
            this.renderPresetList('preset-list', presets);

            // Update counts
            document.getElementById('role-count').textContent = roles.length;
            document.getElementById('ctx-count').textContent = contexts.length;
            document.getElementById('preset-count').textContent = presets.length;

            // Update status bar
            document.getElementById('stat-roles').textContent = `${roles.length} Roles`;
            document.getElementById('stat-ctxs').textContent = `${contexts.length} Context`;
            document.getElementById('stat-presets').textContent = `${presets.length} Presets`;

            CS.EventBus.emit('data:changed');

        } finally {
            this._isRendering = false;
        }
    },

    updateMergeBadges() {
        const allItems = document.querySelectorAll('.item-list li[data-id]');
        allItems.forEach(li => {
            const id = li.dataset.id;
            const inMerge = CS.MergeUI.items.some(m => m.refId === id && m.selected);
            const existingBadge = li.querySelector('.in-merge-badge');

            if (inMerge && !existingBadge) {
                const badge = document.createElement('span');
                badge.className = 'in-merge-badge';
                badge.textContent = '🔗 In Merge';
                const menuBtn = li.querySelector('.item-menu-btn');
                if (menuBtn) {
                    li.insertBefore(badge, menuBtn);
                } else {
                    li.appendChild(badge);
                }
            } else if (!inMerge && existingBadge) {
                existingBadge.remove();
            }
        });
    },

    filterItems(items) {
        if (!this.filterText) return items;
        return items.filter(i =>
            (i.title || '').toLowerCase().includes(this.filterText) ||
            (i.content || '').toLowerCase().includes(this.filterText)
        );
    },

    /* ══════════════════════════════════════════════
       RENDER LISTS
       ══════════════════════════════════════════════ */

    renderList(containerId, items, type) {
        const ul = document.getElementById(containerId);
        ul.innerHTML = '';

        if (items.length === 0) {
            ul.innerHTML = `<li class="empty-state">
        <p>${type === 'role' ? '📭 No roles yet' : '📭 No Context yet'}</p>
        <p class="hint">${type === 'role' ? 'Create your first role!' : 'Add your first context!'}</p>
      </li>`;
            return;
        }

        for (const item of items) {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            li.dataset.type = type;

            if (this.selectedId === item.id) li.classList.add('selected');

            // Check if in merge
            const inMerge = CS.MergeUI.items.some(m => m.refId === item.id && m.selected);

            li.innerHTML = `
        <span class="item-emoji">${this.escapeHtml(item.emoji || (type === 'role' ? '🎭' : '📄'))}</span>
        <div class="item-info">
          <div class="item-title">${this.escapeHtml(item.title)}</div>
          <div class="item-snippet">${this.escapeHtml((item.content || '').substring(0, 50))}</div>
        </div>
        ${inMerge ? '<span class="in-merge-badge">🔗 In Merge</span>' : ''}
        <button class="item-menu-btn" data-id="${this.escapeHtml(item.id)}" data-type="${this.escapeHtml(type)}">⋮</button>
      `;

            // Click: select item
            li.addEventListener('click', (e) => {
                if (e.target.classList.contains('item-menu-btn')) return;
                this.selectItem(item.id, type);
            });

            // Double-click: edit
            li.addEventListener('dblclick', () => {
                CS.ModalUI.openEdit(type, item.id);
            });

            // Context menu + long-press (reinforced)
            this._attachTouchHandlers(li, item, type);

            // ⋮ button: open action sheet / context menu
            const menuBtn = li.querySelector('.item-menu-btn');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectItem(item.id, type);
                CS.ModalUI.showContextMenu(e, item, type);
            });

            ul.appendChild(li);
        }
    },

    renderPresetList(containerId, presets) {
        const ul = document.getElementById(containerId);
        ul.innerHTML = '';

        if (presets.length === 0) {
            ul.innerHTML = `<li class="empty-state">
        <p>📭 No presets</p>
        <p class="hint">Save merge combos as presets</p>
      </li>`;
            return;
        }

        for (const item of presets) {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            li.dataset.type = 'preset';

            li.innerHTML = `
        <span class="item-emoji">${this.escapeHtml(item.emoji || '📌')}</span>
        <div class="item-info">
          <div class="item-title">${this.escapeHtml(item.title)}</div>
          <div class="item-snippet">${Number(item.items.length) || 0} items</div>
        </div>
        <button class="item-menu-btn" data-id="${this.escapeHtml(item.id)}" data-type="preset">⋮</button>
      `;

            // Tap: double-tap confirmation before loading
            li.addEventListener('click', (e) => {
                if (e.target.classList.contains('item-menu-btn')) return;
                this._handlePresetTap(item);
            });

            // Context menu + long-press (reinforced)
            this._attachTouchHandlers(li, item, 'preset');

            // ⋮ button: open action sheet / context menu
            const menuBtn = li.querySelector('.item-menu-btn');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                CS.ModalUI.showContextMenu(e, item, 'preset');
            });

            ul.appendChild(li);
        }
    },

    /* ══════════════════════════════════════════════
       SELECTION
       ══════════════════════════════════════════════ */

    selectItem(id, type) {
        this.selectedId = id;
        this.selectedType = type;
        document.querySelectorAll('.item-list li').forEach(li => {
            li.classList.toggle('selected', li.dataset.id === id);
        });
    },

    getSelected() {
        return { id: this.selectedId, type: this.selectedType };
    },

    /* ══════════════════════════════════════════════
       UTILS
       ══════════════════════════════════════════════ */

    escapeHtml(text) {
        return String(text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
};