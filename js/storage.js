/*
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT
    
    ============================================
    Storage: LocalStorage Adapter + Registry
    ============================================ 
*/

/* ── LocalStorage Adapter ── */
CS.LocalStorageAdapter = class {
    _key(entity) {
        return CS.CONST.STORAGE_PREFIX + entity;
    }

    _read(entity) {
        try {
            const raw = JSON.parse(localStorage.getItem(this._key(entity)));
            if (!Array.isArray(raw)) return [];
            return raw.filter(function (item) {
                return item && typeof item === 'object' && !Array.isArray(item);
            });
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
            if (Array.isArray(items) && items.length > 0) {
                items.sort((a, b) => {
                    const va = a[field] ?? 0;
                    const vb = b[field] ?? 0;
                    return direction === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
                });
            }

        }
        return items;
    }

    _sanitizeUpdate(existing, data) {
        const ALLOWED_KEYS = {
            roles: ['title', 'content', 'emoji', 'sortOrder'],
            contexts: ['title', 'content', 'emoji', 'sortOrder', 'tags'],
            presets: ['title', 'emoji', 'items', 'templateId'],
            templates: ['name', 'config', 'isBuiltin'],
        };

        const entity = null; // ditentukan dari pemanggil
        const keys = ALLOWED_KEYS[arguments[2]] || Object.keys(ALLOWED_KEYS.roles);
        const clean = {};

        for (const k of keys) {
            if (data[k] !== undefined) {
                clean[k] = data[k];
            }
        }

        // Type coercion ringan
        if (clean.title !== undefined) clean.title = String(clean.title).slice(0, 200);
        if (clean.content !== undefined) clean.content = String(clean.content).slice(0, 500000);
        if (clean.emoji !== undefined) clean.emoji = String(clean.emoji).slice(0, 8);
        if (clean.tags !== undefined && !Array.isArray(clean.tags)) clean.tags = [];

        return { ...existing, ...clean, updatedAt: new Date().toISOString() };
    }

    _allowedFields(entity) {
        switch (entity) {
            case 'roles': return ['title', 'content', 'emoji', 'sortOrder'];
            case 'contexts': return ['title', 'content', 'emoji', 'sortOrder', 'tags'];
            case 'presets': return ['title', 'emoji', 'items', 'templateId'];
            case 'templates': return ['name', 'config', 'isBuiltin'];
            default: return ['title', 'content', 'emoji'];
        }
    }

    _pick(data, fields) {
        const clean = {};
        for (const k of fields) {
            if (data[k] !== undefined) clean[k] = data[k];
        }
        return clean;
    }

    async update(entity, id, data) {
        const items = this._read(entity);
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return null;

        const allowed = this._allowedFields(entity);
        const clean = this._pick(data, allowed);

        items[idx] = { ...items[idx], ...clean, updatedAt: new Date().toISOString() };
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
        const allowed = this._allowedFields(entity);

        for (const data of arr) {
            if (!data || typeof data !== 'object') continue;
            const clean = this._pick(data, allowed);

            // Pastikan id, createdAt, updatedAt ada
            if (!data.id || typeof data.id !== 'string') continue;

            const idx = items.findIndex(i => i.id === data.id);
            if (idx >= 0) {
                items[idx] = { ...items[idx], ...clean, updatedAt: new Date().toISOString() };
            } else {
                items.push({
                    ...clean,
                    id: data.id,
                    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }
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

    _sanitizeArray(arr, entity) {
        if (!Array.isArray(arr)) return [];

        const MAX = MAX_IMPORT_ITEMS || 1000;
        const now = new Date().toISOString();

        return arr.slice(0, MAX)
            .filter(function (item) {
                return item && typeof item === 'object' && !Array.isArray(item);
            })
            .map(function (raw) {
                // Whitelist per entity
                var clean = {
                    id: typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 64
                        ? raw.id
                        : CS.generateId(entity.charAt(0)),
                    title: typeof raw.title === 'string' ? raw.title.slice(0, 200) : 'Untitled',
                    emoji: typeof raw.emoji === 'string' ? raw.emoji.slice(0, 8) : '',
                    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt.slice(0, 40) : now,
                    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt.slice(0, 40) : now,
                };

                if (entity === 'roles' || entity === 'contexts') {
                    clean.content = typeof raw.content === 'string' ? raw.content.slice(0, 500000) : '';
                    clean.sortOrder = Number.isFinite(raw.sortOrder) ? raw.sortOrder : 0;
                }
                if (entity === 'contexts') {
                    clean.tags = Array.isArray(raw.tags)
                        ? raw.tags.slice(0, 20).map(function (t) { return String(t).slice(0, 50); })
                        : [];
                }
                if (entity === 'presets') {
                    clean.items = Array.isArray(raw.items)
                        ? raw.items.slice(0, 50).filter(function (i) {
                            return i && typeof i === 'object';
                        }).map(function (i) {
                            return {
                                type: i.type === 'role' ? 'role' : 'context',
                                refId: typeof i.refId === 'string' ? i.refId.slice(0, 64) : '',
                            };
                        })
                        : [];
                    clean.templateId = typeof raw.templateId === 'string'
                        ? raw.templateId.slice(0, 64)
                        : 't_default';
                }
                if (entity === 'templates') {
                    clean.name = typeof raw.name === 'string' ? raw.name.slice(0, 100) : 'Unknown';
                    clean.isBuiltin = raw.isBuiltin === true;
                    clean.config = {};
                    if (raw.config && typeof raw.config === 'object') {
                        var keys = ['separator', 'roleHeader', 'roleFooter', 'contextHeader',
                            'contextFooter', 'outputPrefix', 'outputSuffix', 'wrapInCodeBlock'];
                        keys.forEach(function (k) {
                            if (k === 'wrapInCodeBlock') {
                                clean.config[k] = raw.config[k] === true;
                            } else if (typeof raw.config[k] === 'string') {
                                clean.config[k] = raw.config[k].slice(0, 2000);
                            } else {
                                clean.config[k] = '';
                            }
                        });
                    }
                }

                return clean;
            });
    }

    async importAll(data, mode) {
        const entities = ['roles', 'contexts', 'presets', 'templates'];

        if (mode === 'replace') {
            for (const entity of entities) {
                this._write(entity, this._sanitizeArray(data[entity] || [], entity));
            }
        } else {
            for (const entity of entities) {
                if (!data[entity]) continue;
                const cleanItems = this._sanitizeArray(data[entity], entity);
                const existing = this._read(entity);
                const existingIds = new Set(existing.map(function (i) { return i.id; }));
                const toAdd = cleanItems.filter(function (i) { return !existingIds.has(i.id); });
                if (toAdd.length) {
                    existing.push.apply(existing, toAdd);
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