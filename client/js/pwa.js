/**
 * FRANKY TECH — PWA Registration (Phase 29)
 * -----------------------------------------------------------
 */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[FRANKY TECH] Service worker registration failed:', err.message);
      });
    });
  }
})();
