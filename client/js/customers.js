/**
 * FRANKY TECH — Customers Page
 * -----------------------------------------------------------
 * AppShell.init() MUST run before accessing elements inside
 * #pageContentTemplate.
 * -----------------------------------------------------------
 */

(function () {
  let businessId = null;
  let currency = 'USD';

  let tableBody;
  let emptyState;
  let searchInput;
  let addBtn;
  let modalOverlay;
  let modalClose;
  let modalTitle;
  let form;
  let alertEl;
  let saveBtn;

  function cacheElements() {
    tableBody = document.getElementById('tableBody');
    emptyState = document.getElementById('emptyState');
    searchInput = document.getElementById('searchInput');
    addBtn = document.getElementById('addBtn');
    modalOverlay = document.getElementById('modalOverlay');
    modalClose = document.getElementById('modalClose');
    modalTitle = document.getElementById('modalTitle');
    form = document.getElementById('customerForm');
    alertEl = document.getElementById('formAlert');
    saveBtn = document.getElementById('saveBtn');
  }

  function validateElements() {
    const missing = [];

    if (!tableBody) missing.push('#tableBody');
    if (!emptyState) missing.push('#emptyState');
    if (!searchInput) missing.push('#searchInput');
    if (!addBtn) missing.push('#addBtn');
    if (!modalOverlay) missing.push('#modalOverlay');
    if (!modalClose) missing.push('#modalClose');
    if (!modalTitle) missing.push('#modalTitle');
    if (!form) missing.push('#customerForm');
    if (!alertEl) missing.push('#formAlert');
    if (!saveBtn) missing.push('#saveBtn');

    if (missing.length) {
      console.error(
        'FRANKY TECH — Customers page missing elements:',
        missing
      );
      return false;
    }

    return true;
  }

  function openModal(customer) {
    form.reset();

    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.clearFieldErrors(form);

    if (customer) {
      modalTitle.textContent = 'Edit customer';

      Object.keys(customer).forEach((k) => {
        const camel = k.replace(
          /_([a-z])/g,
          (_, c) => c.toUpperCase()
        );

        const input = form.querySelector(`[name="${camel}"]`);

        if (input) {
          input.value = customer[k] ?? '';
        }
      });

      form.querySelector('[name="id"]').value = customer.id;
    } else {
      modalTitle.textContent = 'Add customer';
      form.querySelector('[name="id"]').value = '';
    }

    modalOverlay.classList.add('open');
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
  }

  function money(n) {
    return `${currency} ${Number(n || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;
  }

  function renderRows(customers) {
    if (customers.length === 0) {
      tableBody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tableBody.innerHTML = customers.map((c) => `
      <tr>
        <td>
          <span class="row-link" data-edit="${c.id}">
            ${FrankyAuth.escapeHtml(c.name)}
          </span>
        </td>

        <td>
          ${c.company ? FrankyAuth.escapeHtml(c.company) : '—'}
        </td>

        <td>
          ${c.phone ? FrankyAuth.escapeHtml(c.phone) : '—'}
        </td>

        <td>
          ${c.email ? FrankyAuth.escapeHtml(c.email) : '—'}
        </td>

        <td>
          ${c.balance !== undefined ? money(c.balance) : '—'}
        </td>

        <td>
          <button
            class="icon-btn"
            data-delete="${c.id}"
            title="Delete"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');

    tableBody.querySelectorAll('[data-edit]').forEach((el) => {
      el.addEventListener('click', async () => {
        try {
          const { customer } = await FrankyAuth.api(
            `/api/customers/${el.dataset.edit}?businessId=${businessId}`
          );

          openModal(customer);
        } catch (err) {
          console.error('Failed to load customer:', err);
        }
      });
    });

    tableBody.querySelectorAll('[data-delete]').forEach((el) => {
      el.addEventListener('click', async () => {
        if (
          !confirm(
            'Delete this customer? This cannot be undone.'
          )
        ) {
          return;
        }

        try {
          await FrankyAuth.api(
            `/api/customers/${el.dataset.delete}?businessId=${businessId}`,
            {
              method: 'DELETE'
            }
          );

          window.frankyToastFallback('✓ Customer deleted');

          loadCustomers();
        } catch (err) {
          console.error('Failed to delete customer:', err);
        }
      });
    });
  }

  window.frankyToastFallback = function (msg) {
    if (window.frankyToast) {
      window.frankyToast(msg);
    }
  };

  async function loadCustomers() {
    try {
      const search = searchInput.value.trim();

      const qs = new URLSearchParams({
        businessId,
        ...(search ? { search } : {})
      });

      const { items } = await FrankyAuth.api(
        `/api/customers?${qs.toString()}`
      );

      renderRows(items);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }

  function setupEventListeners() {
    addBtn.addEventListener('click', () => {
      openModal(null);
    });

    modalClose.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    let searchTimeout;

    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);

      searchTimeout = setTimeout(() => {
        loadCustomers();
      }, 300);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      FrankyAuth.hideAlert(alertEl);
      FrankyAuth.clearFieldErrors(form);
      FrankyAuth.setLoading(saveBtn, true);

      const data = Object.fromEntries(
        new FormData(form).entries()
      );

      const id = data.id;

      delete data.id;

      try {
        if (id) {
          await FrankyAuth.api(
            `/api/customers/${id}?businessId=${businessId}`,
            {
              method: 'PATCH',
              body: JSON.stringify(data)
            }
          );
        } else {
          await FrankyAuth.api(
            `/api/customers?businessId=${businessId}`,
            {
              method: 'POST',
              body: JSON.stringify(data)
            }
          );
        }

        closeModal();

        window.frankyToastFallback(
          id
            ? '✓ Customer updated'
            : '✓ Customer created'
        );

        loadCustomers();

      } catch (err) {
        FrankyAuth.showAlert(
          alertEl,
          err.message
        );

        FrankyAuth.applyFieldErrors(
          form,
          err.details
        );

      } finally {
        FrankyAuth.setLoading(
          saveBtn,
          false
        );
      }
    });
  }

  async function init() {
    try {
      // FIRST: load the page through AppShell
      const ctx = await AppShell.init('customers.html');

      if (!ctx) {
        console.warn(
          'FRANKY TECH — AppShell did not return a context.'
        );
        return;
      }

      businessId = ctx.businessId;
      currency = ctx.currency || 'USD';

      // SECOND: find the elements AFTER AppShell
      cacheElements();

      // THIRD: make sure everything exists
      if (!validateElements()) {
        return;
      }

      // FOURTH: attach events
      setupEventListeners();

      // FIFTH: load data
      await loadCustomers();

    } catch (err) {
      console.error(
        'FRANKY TECH — Customers initialization failed:',
        err
      );
    }
  }

  init();

})();