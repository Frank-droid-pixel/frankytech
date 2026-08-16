/**
 * FRANKY TECH — Landing Page JavaScript
 * Vanilla JS only, per the platform's frontend stack rules.
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
   * Footer year
   * --------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
   * Mobile nav toggle
   * --------------------------------------------------------- */
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------
   * Theme toggle (light / dark), persisted in memory + storage
   * --------------------------------------------------------- */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem('franky-tech-theme');
    } catch (e) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem('franky-tech-theme', theme);
    } catch (e) {
      /* Storage may be unavailable (e.g. private mode) — fail silently. */
    }
  }

  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = getStoredTheme() || (systemPrefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* ---------------------------------------------------------
   * Scroll-reveal animations (IntersectionObserver)
   * --------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------------------------------------------------------
   * Feature cards (data-driven, not hard-coded markup)
   * --------------------------------------------------------- */
  const FEATURES = [
    { name: 'Invoices', desc: 'Create, send and track professional invoices in seconds.', icon: 'M4 4h12l4 4v12H4Z M16 4v4h4' },
    { name: 'Quotations', desc: 'Send quotes customers can accept online, then convert to invoices.', icon: 'M9 3h6l1 4H8ZM6 7h12v14H6Z' },
    { name: 'Receipts', desc: 'Generate receipts automatically the moment a payment is recorded.', icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2Z' },
    { name: 'Customers', desc: 'Keep every customer, invoice and balance organized in one view.', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20a8 8 0 0 1 16 0' },
    { name: 'Products', desc: 'Manage pricing, stock and categories for everything you sell.', icon: 'M3 7l9-4 9 4-9 4-9-4Z M3 7v10l9 4 9-4V7' },
    { name: 'Inventory', desc: 'Get notified automatically when stock runs low.', icon: 'M4 20V10M11 20V4M18 20v-7' },
    { name: 'Expenses', desc: 'Track spending by category and attach receipts for records.', icon: 'M3 10h18M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
    { name: 'Payments', desc: 'Record cash, transfer, mobile money and online payments.', icon: 'M3 6h18v12H3Z M3 10h18' },
    { name: 'Reports', desc: 'See sales, expenses and profit clearly, exportable any time.', icon: 'M4 20V10M11 20V4M18 20v-7' },
    { name: 'Reviews', desc: 'Collect verified customer reviews and reply publicly.', icon: 'M12 17.3 6.2 20l1.1-6.5L2.5 9l6.5-1L12 2l3 6 6.5 1-4.8 4.5L17.8 20Z' },
    { name: 'Referrals', desc: 'Earn rewards for every business you bring to FRANKY TECH.', icon: 'M8 12h8M8 12a4 4 0 1 1 4-4M16 12a4 4 0 1 0-4 4' },
    { name: 'Customer Portal', desc: 'Give customers a secure place to view their own documents.', icon: 'M4 4h16v16H4Z M8 4v16' },
    { name: 'Automation', desc: 'Let overdue invoices, low stock and reviews trigger themselves.', icon: 'M4 12a8 8 0 1 1 3 6.2 M4 12v5h5' },
    { name: 'Analytics', desc: 'Understand what your numbers actually mean, not just see them.', icon: 'M4 20V10M11 20V4M18 20v-7' },
  ];

  const featureGrid = document.getElementById('featureGrid');
  if (featureGrid) {
    featureGrid.innerHTML = FEATURES.map(
      (f) => `
      <div class="feature-card reveal">
        <div class="fi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="${f.icon}"/></svg></div>
        <h3>${f.name}</h3>
        <p>${f.desc}</p>
      </div>`
    ).join('');

    // Re-observe newly injected reveal elements.
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      const obs2 = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in-view'); obs2.unobserve(e.target); } }),
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );
      featureGrid.querySelectorAll('.reveal').forEach((el) => obs2.observe(el));
    } else {
      featureGrid.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
    }
  }

  /* ---------------------------------------------------------
   * Pricing placeholder cards
   * Real prices, currency and limits are database-driven and
   * will replace this static preview in the Subscriptions phase.
   * --------------------------------------------------------- */
  const PLANS = [
    { name: 'Free', price: '0', note: 'forever', features: ['1 business', '20 invoices / month', 'Basic reports', 'Community support'], cta: 'Start Free', featured: false },
    { name: 'Starter', price: '—', note: 'per month', features: ['1 business', 'Unlimited invoices', 'Inventory tracking', 'Email support'], cta: 'Choose Starter', featured: false },
    { name: 'Business', price: '—', note: 'per month', features: ['Up to 3 businesses', 'Team members', 'Recurring invoices', 'Priority support'], cta: 'Choose Business', featured: true },
    { name: 'Pro', price: '—', note: 'per month', features: ['Unlimited businesses', 'Advanced analytics', 'API access', 'Dedicated support'], cta: 'Choose Pro', featured: false },
  ];

  const pricingGrid = document.getElementById('pricingGrid');
  if (pricingGrid) {
    pricingGrid.innerHTML = PLANS.map(
      (p) => `
      <div class="price-card reveal${p.featured ? ' featured' : ''}">
        <h3>${p.name}</h3>
        <div class="price">${p.price === '0' ? 'Free' : p.price}${p.price !== '0' ? '<small>' + p.note + '</small>' : ''}</div>
        <ul>
          ${p.features.map((f) => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>${f}</li>`).join('')}
        </ul>
        <a href="/register.html" class="btn ${p.featured ? 'btn-accent' : 'btn-ghost'} btn-block">${p.cta}</a>
      </div>`
    ).join('');
  }

  /* ---------------------------------------------------------
   * Contact + social — populated from the server so the real
   * links live in one place (server/routes + .env), never
   * duplicated across the frontend.
   * --------------------------------------------------------- */
  function buildWhatsAppUrl(number, message) {
    const cleanNumber = String(number || '').replace(/[^\d]/g, '');
    const text = encodeURIComponent(message || 'Hello FRANKY TECH, I would like to learn more about your platform.');
    return `https://wa.me/${cleanNumber}?text=${text}`;
  }

  const socialIcon = {
    facebook: 'M13 22v-8h3l1-4h-4V7.5C13 6.2 13.5 5 15.6 5H17V1.6C16.6 1.5 15.3 1.4 14 1.4 11.2 1.4 9 3.1 9 6.3V10H6v4h3v8Z',
    tiktok: 'M14 3v10.5a3 3 0 1 1-2-2.83V3h2ZM14 3c.3 2 1.8 3.5 4 3.8V9c-1.5 0-2.9-.5-4-1.4',
    instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
    youtube: 'M22 12s0-3.4-.4-5A3 3 0 0 0 19.5 5C17.4 4.8 12 4.8 12 4.8s-5.4 0-7.5.2A3 3 0 0 0 2.4 7C2 8.6 2 12 2 12s0 3.4.4 5a3 3 0 0 0 2.1 2c2.1.2 7.5.2 7.5.2s5.4 0 7.5-.2a3 3 0 0 0 2.1-2c.4-1.6.4-5 .4-5ZM10 15.5v-7l6 3.5Z',
    whatsapp: 'M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Z',
  };

  function iconSvg(pathD) {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${pathD}"/></svg>`;
  }

  async function loadPublicConfig() {
    // Sensible fallbacks in case /api/config/public is unreachable —
    // the landing page must never fully break because of this.
    let config = {
      whatsappNumber: '237670113284',
      social: {
        facebook: 'https://www.facebook.com/profile.php?id=61592926179073',
        tiktok: 'https://www.tiktok.com/@franky.s44',
        instagram: 'https://www.instagram.com/franky_stylish65?igsh=c3Fsb3N5YWdvb2Fw',
        youtube: 'https://youtube.com/@franky_stylish?si=nG6GonfckborRPBe',
      },
    };

    try {
      const res = await fetch('/api/config/public');
      if (res.ok) {
        const data = await res.json();
        config = { ...config, ...data, social: { ...config.social, ...data.social } };
      }
    } catch (e) {
      /* Use fallback config silently — no need to alarm the visitor. */
    }

    // WhatsApp floating button + contact card
    const waUrl = buildWhatsAppUrl(config.whatsappNumber);
    const waFloat = document.getElementById('waFloat');
    if (waFloat) waFloat.href = waUrl;

    const contactMethods = document.getElementById('contactMethods');
    if (contactMethods) {
      contactMethods.innerHTML = `
        <a class="btn whatsapp-btn btn-block" href="${waUrl}" target="_blank" rel="noopener noreferrer">
          ${iconSvg(socialIcon.whatsapp)} Chat with FRANKY TECH on WhatsApp
        </a>`;
    }

    // Social row (footer) + social methods (contact card)
    const socialEntries = [
      ['facebook', 'Facebook', config.social.facebook],
      ['tiktok', 'TikTok', config.social.tiktok],
      ['instagram', 'Instagram', config.social.instagram],
      ['youtube', 'YouTube', config.social.youtube],
    ].filter(([, , url]) => !!url);

    const socialRow = document.getElementById('socialRow');
    if (socialRow) {
      socialRow.innerHTML = socialEntries
        .map(([key, label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${iconSvg(socialIcon[key])}</a>`)
        .join('');
    }

    const socialMethods = document.getElementById('socialMethods');
    if (socialMethods) {
      socialMethods.innerHTML = socialEntries
        .map(
          ([key, label, url]) => `
        <a class="contact-method" href="${url}" target="_blank" rel="noopener noreferrer">
          <span class="ci">${iconSvg(socialIcon[key])}</span> ${label}
        </a>`
        )
        .join('');
    }
  }

  loadPublicConfig();

  /* ---------------------------------------------------------
   * Toast helper (foundation for "✓ Invoice created" etc. in
   * later phases). Exposed globally as window.frankyToast.
   * --------------------------------------------------------- */
  window.frankyToast = function frankyToast(message, timeout = 3200) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="dot"></span><span>${message}</span>`;
    region.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 220);
    }, timeout);
  };
})();
