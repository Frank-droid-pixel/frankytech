
/**
 * FRANKY TECH — Admin Announcements Page
 * -----------------------------------------------------------
 * IMPORTANT:
 * AdminShell.init() MUST run before accessing elements that
 * are loaded dynamically from admin/announcements.html.
 * -----------------------------------------------------------
 */

(function () {
  let list = null;
  let newBtn = null;
  let modalOverlay = null;
  let modalClose = null;
  let form = null;
  let saveBtn = null;

  /**
   * -----------------------------------------------------------
   * Get page elements
   * -----------------------------------------------------------
   */
  function cacheElements() {
    list = document.getElementById('list');
    newBtn = document.getElementById('newBtn');
    modalOverlay = document.getElementById('modalOverlay');
    modalClose = document.getElementById('modalClose');
    form = document.getElementById('form');
    saveBtn = document.getElementById('saveBtn');
  }

  /**
   * -----------------------------------------------------------
   * Verify that all required elements exist
   * -----------------------------------------------------------
   */
  function validateElements() {
    const missing = [];

    if (!list) missing.push('#list');
    if (!newBtn) missing.push('#newBtn');
    if (!modalOverlay) missing.push('#modalOverlay');
    if (!modalClose) missing.push('#modalClose');
    if (!form) missing.push('#form');
    if (!saveBtn) missing.push('#saveBtn');

    if (missing.length > 0) {
      console.error(
        'FRANKY TECH — Admin Announcements: Missing elements:',
        missing.join(', ')
      );

      return false;
    }

    return true;
  }

  /**
   * -----------------------------------------------------------
   * Render announcements
   * -----------------------------------------------------------
   */
  function render(items) {
    if (!Array.isArray(items)) {
      items = [];
    }

    if (items.length === 0) {
      list.innerHTML = `
        <div class="dash-empty">
          No announcements yet.
        </div>
      `;

      return;
    }

    list.innerHTML = items.map((a) => `
      <div
        class="dash-panel"
        style="margin-bottom:14px; max-width:700px;"
      >
        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
          "
        >
          <h3 style="margin:0;">
            ${FrankyAuth.escapeHtml(a.title || '')}
          </h3>

          <label
            style="
              font-size:var(--small);
              display:flex;
              align-items:center;
              gap:6px;
            "
          >
            <input
              type="checkbox"
              data-toggle="${a.id}"
              ${a.is_active ? 'checked' : ''}
            >

            Active
          </label>
        </div>

        <p style="margin-top:8px;">
          ${FrankyAuth.escapeHtml(a.body || '')}
        </p>
      </div>
    `).join('');

    /**
     * ---------------------------------------------------------
     * Active/inactive switches
     * ---------------------------------------------------------
     */
    list
      .querySelectorAll('[data-toggle]')
      .forEach((checkbox) => {

        checkbox.addEventListener('change', async () => {

          try {
            checkbox.disabled = true;

            await FrankyAuth.api(
              `/api/admin/announcements/${checkbox.dataset.toggle}/active`,
              {
                method: 'PATCH',
                body: JSON.stringify({
                  isActive: checkbox.checked
                })
              }
            );

            if (window.frankyToast) {
              window.frankyToast('✓ Updated');
            }

          } catch (err) {

            console.error(
              'Failed to update announcement:',
              err
            );

            /*
             * Restore previous state if request fails.
             */
            checkbox.checked = !checkbox.checked;

            if (window.frankyToast) {
              window.frankyToast(
                'Unable to update announcement'
              );
            }

          } finally {
            checkbox.disabled = false;
          }
        });
      });
  }

  /**
   * -----------------------------------------------------------
   * Load announcements
   * -----------------------------------------------------------
   */
  async function load() {
    try {

      const response = await FrankyAuth.api(
        '/api/admin/announcements'
      );

      const announcements =
        response.announcements || [];

      render(announcements);

    } catch (err) {

      console.error(
        'Failed to load announcements:',
        err
      );

      list.innerHTML = `
        <div class="dash-empty">
          Unable to load announcements.
        </div>
      `;
    }
  }

  /**
   * -----------------------------------------------------------
   * Open modal
   * -----------------------------------------------------------
   */
  function openModal() {
    form.reset();

    modalOverlay.classList.add('open');

    /*
     * Focus the first form field if available.
     */
    const firstInput =
      form.querySelector(
        'input:not([type="hidden"]), textarea, select'
      );

    if (firstInput) {
      setTimeout(() => {
        firstInput.focus();
      }, 50);
    }
  }

  /**
   * -----------------------------------------------------------
   * Close modal
   * -----------------------------------------------------------
   */
  function closeModal() {
    modalOverlay.classList.remove('open');
  }

  /**
   * -----------------------------------------------------------
   * Setup event listeners
   * -----------------------------------------------------------
   */
  function setupEventListeners() {

    /*
     * New announcement button
     */
    newBtn.addEventListener('click', () => {
      openModal();
    });

    /*
     * Close button
     */
    modalClose.addEventListener('click', () => {
      closeModal();
    });

    /*
     * Close when clicking outside modal
     */
    modalOverlay.addEventListener('click', (e) => {

      if (e.target === modalOverlay) {
        closeModal();
      }

    });

    /*
     * Close modal with Escape key
     */
    document.addEventListener('keydown', (e) => {

      if (e.key === 'Escape') {
        closeModal();
      }

    });

    /*
     * Submit announcement form
     */
    form.addEventListener('submit', async (e) => {

      e.preventDefault();

      FrankyAuth.setLoading(
        saveBtn,
        true
      );

      const data = Object.fromEntries(
        new FormData(form).entries()
      );

      try {

        await FrankyAuth.api(
          '/api/admin/announcements',
          {
            method: 'POST',
            body: JSON.stringify(data)
          }
        );

        closeModal();

        if (window.frankyToast) {
          window.frankyToast(
            '✓ Announcement published'
          );
        }

        await load();

      } catch (err) {

        console.error(
          'Failed to publish announcement:',
          err
        );

        /*
         * If your FrankyAuth has showAlert and the form
         * contains an alert element, display the error.
         */
        const alertEl =
          form.querySelector('[data-form-alert]') ||
          form.querySelector('.form-alert');

        if (alertEl && FrankyAuth.showAlert) {
          FrankyAuth.showAlert(
            alertEl,
            err.message || 'Unable to publish announcement.'
          );
        } else if (window.frankyToast) {
          window.frankyToast(
            err.message ||
            'Unable to publish announcement.'
          );
        }

      } finally {

        FrankyAuth.setLoading(
          saveBtn,
          false
        );

      }
    });
  }

  /**
   * -----------------------------------------------------------
   * INITIALIZATION
   * -----------------------------------------------------------
   */
  async function init() {

    try {

      /*
       * IMPORTANT:
       * AdminShell MUST load the page content first.
       */
      const ctx =
        await AdminShell.init(
          'admin/announcements.html'
        );

      if (!ctx) {
        console.warn(
          'FRANKY TECH — AdminShell returned no context.'
        );

        return;
      }

      /*
       * ONLY NOW do we search for elements.
       */
      cacheElements();

      /*
       * Make sure the HTML contains everything
       * this JavaScript expects.
       */
      if (!validateElements()) {
        return;
      }

      /*
       * Attach event listeners.
       */
      setupEventListeners();

      /*
       * Load announcements from backend.
       */
      await load();

    } catch (err) {

      console.error(
        'FRANKY TECH — Admin Announcements initialization failed:',
        err
      );

    }
  }

  /*
   * Start the page.
   */
  init();

})();