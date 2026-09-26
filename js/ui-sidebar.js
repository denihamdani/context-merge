/* 
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT

    ============================================
    UI: Sidebar — Roles + Context + Presets
    ============================================ 
*/

CS.SidebarUI = {
    selectedId: null,
    selectedType: null, // 'role' | 'context' | 'preset'
    filterText: '',
    _isRendering: false, // re-entrancy guard

    init() {
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

    async render() {
        if (this._isRendering) return;   // ⬅ CHANGED: guard
        this._isRendering = true;        // ⬅ CHANGED: guard

        try {                            // ⬅ CHANGED: try/finally
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
            this._isRendering = false;   // ⬅ CHANGED: release guard
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
                // Insert before the menu button
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
        <span class="item-emoji">${item.emoji || (type === 'role' ? '🎭' : '📄')}</span>
        <div class="item-info">
          <div class="item-title">${this.escapeHtml(item.title)}</div>
          <div class="item-snippet">${this.escapeHtml((item.content || '').substring(0, 50))}</div>
        </div>
        ${inMerge ? '<span class="in-merge-badge">🔗 In Merge</span>' : ''}
        <button class="item-menu-btn" data-id="${item.id}" data-type="${type}">⋮</button>
      `;

            // Events
            li.addEventListener('click', (e) => {
                if (e.target.classList.contains('item-menu-btn')) return;
                this.selectItem(item.id, type);
            });

            li.addEventListener('dblclick', () => {
                CS.ModalUI.openEdit(type, item.id);
            });

            li.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.selectItem(item.id, type);
                CS.ModalUI.showContextMenu(e, item, type);
            });

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
        <span class="item-emoji">${item.emoji || '📌'}</span>
        <div class="item-info">
          <div class="item-title">${this.escapeHtml(item.title)}</div>
          <div class="item-snippet">${item.items.length} items</div>
        </div>
        <button class="item-menu-btn" data-id="${item.id}" data-type="preset">⋮</button>
      `;

            li.addEventListener('click', (e) => {
                if (e.target.classList.contains('item-menu-btn')) return;
                CS.MergeUI.loadPreset(item);
            });

            li.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                CS.ModalUI.showContextMenu(e, item, 'preset');
            });

            const menuBtn = li.querySelector('.item-menu-btn');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                CS.ModalUI.showContextMenu(e, item, 'preset');
            });

            ul.appendChild(li);
        }
    },

    selectItem(id, type) {
        this.selectedId = id;
        this.selectedType = type;
        // Re-render to update selected class
        document.querySelectorAll('.item-list li').forEach(li => {
            li.classList.toggle('selected', li.dataset.id === id);
        });
    },

    getSelected() {
        return { id: this.selectedId, type: this.selectedType };
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    },
};