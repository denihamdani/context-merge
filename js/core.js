/* 
    # Copyright (c) 2026 Deni Hamdani
    # SPDX-License-Identifier: MIT

    ============================================
    Core: Constants + EventBus + ID Generator
    ============================================ 
*/

window.CS = window.CS || {};

/* ── CONSTANTS ── */
CS.CONST = {
    STORAGE_PREFIX: 'cs_',
    DATA_VERSION: 1,
    MAX_TITLE_LEN: 100,
    MAX_HISTORY: 30,
    BACKUP_REMIND_THRESHOLD: 15,
    TOKEN_BUDGET: 8000,
    DEFAULT_EMOJI: { role: '🎭', context: '📄', preset: '📌' },
};

/* ── EVENT BUS ── */
CS.EventBus = (function () {
    const listeners = {};
    return {
        on(event, fn) {
            (listeners[event] = listeners[event] || []).push(fn);
        },
        emit(event, data) {
            (listeners[event] || []).forEach(fn => fn(data));
        },
    };
})();

/* ── ID GENERATOR ── */
CS.generateId = function (prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};