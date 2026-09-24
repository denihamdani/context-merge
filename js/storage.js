/* ============================================
   Storage: LocalStorage Adapter + Registry
   ============================================ */

/* ── LocalStorage Adapter ── */
CS.LocalStorageAdapter = class {
    _key(entity) {
        return CS.CONST.STORAGE_PREFIX + entity;
    }

    _read(entity) {
        try {
            return JSON.parse(localStorage.getItem(this._key(entity))) || [];
        } catch {
            return [];
        }
    }

    _write(entity, data) {
        localStorage.setItem(this._key(entity), JSON.stringify(data));
    }

    async init() { /* nothing needed */ }

    async isAvailable() {
        try {
            localStorage.setItem('__test__', '1');
            localStorage.removeItem('__test__');
            return true;
        } catch {
            return false;
        }
    }

    getBackendInfo() {
        return { name: 'localStorage', type: 'Key-Value', online: false };
    }

    async create(entity, data) {
        const items = this._read(entity);
        items.push(data);
        this._write(entity, items);
        return data;
    }

    async findById(entity, id) {
        return this._read(entity).find(i => i.id === id) || null;
    }

    async findAll(entity, opts) {
        let items = this._read(entity);
        if (opts?.orderBy) {
            const { field, direction = 'asc' } = opts.orderBy;
            items.sort((a, b) => {
                const va = a[field] ?? 0;
                const vb = b[field] ?? 0;
                return direction === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
            });
        }
        return items;
    }

    async update(entity, id, data) {
        const items = this._read(entity);
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
        this._write(entity, items);
        return items[idx];
    }

    async delete(entity, id) {
        const items = this._read(entity);
        const filtered = items.filter(i => i.id !== id);
        if (filtered.length === items.length) return false;
        this._write(entity, filtered);
        return true;
    }

    async deleteAll(entity) {
        this._write(entity, []);
        return true;
    }

    async bulkCreate(entity, arr) {
        const items = this._read(entity);
        items.push(...arr);
        this._write(entity, items);
        return arr;
    }

    async bulkUpsert(entity, arr) {
        const items = this._read(entity);
        for (const data of arr) {
            const idx = items.findIndex(i => i.id === data.id);
            if (idx >= 0) items[idx] = { ...items[idx], ...data };
            else items.push(data);
        }
        this._write(entity, items);
        return arr;
    }

    async count(entity) {
        return this._read(entity).length;
    }

    async search(entity, keyword) {
        const kw = keyword.toLowerCase();
        return this._read(entity).filter(i =>
            (i.title || '').toLowerCase().includes(kw) ||
            (i.content || '').toLowerCase().includes(kw)
        );
    }

    async exportAll() {
        return {
            roles: this._read('roles'),
            contexts: this._read('contexts'),
            presets: this._read('presets'),
            templates: this._read('templates'),
        };
    }

    async importAll(data, mode) {
        if (mode === 'replace') {
            this._write('roles', data.roles || []);
            this._write('contexts', data.contexts || []);
            this._write('presets', data.presets || []);
            if (data.templates) this._write('templates', data.templates);
        } else {
            // Merge: add only new IDs
            for (const entity of ['roles', 'contexts', 'presets', 'templates']) {
                if (!data[entity]) continue;
                const existing = this._read(entity);
                const existingIds = new Set(existing.map(i => i.id));
                const toAdd = data[entity].filter(i => !existingIds.has(i.id));
                if (toAdd.length) {
                    existing.push(...toAdd);
                    this._write(entity, existing);
                }
            }
        }
        return true;
    }
};

/* ── Adapter Registry ── */
CS.Storage = (function () {
    let adapter = null;
    return {
        async init() {
            adapter = new CS.LocalStorageAdapter();
            await adapter.init();
        },
        getAdapter() {
            return adapter;
        },
    };
})();