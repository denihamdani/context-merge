/*
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT

    ============================================
    App: Entry Point, Responsive Controller & Initialization
    ============================================
*/

// Baris pertama di app.js (sebelum IIFE responsive)
if (window.top !== window.self) {
    try {
        window.top.location.replace(window.self.location.href);
    } catch (_) {
        document.documentElement.style.display = 'none';
        document.body.innerHTML = '';
    }
}

// ── IMMEDIATE: prevent flash on mobile (runs before DOMContentLoaded) ──
(function () {
    if (window.matchMedia('(max-width: 767px)').matches) {
        document.body.classList.add('tab-items');
    }
})();

/* ── RESPONSIVE CONTROLLER ── */
CS.Responsive = {
    mobileMQ: null,
    tabletMQ: null,
    touchMQ: null,
    isMobile: false,
    isTablet: false,
    isTouch: false,

    init() {
        this.mobileMQ = window.matchMedia('(max-width: 767px)');
        this.tabletMQ = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
        this.touchMQ = window.matchMedia('(hover: none)');

        this.isMobile = this.mobileMQ.matches;
        this.isTablet = this.tabletMQ.matches;
        this.isTouch = this.touchMQ.matches;

        this.mobileMQ.addEventListener('change', () => this.handleViewportChange());
        this.tabletMQ.addEventListener('change', () => this.handleViewportChange());

        this.initTabBar();
        this.initDrawer();
        this.initSegmented();
    },

    handleViewportChange() {
        this.isMobile = this.mobileMQ.matches;
        this.isTablet = this.tabletMQ.matches;
        this.isTouch = this.touchMQ.matches;

        if (!this.isTablet) this.closeDrawer();

        if (this.isMobile) {
            var hasTab = document.body.classList.contains('tab-items')
                || document.body.classList.contains('tab-merge')
                || document.body.classList.contains('tab-preview');
            if (!hasTab) {
                document.body.classList.add('tab-items');
            }
        } else {
            document.body.classList.remove('tab-items', 'tab-merge', 'tab-preview');
        }
    },

    initTabBar() {
        var tabBar = document.querySelector('.bottom-tab-bar');
        if (!tabBar) return;

        var tabBtns = tabBar.querySelectorAll('.tab-btn');

        tabBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                CS.Responsive.switchTab(btn.dataset.tab);
            });
        });

        tabBar.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();

            var tabs = Array.from(tabBtns);
            var currentIdx = tabs.findIndex(function (t) {
                return t.classList.contains('active');
            });
            var dir = e.key === 'ArrowRight' ? 1 : -1;
            var nextIdx = (currentIdx + dir + tabs.length) % tabs.length;

            tabs[nextIdx].focus();
            CS.Responsive.switchTab(tabs[nextIdx].dataset.tab);
        });
    },

    switchTab(tabName) {
        document.body.classList.remove('tab-items', 'tab-merge', 'tab-preview');
        document.body.classList.add('tab-' + tabName);

        document.querySelectorAll('.bottom-tab-bar .tab-btn').forEach(function (btn) {
            var isActive = btn.dataset.tab === tabName;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        });

        CS.EventBus.emit('tab:switched', { tab: tabName });
    },

    initDrawer() {
        var toggle = document.getElementById('btn-drawer-toggle');
        var backdrop = document.getElementById('drawer-backdrop');

        if (toggle) {
            toggle.addEventListener('click', function () {
                var sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('drawer-open')) {
                    CS.Responsive.closeDrawer();
                } else {
                    CS.Responsive.openDrawer();
                }
            });
        }

        if (backdrop) {
            backdrop.addEventListener('click', function () {
                CS.Responsive.closeDrawer();
            });
        }
    },

    openDrawer() {
        var sidebar = document.getElementById('sidebar');
        var backdrop = document.getElementById('drawer-backdrop');
        var toggle = document.getElementById('btn-drawer-toggle');

        if (sidebar) sidebar.classList.add('drawer-open');
        if (backdrop) backdrop.classList.remove('hidden');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
    },

    closeDrawer() {
        var sidebar = document.getElementById('sidebar');
        var backdrop = document.getElementById('drawer-backdrop');
        var toggle = document.getElementById('btn-drawer-toggle');

        if (sidebar) sidebar.classList.remove('drawer-open');
        if (backdrop) backdrop.classList.add('hidden');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    },

    initSegmented() {
        var segBtns = document.querySelectorAll('.sidebar-segmented .seg-btn');

        segBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var section = btn.dataset.section;

                segBtns.forEach(function (b) {
                    var isActive = b.dataset.section === section;
                    b.classList.toggle('active', isActive);
                    b.setAttribute('aria-selected', String(isActive));
                });

                document.querySelectorAll('.sidebar-section').forEach(function (s) {
                    s.classList.toggle('active', s.id === 'section-' + section);
                });
            });
        });
    },
};

/* ── APP ── */
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
        CS.Responsive.init();

        // Header buttons
        document.getElementById('btn-export').addEventListener('click', function () {
            CS.Utils.exportJSON();
        });
        document.getElementById('btn-import').addEventListener('click', function () {
            document.getElementById('file-import').click();
        });
        document.getElementById('btn-shortcuts').addEventListener('click', function () {
            CS.ModalUI.showModal('modal-shortcuts');
        });

        // File input
        document.getElementById('file-import').addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (file) {
                CS.Utils.importJSON(file);
                e.target.value = '';
            }
        });

        // Initial render
        await CS.SidebarUI.render();
        CS.MergeUI.render();
        CS.MergeUI.triggerMerge();

        console.log('🧠 Context Merger v0.1.0 — Ready!');
    },
};

// ── BOOT ──
document.addEventListener('DOMContentLoaded', function () {
    CS.App.init();
});