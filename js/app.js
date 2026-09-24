/* ============================================
   App: Entry Point & Initialization
   ============================================ */

CS.App = {
    async init() {
        // Init storage
        await CS.Storage.init();

        // Init built-in templates
        await CS.TemplateRepo.findAll();

        // Init UI modules
        CS.SidebarUI.init();
        CS.MergeUI.init();
        CS.PreviewUI.init();
        CS.ModalUI.init();
        CS.ShortcutsUI.init();
        CS.DragDropUI.init();

        // Header buttons
        document.getElementById('btn-export').addEventListener('click', () => CS.Utils.exportJSON());
        document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
        document.getElementById('btn-shortcuts').addEventListener('click', () => CS.ModalUI.showModal('modal-shortcuts'));

        // File input
        document.getElementById('file-import').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                CS.Utils.importJSON(file);
                e.target.value = ''; // reset
            }
        });

        // Initial render
        await CS.SidebarUI.render();
        CS.MergeUI.render();
        CS.MergeUI.triggerMerge();

        console.log('🧠 Context Studio v0.1.0 — Ready!');
    },
};

// ── BOOT ──
document.addEventListener('DOMContentLoaded', () => CS.App.init());