/* ============================================
   Repository: Role + Context + Preset + Template
   ============================================ */

CS.RoleRepo = (function () {
    const st = () => CS.Storage.getAdapter();

    return {
        async create(data) {
            const now = new Date().toISOString();
            const role = {
                id: CS.generateId('r'),
                title: data.title || 'Untitled Role',
                content: data.content || '',
                emoji: data.emoji || CS.CONST.DEFAULT_EMOJI.role,
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
            const ctx = {
                id: CS.generateId('c'),
                title: data.title || 'Untitled Konteks',
                content: data.content || '',
                emoji: data.emoji || CS.CONST.DEFAULT_EMOJI.context,
                sortOrder: await st().count('contexts'),
                tags: data.tags || [],
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
            const preset = {
                id: CS.generateId('p'),
                title: data.title || 'Untitled Preset',
                emoji: data.emoji || CS.CONST.DEFAULT_EMOJI.preset,
                items: data.items || [],
                templateId: data.templateId || 't_default',
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