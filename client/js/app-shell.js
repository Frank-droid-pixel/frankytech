/**
 * FRANKY TECH — Shared App Shell
 * -----------------------------------------------------------
 * Renders the sidebar + topbar into #appShellRoot so every
 * authenticated page shares one implementation.
 *
 * IMPORTANT:
 * Page content inside #pageContentTemplate is moved into
 * #appContent BEFORE AppShell.init() resolves.
 * -----------------------------------------------------------
 */

const AppShell = (function () {

  const NAV_ITEMS = [
    ['dashboard.html', 'Dashboard', 'M3 3h8v8H3ZM13 3h8v5h-8ZM13 12h8v9h-8ZM3 15h8v6H3Z'],
    ['customers.html', 'Customers', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0'],
    ['products.html', 'Products', 'M3 7l9-4 9 4-9 4-9-4ZM3 7v10l9 4 9-4V7'],
    ['invoices.html', 'Invoices', 'M4 4h12l4 4v12H4ZM16 4v4h4'],
    ['quotations.html', 'Quotations', 'M9 3h6l1 4H8ZM6 7h12v14H6Z'],
    ['receipts.html', 'Receipts', 'M6 3h12v18l-3-2-3 2-3-2-3 2Z'],
    ['expenses.html', 'Expenses', 'M3 6h18v12H3ZM3 10h18'],
    ['reports.html', 'Reports', 'M4 20V10M11 20V4M18 20v-7'],
    ['reviews.html', 'Reviews', 'M12 17.3 6.2 20l1.1-6.5L2.5 9l6.5-1L12 2l3 6 6.5 1-4.8 4.5L17.8 20Z'],
    ['referrals.html', 'Referrals', 'M8 12h8M8 12a4 4 0 1 1 4-4M16 12a4 4 0 1 0-4 4'],
    ['team.html', 'Team', 'M17 20v-2a4 4 0 0 0-3-3.87M9 20v-2a4 4 0 0 1 4-4M9 20H4v-2a4 4 0 0 1 4-4M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'],
    ['support.html', 'Support', 'M12 18h.01M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 5'],
    ['subscription.html', 'Subscription', 'M3 6h18v12H3ZM3 10h18'],
  ];

  function iconSvg(pathD) {
    return `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      >
        <path d="${pathD}"/>
      </svg>
    `;
  }

  function initials(name) {
    return String(name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  function render(activePage) {

    const root =
      document.getElementById('appShellRoot');

    if (!root) {
      console.error(
        'FRANKY TECH AppShell: #appShellRoot was not found.'
      );
      return;
    }

    root.innerHTML = `
      <div class="app-shell">

        <aside class="app-sidebar">

          <div class="brand">
            <img
              src="/assets/logo/icon.png"
              width="32"
              height="32"
              alt="FRANKY TECH"
            >
            <span class="w">
              FRANKY<span> TECH</span>
            </span>
          </div>

          <nav class="app-nav" id="appNav">
            ${NAV_ITEMS.map(([href, label, icon]) => `
              <a
                href="/${href}"
                class="${href === activePage ? 'active' : ''}"
              >
                ${iconSvg(icon)}
                ${label}
              </a>
            `).join('')}
          </nav>

        </aside>

        <div class="app-main">

          <header class="app-topbar">

            <div class="biz-switcher">

              <button
                type="button"
                id="bizSwitcherBtn"
              >
                <span id="bizName">Loading…</span>

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              <div
                class="biz-switcher-menu"
                id="bizSwitcherMenu"
              ></div>

            </div>

            <div class="topbar-actions">

              <div
                class="biz-switcher"
                id="notifWrap"
              >

                <button
                  type="button"
                  id="notifBtn"
                  style="position:relative;"
                >

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
                  </svg>

                  <span
                    id="notifDot"
                    style="
                      display:none;
                      position:absolute;
                      top:2px;
                      right:2px;
                      width:8px;
                      height:8px;
                      border-radius:50%;
                      background:var(--danger);
                    "
                  ></span>

                </button>

                <div
                  class="biz-switcher-menu"
                  id="notifMenu"
                  style="
                    width:320px;
                    max-height:400px;
                    overflow-y:auto;
                  "
                ></div>

              </div>

              <button
                class="theme-toggle"
                id="themeToggle"
                type="button"
                aria-label="Toggle dark mode"
              >

                <svg
                  class="icon-sun"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
                </svg>

                <svg
                  class="icon-moon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>
                </svg>

              </button>

              <div class="user-chip">

                <span
                  class="avatar"
                  id="userAvatar"
                >
                  ?
                </span>

                <span id="userName">—</span>

              </div>

              <button
                class="btn btn-ghost"
                id="logoutBtn"
                type="button"
              >
                Log out
              </button>

            </div>

          </header>

          <main
            class="dash-content"
            id="appContent"
          ></main>

        </div>

      </div>
    `;

    /*
     * -------------------------------------------------------
     * IMPORTANT:
     * Move page content from the template AFTER the shell
     * has been created.
     * -------------------------------------------------------
     */

    const template =
      document.getElementById('pageContentTemplate');

    const appContent =
      document.getElementById('appContent');

    if (template && appContent) {

      appContent.appendChild(
        template.content.cloneNode(true)
      );

    } else {

      console.warn(
        'FRANKY TECH AppShell: pageContentTemplate or appContent is missing.'
      );

    }

    /*
     * -------------------------------------------------------
     * Theme
     * -------------------------------------------------------
     */

    const themeToggle =
      document.getElementById('themeToggle');

    const root2 =
      document.documentElement;

    function applyTheme(theme) {

      if (theme === 'dark') {
        root2.setAttribute('data-theme', 'dark');
      } else {
        root2.removeAttribute('data-theme');
      }

    }

    let stored = null;

    try {
      stored =
        localStorage.getItem(
          'franky-tech-theme'
        );
    } catch (e) {
      stored = null;
    }

    let preferredTheme = 'light';

    try {
      preferredTheme =
        window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches
          ? 'dark'
          : 'light';
    } catch (e) {
      preferredTheme = 'light';
    }

    applyTheme(
      stored || preferredTheme
    );

    if (themeToggle) {

      themeToggle.addEventListener(
        'click',
        () => {

          const next =
            root2.getAttribute('data-theme') === 'dark'
              ? 'light'
              : 'dark';

          applyTheme(next);

          try {
            localStorage.setItem(
              'franky-tech-theme',
              next
            );
          } catch (e) {
            // Ignore storage errors.
          }

        }
      );

    }

    /*
     * -------------------------------------------------------
     * Logout
     * -------------------------------------------------------
     */

    const logoutBtn =
      document.getElementById('logoutBtn');

    if (logoutBtn) {

      logoutBtn.addEventListener(
        'click',
        () => FrankyAuth.logout()
      );

    }

    /*
     * -------------------------------------------------------
     * Business switcher
     * -------------------------------------------------------
     */

    const bizBtn =
      document.getElementById('bizSwitcherBtn');

    const bizMenu =
      document.getElementById('bizSwitcherMenu');

    if (bizBtn && bizMenu) {

      bizBtn.addEventListener(
        'click',
        (e) => {

          e.stopPropagation();

          bizMenu.classList.toggle(
            'open'
          );

        }
      );

      document.addEventListener(
        'click',
        (e) => {

          if (
            !bizBtn.contains(e.target) &&
            !bizMenu.contains(e.target)
          ) {
            bizMenu.classList.remove('open');
          }

        }
      );

    }
  }

  function timeAgo(dateStr) {

    const diffMs =
      Date.now() -
      new Date(dateStr).getTime();

    const mins =
      Math.floor(diffMs / 60000);

    if (mins < 1) {
      return 'just now';
    }

    if (mins < 60) {
      return `${mins}m ago`;
    }

    const hrs =
      Math.floor(mins / 60);

    if (hrs < 24) {
      return `${hrs}h ago`;
    }

    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function initNotifications() {

    const notifBtn =
      document.getElementById('notifBtn');

    const notifMenu =
      document.getElementById('notifMenu');

    const notifDot =
      document.getElementById('notifDot');

    if (!notifBtn || !notifMenu || !notifDot) {
      return;
    }

    async function loadNotifications() {

      try {

        const businessId =
          window.__frankyBusinessId;

        if (!businessId) {
          return;
        }

        const {
          items,
          unread
        } = await FrankyAuth.api(
          `/api/notifications?businessId=${businessId}`
        );

        notifDot.style.display =
          unread > 0
            ? 'block'
            : 'none';

        notifMenu.innerHTML =
          items.length === 0

            ? `
              <div
                style="
                  padding:16px;
                  font-size:var(--small);
                  color:var(--text-muted);
                "
              >
                No notifications yet.
              </div>
            `

            : items.map((n) => `
              <a
                href="${n.link || '#'}"
                data-id="${n.id}"
                style="
                  display:block;
                  padding:12px 14px;
                  border-bottom:1px solid var(--border);
                  ${n.is_read ? 'opacity:0.6;' : ''}
                "
              >

                <div
                  style="
                    font-weight:600;
                    font-size:var(--small);
                  "
                >
                  ${FrankyAuth.escapeHtml(n.title)}
                </div>

                ${
                  n.message
                    ? `
                      <div
                        style="
                          font-size:var(--caption);
                          color:var(--text-muted);
                          margin-top:2px;
                        "
                      >
                        ${FrankyAuth.escapeHtml(n.message)}
                      </div>
                    `
                    : ''
                }

                <div
                  style="
                    font-size:var(--caption);
                    color:var(--text-muted);
                    margin-top:4px;
                  "
                >
                  ${timeAgo(n.created_at)}
                </div>

              </a>
            `).join('');

        notifMenu
          .querySelectorAll(
            'a[data-id]'
          )
          .forEach((a) => {

            a.addEventListener(
              'click',
              async () => {

                await FrankyAuth.api(
                  `/api/notifications/${a.dataset.id}/read?businessId=${businessId}`,
                  {
                    method: 'POST'
                  }
                );

              }
            );

          });

      } catch (e) {

        console.warn(
          'FRANKY TECH: Notifications failed silently.',
          e
        );

      }
    }

    notifBtn.addEventListener(
      'click',
      (e) => {

        e.stopPropagation();

        notifMenu.classList.toggle(
          'open'
        );

        if (
          notifMenu.classList.contains(
            'open'
          )
        ) {
          loadNotifications();
        }

      }
    );

    document.addEventListener(
      'click',
      (e) => {

        if (
          !notifBtn.contains(e.target) &&
          !notifMenu.contains(e.target)
        ) {
          notifMenu.classList.remove('open');
        }

      }
    );

    loadNotifications();
  }

  /*
   * ---------------------------------------------------------
   * Main initialization
   * ---------------------------------------------------------
   */

  async function init(activePage) {

    const session =
      await FrankyAuth.requireSession();

    if (!session) {
      return null;
    }

    if (
      !session.businesses ||
      session.businesses.length === 0
    ) {

      window.location.href =
        '/onboarding.html';

      return null;
    }

    /*
     * -------------------------------------------------------
     * IMPORTANT:
     * render() inserts the template into #appContent.
     * This happens BEFORE init() returns.
     * -------------------------------------------------------
     */

    render(activePage);

    /*
     * -------------------------------------------------------
     * Shell user information
     * -------------------------------------------------------
     */

    const userNameEl =
      document.getElementById('userName');

    const userAvatarEl =
      document.getElementById('userAvatar');

    if (userNameEl) {
      userNameEl.textContent =
        session.user.fullName;
    }

    if (userAvatarEl) {
      userAvatarEl.textContent =
        initials(session.user.fullName);
    }

    /*
     * -------------------------------------------------------
     * Current business
     * -------------------------------------------------------
     */

    const currentId =
      session.currentBusinessId ||
      session.businesses[0].id;

    const current =
      session.businesses.find(
        (b) => b.id === currentId
      ) ||
      session.businesses[0];

    window.__frankyBusinessId =
      current.id;

    const bizNameEl =
      document.getElementById('bizName');

    if (bizNameEl) {
      bizNameEl.textContent =
        current.name;
    }

    /*
     * -------------------------------------------------------
     * Platform admin link
     * -------------------------------------------------------
     */

    if (session.user.isPlatformAdmin) {

      const nav =
        document.getElementById('appNav');

      if (nav) {

        nav.insertAdjacentHTML(
          'beforeend',
          `
            <a
              href="/admin/dashboard.html"
              style="
                margin-top:12px;
                border-top:1px solid var(--border);
                padding-top:16px;
                color:var(--accent-dark);
              "
            >
              ${iconSvg(
                'M12 2 4 5v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V5l-8-3Z'
              )}
              Admin panel
            </a>
          `
        );

      }

    }

    /*
     * -------------------------------------------------------
     * Business switcher menu
     * -------------------------------------------------------
     */

    const bizMenu =
      document.getElementById(
        'bizSwitcherMenu'
      );

    if (bizMenu) {

      bizMenu.innerHTML =
        session.businesses.map(
          (b) => `
            <a
              href="#"
              data-id="${b.id}"
            >
              ${FrankyAuth.escapeHtml(b.name)}
              ${b.id === currentId ? ' ✓' : ''}
            </a>
          `
        ).join('') +

        `
          <a
            href="/onboarding.html"
            style="
              border-top:1px solid var(--border);
              color:var(--primary);
              font-weight:600;
            "
          >
            + Add another business
          </a>
        `;

      bizMenu
        .querySelectorAll(
          'a[data-id]'
        )
        .forEach((a) => {

          a.addEventListener(
            'click',
            async (e) => {

              e.preventDefault();

              await FrankyAuth.api(
                `/api/businesses/${a.dataset.id}/select`,
                {
                  method: 'POST'
                }
              );

              window.location.reload();

            }
          );

        });

    }

    /*
     * -------------------------------------------------------
     * Notifications
     * -------------------------------------------------------
     */

    await initNotifications();

    /*
     * -------------------------------------------------------
     * Return context to page JavaScript.
     *
     * IMPORTANT:
     * At this point the template has already been inserted
     * into the DOM.
     * -------------------------------------------------------
     */

    return {
      session,
      businessId: current.id,
      currency: current.currency,
      invoicePrefix: current.invoice_prefix
    };
  }

  return {
    init
  };

})();