/*
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT

    ============================================
    UI: Merge Workspace Panel
    ============================================
*/

CS.MergeUI = {
    items: [],
    currentTemplateId: 't_default',
    _isRendering: false,
    selectedRefId: null,

    init() {
        this.bindEvents();
        this.renderTemplateSelect();
    },

    bindEvents() {
        document.getElementById('btn-copy-all').addEventListener('click', () => this.copyAll());
        document.getElementById('btn-download-md').addEventListener('click', () => this.downloadMd());
        document.getElementById('btn-clear-merge').addEventListener('click', () => this.clearAll());
        document.getElementById('btn-save-preset').addEventListener('click', () => CS.ModalUI.openSavePreset());
        document.getElementById('template-select').addEventListener('change', (e) => {
            this.currentTemplateId = e.target.value;
            this.triggerMerge();
        });

        CS.EventBus.on('data:changed', () => {
            this.render();
        });
    },

    async renderTemplateSelect() {
        const sel = document.getElementById('template-select');
        const templates = await CS.TemplateRepo.findAll();
        sel.innerHTML = '';
        for (const t of templates) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            sel.appendChild(opt);
        }
        sel.value = this.currentTemplateId;
    },

    addItem(type, refId) {
        if (this.items.some(i => i.refId === refId)) {
            CS.ToastUI.show('Already in merge', 'warning');
            return;
        }
        this.items.push({
            type,
            refId,
            selected: true,
            order: this.items.length,
        });
        this.selectedRefId = refId;
        this.render();
        this.triggerMerge();
    },

    removeItem(refId) {
        this.items = this.items.filter(i => i.refId !== refId);
        this.items.forEach((item, idx) => item.order = idx);
        if (this.selectedRefId === refId) {
            this.selectedRefId = null;
        }
        this.render();
        this.triggerMerge();
    },

    moveItem(refId, direction) {
        const idx = this.items.findIndex(i => i.refId === refId);
        if (idx < 0) return;
        const target = idx + direction;
        if (target < 0 || target >= this.items.length) return;
        [this.items[idx], this.items[target]] = [this.items[target], this.items[idx]];
        this.items.forEach((item, i) => item.order = i);
        this.selectedRefId = refId;
        this.render();
        this.triggerMerge();
    },

    selectMergeItem(refId) {
        this.selectedRefId = refId;
        document.querySelectorAll('.merge-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.refId === refId);
        });
    },

    clearAll() {
        this.items = [];
        this.selectedRefId = null;
        this.render();
        this.triggerMerge();
        CS.ToastUI.show('Merge cleared', 'info');
    },

    loadPreset(preset) {
        this.items = preset.items.map((item, idx) => ({
            ...item,
            selected: true,
            order: idx,
        }));
        this.selectedRefId = null;
        if (preset.templateId) {
            this.currentTemplateId = preset.templateId;
            document.getElementById('template-select').value = preset.templateId;
        }
        this.render();
        this.triggerMerge();
        CS.ToastUI.show(`Preset "${preset.title}" loaded`, 'success');
    },

    async render() {
        if (this._isRendering) return;
        this._isRendering = true;

        try {
            const ul = document.getElementById('merge-items');
            const empty = document.getElementById('merge-empty');

            if (this.items.length === 0) {
                ul.innerHTML = '';
                empty.classList.remove('hidden');
                this.updateStats(this._emptyStats());
                CS.SidebarUI.updateMergeBadges();
                return;
            }

            empty.classList.add('hidden');
            const st = CS.Storage.getAdapter();

            ul.innerHTML = '';
            for (let i = 0; i < this.items.length; i++) {
                const item = this.items[i];
                const entity = item.type === 'role' ? 'roles' : 'contexts';
                const data = await st.findById(entity, item.refId);
                const title = data ? data.title : '⚠️ Missing';
                const tokens = CS.Token.estimate(data ? data.content : '');

                const li = document.createElement('li');
                li.className = 'merge-item';
                li.dataset.refId = item.refId;

                if (this.selectedRefId === item.refId) {
                    li.classList.add('selected');
                }

                li.innerHTML = `
          <span class="drag-handle">⠿</span>
          <span class="item-order">${i + 1}</span>
          <span class="item-type-icon">${item.type === 'role' ? '🎭' : '📄'}</span>
          <span class="item-name">${CS.SidebarUI.escapeHtml(title)}</span>
          <span class="item-tokens">~${tokens} tok</span>
          <button class="move-btn" title="Move Up" data-action="up">▲</button>
          <button class="move-btn" title="Move Down" data-action="down">▼</button>
          <button class="remove-btn" title="Remove" data-action="remove">✕</button>
        `;

                li.querySelector('[data-action="up"]').addEventListener('click', () => this.moveItem(item.refId, -1));
                li.querySelector('[data-action="down"]').addEventListener('click', () => this.moveItem(item.refId, 1));
                li.querySelector('[data-action="remove"]').addEventListener('click', () => this.removeItem(item.refId));

                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (data) CS.ModalUI.showContextMenu(e, { ...data, type: item.type, refId: item.refId }, 'merge');
                });

                li.addEventListener('click', (e) => {
                    if (e.target.closest('button')) return;
                    this.selectMergeItem(item.refId);
                });

                ul.appendChild(li);
            }

            CS.SidebarUI.updateMergeBadges();

        } finally {
            this._isRendering = false;
        }
    },

    async triggerMerge() {
        const result = await CS.MergeEngine.merge(this.items, this.currentTemplateId);
        this.updateStats(result.stats);
        CS.PreviewUI.update(result.output);

        if (result.errors.length > 0) {
            result.errors.forEach(err => CS.ToastUI.show(err, 'warning'));
        }

        this.lastOutput = result.output;
        this.lastStats = result.stats;
    },

    updateStats(stats) {
        document.getElementById('token-count').textContent = `~${stats.tokenEst.toLocaleString()} tokens`;
        document.getElementById('char-count').textContent = `${stats.charCount.toLocaleString()} chars`;
        document.getElementById('section-count').textContent = `${stats.sectionCount} sections`;

        const budget = CS.CONST.TOKEN_BUDGET;
        const pct = budget > 0 ? Math.min((stats.tokenEst / budget) * 100, 100) : 0;
        const fill = document.getElementById('token-fill');
        const label = document.getElementById('token-label');

        fill.style.width = pct + '%';
        fill.className = 'token-fill';

        if (pct < 50) {
            label.textContent = '🟢 Safe';
            label.style.color = 'var(--green-500)';
        } else if (pct < 80) {
            label.textContent = '🟡 Careful';
            label.style.color = 'var(--yellow-500)';
            fill.classList.add('warning');
        } else {
            label.textContent = '🔴 Almost Full';
            label.style.color = 'var(--red-500)';
            fill.classList.add('danger');
        }
    },

    async copyAll() {
        const output = this.lastOutput || '';
        if (!output) {
            CS.ToastUI.show('Nothing to copy', 'warning');
            return;
        }
        const ok = await CS.Clipboard.copy(output);
        if (ok) {
            const btn = document.getElementById('btn-copy-all');
            btn.classList.add('copied');
            btn.innerHTML = '✅ Copied!';
            CS.ToastUI.show(`Copied! (~${this.lastStats.tokenEst} tokens)`, 'success');
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = '📋 Copy All';
            }, 1500);
        }
    },

    downloadMd() {
        const output = this.lastOutput || '';
        if (!output) {
            CS.ToastUI.show('Nothing to download', 'warning');
            return;
        }
        CS.Utils.downloadBlob(output, 'merged-output.md', 'text/markdown');
        CS.ToastUI.show('Downloaded .md file', 'success');
    },

    _emptyStats() {
        return { charCount: 0, wordCount: 0, lineCount: 0, tokenEst: 0, sectionCount: 0, perSection: [] };
    },
};