/* 
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT
    
    ============================================
    Repository: Role + Context + Preset + Template
    ============================================ 
*/

CS.validateEntity = {
    title(str, fallback) {
        return (typeof str === 'string' && str.trim().length > 0)
            ? str.trim().slice(0, 200)
            : fallback;
    },

    content(str) {
        return typeof str === 'string' ? str.slice(0, 500000) : '';
    },

    emoji(str, fallback) {
        return (typeof str === 'string' && str.length > 0 && str.length <= 8)
            ? str
            : fallback;
    },

    tags(arr) {
        if (!Array.isArray(arr)) return [];
        return arr
            .slice(0, 20)
            .map(t => String(t).slice(0, 50))
            .filter(t => t.length > 0);
    },
};

CS.RoleRepo = (function () {
    const st = () => CS.Storage.getAdapter();

    return {
        async create(data) {
            const now = new Date().toISOString();
            const v = CS.validateEntity;
            const role = {
                id: CS.generateId('r'),
                title: v.title(data.title, 'Untitled Role'),
                content: v.content(data.content),
                emoji: v.emoji(data.emoji, CS.CONST.DEFAULT_EMOJI.role),
                sortOrder: await st().count('roles'),
                createdAt: now,
                updatedAt: now,
            };
            return st().create('roles', role);
        },
        async findAll() {
            return st().findAll('roles', { orderBy: { field: 'sortOrder' } });
        },
        async findById(id) {
            return st().findById('roles', id);
        },
        async update(id, data) {
            return st().update('roles', id, data);
        },
        async delete(id) {
            return st().delete('roles', id);
        },
    };
})();

CS.ContextRepo = (function () {
    const st = () => CS.Storage.getAdapter();

    return {
        async create(data) {
            const now = new Date().toISOString();
            const v = CS.validateEntity;
            const ctx = {
                id: CS.generateId('c'),
                title: v.title(data.title, 'Untitled Context'),
                content: v.content(data.content),
                emoji: v.emoji(data.emoji, CS.CONST.DEFAULT_EMOJI.context),
                sortOrder: await st().count('contexts'),
                tags: v.tags(data.tags),
                createdAt: now,
                updatedAt: now,
            };
            return st().create('contexts', ctx);
        },
        async findAll() {
            return st().findAll('contexts', { orderBy: { field: 'sortOrder' } });
        },
        async findById(id) {
            return st().findById('contexts', id);
        },
        async update(id, data) {
            return st().update('contexts', id, data);
        },
        async delete(id) {
            return st().delete('contexts', id);
        },
    };
})();

CS.PresetRepo = (function () {
    const st = () => CS.Storage.getAdapter();

    return {
        async create(data) {
            const now = new Date().toISOString();
            const v = CS.validateEntity;

            // Validasi items preset
            const items = Array.isArray(data.items)
                ? data.items.slice(0, 50).filter(i => i && typeof i === 'object').map(i => ({
                    type: i.type === 'role' ? 'role' : 'context',
                    refId: typeof i.refId === 'string' ? i.refId.slice(0, 64) : '',
                }))
                : [];

            const preset = {
                id: CS.generateId('p'),
                title: v.title(data.title, 'Untitled Preset'),
                emoji: v.emoji(data.emoji, CS.CONST.DEFAULT_EMOJI.preset),
                items: items,
                templateId: typeof data.templateId === 'string'
                    ? data.templateId.slice(0, 64)
                    : 't_default',
                createdAt: now,
                updatedAt: now,
            };
            return st().create('presets', preset);
        },
        async findAll() {
            return st().findAll('presets', { orderBy: { field: 'sortOrder' } });
        },
        async findById(id) {
            return st().findById('presets', id);
        },
        async update(id, data) {
            return st().update('presets', id, data);
        },
        async delete(id) {
            return st().delete('presets', id);
        },
    };
})();

CS.TemplateRepo = (function () {
    const st = () => CS.Storage.getAdapter();

    return {
        async findAll() {
            let templates = await st().findAll('templates');
            // Ensure built-in templates exist
            if (templates.length === 0) {
                templates = CS.MergeTemplates.builtins;
                await st().bulkCreate('templates', templates);
            }
            return templates;
        },
        async findById(id) {
            return st().findById('templates', id);
        },
    };
})();