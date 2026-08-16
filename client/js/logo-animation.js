/**
 * FRANKY TECH — Animated Logo Introduction
 * Plays once per browser session (not on every page navigation,
 * so it never becomes an annoying repeated splash screen).
 * Respects prefers-reduced-motion by skipping straight to the
 * finished state.
 */
(function () {
  'use strict';

  const intro = document.getElementById('logo-intro');
  if (!intro) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let alreadyShown = false;
  try {
    alreadyShown = sessionStorage.getItem('franky-tech-intro-shown') === '1';
  } catch (e) {
    alreadyShown = false;
  }

  function dismiss() {
    intro.classList.add('hidden');
    setTimeout(() => intro.remove(), 420);
  }

  if (alreadyShown || prefersReducedMotion) {
    dismiss();
    return;
  }

  intro.classList.add('intro-anim');

  try {
    sessionStorage.setItem('franky-tech-intro-shown', '1');
  } catch (e) {
    /* Storage unavailable — animation will simply replay on next load. */
  }

  // Total animation ~1.1s, then hold briefly before transitioning out.
  setTimeout(dismiss, 1300);
})();
