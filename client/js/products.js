/**
 * FRANKY TECH — Products & Services Page
 * -----------------------------------------------------------
 * IMPORTANT:
 * AppShell.init() MUST run first because the page content
 * is stored inside #pageContentTemplate.
 *
 * After AppShell.init() clones the template into #appContent,
 * we safely find all page elements and attach events.
 * -----------------------------------------------------------
 */

(function () {
  let businessId = null;
  let currency = 'USD';

  // Page elements are declared here but assigned AFTER AppShell.init()
  let tableBody = null;
  let emptyState = null;
  let searchInput = null;
  let typeFilter = null;
  let addBtn = null;
  let lowStockBanner = null;

  let modalOverlay = null;
  let modalClose = null;
  let modalTitle = null;
  let form = null;
  let alertEl = null;
  let saveBtn = null;
  let typeSelect = null;
  let stockFields = null;

  let stockModalOverlay = null;
  let stockModalClose = null;
  let stockForm = null;
  let stockAlert = null;
  let stockSaveBtn = null;

  let stockItemId = null;

  /**
   * ---------------------------------------------------------
   * Find all page elements
   * ---------------------------------------------------------
   */
  function cacheElements() {
    tableBody = document.getElementById('tableBody');
    emptyState = document.getElementById('emptyState');
    searchInput = document.getElementById('searchInput');
    typeFilter = document.getElementById('typeFilter');
    addBtn = document.getElementById('addBtn');
    lowStockBanner = document.getElementById('lowStockBanner');

    modalOverlay = document.getElementById('modalOverlay');
    modalClose = document.getElementById('modalClose');
    modalTitle = document.getElementById('modalTitle');
    form = document.getElementById('itemForm');
    alertEl = document.getElementById('formAlert');
    saveBtn = document.getElementById('saveBtn');
    typeSelect = document.getElementById('type');
    stockFields = document.getElementById('stockFields');

    stockModalOverlay = document.getElementById('stockModalOverlay');
    stockModalClose = document.getElementById('stockModalClose');
    stockForm = document.getElementById('stockForm');
    stockAlert = document.getElementById('stockAlert');
    stockSaveBtn = document.getElementById('stockSaveBtn');

    // Safety check
    const requiredElements = {
      tableBody,
      emptyState,
      searchInput,
      typeFilter,
      addBtn,
      lowStockBanner,
      modalOverlay,
      modalClose,
      modalTitle,
      form,
      alertEl,
      saveBtn,
      typeSelect,
      stockFields,
      stockModalOverlay,
      stockModalClose,
      stockForm,
      stockAlert,
      stockSaveBtn,
    };

    const missing = Object.entries(requiredElements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missing.length > 0) {
      console.error(
        'FRANKY TECH — Products page is missing these HTML elements:',
        missing
      );

      return false;
    }

    return true;
  }

  /**
   * ---------------------------------------------------------
   * Money formatter
   * ---------------------------------------------------------
   */
  function money(n) {
    return `${currency} ${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * ---------------------------------------------------------
   * Toggle stock fields
   * ---------------------------------------------------------
   */
  function toggleStockFields() {
    if (!typeSelect || !stockFields) return;

    stockFields.style.display =
      typeSelect.value === 'product' ? 'grid' : 'none';
  }

  /**
   * ---------------------------------------------------------
   * Open item modal
   * ---------------------------------------------------------
   */
  function openModal(item) {
    if (!form || !modalOverlay) return;

    form.reset();

    if (window.FrankyAuth) {
      FrankyAuth.hideAlert(alertEl);
      FrankyAuth.clearFieldErrors(form);
    }

    if (item) {
      modalTitle.textContent = 'Edit item';

      Object.keys(item).forEach((key) => {
        const camel = key.replace(
          /_([a-z])/g,
          (_, char) => char.toUpperCase()
        );

        const input = form.querySelector(`[name="${camel}"]`);

        if (input) {
          input.value = item[key] ?? '';
        }
      });

      const idField = form.querySelector('[name="id"]');

      if (idField) {
        idField.value = item.id;
      }
    } else {
      modalTitle.textContent = 'Add item';

      const idField = form.querySelector('[name="id"]');

      if (idField) {
        idField.value = '';
      }
    }

    toggleStockFields();

    modalOverlay.classList.add('open');
  }

  /**
   * ---------------------------------------------------------
   * Close item modal
   * ---------------------------------------------------------
   */
  function closeModal() {
    if (!modalOverlay) return;

    modalOverlay.classList.remove('open');
  }

  /**
   * ---------------------------------------------------------
   * Open stock modal
   * ---------------------------------------------------------
   */
  function openStockModal(item) {
    if (!stockModalOverlay || !stockForm) return;

    stockItemId = item.id;

    stockForm.reset();

    if (window.FrankyAuth) {
      FrankyAuth.hideAlert(stockAlert);
    }

    const stockItemName = document.getElementById('stockItemName');
    const stockCurrent = document.getElementById('stockCurrent');

    if (stockItemName) {
      stockItemName.textContent = item.name || '';
    }

    if (stockCurrent) {
      stockCurrent.textContent =
        `${item.quantity ?? 0} ${item.unit || ''}`.trim();
    }

    stockModalOverlay.classList.add('open');
  }

  /**
   * ---------------------------------------------------------
   * Close stock modal
   * ---------------------------------------------------------
   */
  function closeStockModal() {
    if (!stockModalOverlay) return;

    stockModalOverlay.classList.remove('open');
  }

  /**
   * ---------------------------------------------------------
   * Render product rows
   * ---------------------------------------------------------
   */
  function renderRows(items) {
    if (!tableBody || !emptyState) return;

    if (!Array.isArray(items) || items.length === 0) {
      tableBody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tableBody.innerHTML = items
      .map(
        (item) => `
        <tr>
          <td>
            <span class="row-link" data-edit="${item.id}">
              ${FrankyAuth.escapeHtml(item.name || '')}
            </span>
          </td>

          <td>
            <span class="badge badge-${
              item.type === 'product' ? 'sent' : 'draft'
            }">
              ${FrankyAuth.escapeHtml(item.type || '')}
            </span>
          </td>

          <td>
            ${
              item.sku
                ? FrankyAuth.escapeHtml(item.sku)
                : '—'
            }
          </td>

          <td>
            ${money(item.price)}
          </td>

          <td>
            ${
              item.type === 'product'
                ? `${item.quantity ?? 0} ${
                    FrankyAuth.escapeHtml(item.unit || '')
                  } ${
                    Number(item.quantity) <= Number(item.min_stock)
                      ? '⚠️'
                      : ''
                  }`
                : '—'
            }
          </td>

          <td style="display:flex; gap:6px;">

            ${
              item.type === 'product'
                ? `
                  <button
                    class="icon-btn"
                    data-stock="${item.id}"
                    title="Adjust stock"
                    style="color:var(--primary);"
                    type="button"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M4 20V10M11 20V4M18 20v-7"/>
                    </svg>
                  </button>
                `
                : ''
            }

            <button
              class="icon-btn"
              data-delete="${item.id}"
              title="Delete"
              type="button"
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
      `
      )
      .join('');

    /**
     * Edit buttons
     */
    tableBody.querySelectorAll('[data-edit]').forEach((element) => {
      element.addEventListener('click', async () => {
        try {
          const { item } = await FrankyAuth.api(
            `/api/items/${element.dataset.edit}?businessId=${businessId}`
          );

          openModal(item);
        } catch (error) {
          console.error('Failed to load item:', error);

          if (window.frankyToast) {
            window.frankyToast(
              error.message || 'Failed to load item'
            );
          }
        }
      });
    });

    /**
     * Stock buttons
     */
    tableBody.querySelectorAll('[data-stock]').forEach((element) => {
      element.addEventListener('click', async () => {
        try {
          const { item } = await FrankyAuth.api(
            `/api/items/${element.dataset.stock}?businessId=${businessId}`
          );

          openStockModal(item);
        } catch (error) {
          console.error('Failed to load stock information:', error);

          if (window.frankyToast) {
            window.frankyToast(
              error.message || 'Failed to load stock information'
            );
          }
        }
      });
    });

    /**
     * Delete buttons
     */
    tableBody.querySelectorAll('[data-delete]').forEach((element) => {
      element.addEventListener('click', async () => {
        if (
          !confirm(
            'Delete this item? This cannot be undone.'
          )
        ) {
          return;
        }

        try {
          await FrankyAuth.api(
            `/api/items/${element.dataset.delete}?businessId=${businessId}`,
            {
              method: 'DELETE',
            }
          );

          if (window.frankyToast) {
            window.frankyToast('✓ Item deleted');
          }

          await loadItems();
        } catch (error) {
          console.error('Failed to delete item:', error);

          if (window.frankyToast) {
            window.frankyToast(
              error.message || 'Failed to delete item'
            );
          }
        }
      });
    });
  }

  /**
   * ---------------------------------------------------------
   * Low stock
   * ---------------------------------------------------------
   */
  async function loadLowStock() {
    try {
      const { items } = await FrankyAuth.api(
        `/api/items/low-stock?businessId=${businessId}`
      );

      if (!lowStockBanner) return;

      if (items && items.length > 0) {
        lowStockBanner.style.display = 'block';

        lowStockBanner.textContent =
          `⚠️ ${items.length} product${
            items.length > 1 ? 's are' : ' is'
          } at or below its low-stock threshold: ${
            items.map((item) => item.name).join(', ')
          }.`;
      } else {
        lowStockBanner.style.display = 'none';
      }
    } catch (error) {
      console.error('Failed to load low stock:', error);
    }
  }

  /**
   * ---------------------------------------------------------
   * Load items
   * ---------------------------------------------------------
   */
  async function loadItems() {
    try {
      const search = searchInput
        ? searchInput.value.trim()
        : '';

      const selectedType = typeFilter
        ? typeFilter.value
        : '';

      const params = new URLSearchParams();

      params.set('businessId', businessId);

      if (search) {
        params.set('search', search);
      }

      if (selectedType) {
        params.set('type', selectedType);
      }

      const { items } = await FrankyAuth.api(
        `/api/items?${params.toString()}`
      );

      renderRows(items || []);

      await loadLowStock();
    } catch (error) {
      console.error('Failed to load products:', error);

      if (tableBody && emptyState) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        emptyState.textContent =
          error.message || 'Failed to load products.';
      }
    }
  }

  /**
   * ---------------------------------------------------------
   * Event listeners
   * ---------------------------------------------------------
   */
  function bindEvents() {
    /**
     * Type selector
     */
    if (typeSelect) {
      typeSelect.addEventListener(
        'change',
        toggleStockFields
      );
    }

    /**
     * Add button
     */
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        openModal(null);
      });
    }

    /**
     * Close item modal
     */
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    /**
     * Click outside item modal
     */
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
          closeModal();
        }
      });
    }

    /**
     * Close stock modal
     */
    if (stockModalClose) {
      stockModalClose.addEventListener(
        'click',
        closeStockModal
      );
    }

    /**
     * Click outside stock modal
     */
    if (stockModalOverlay) {
      stockModalOverlay.addEventListener(
        'click',
        (event) => {
          if (event.target === stockModalOverlay) {
            closeStockModal();
          }
        }
      );
    }

    /**
     * Search
     */
    let searchTimeout;

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
          loadItems();
        }, 300);
      });
    }

    /**
     * Type filter
     */
    if (typeFilter) {
      typeFilter.addEventListener(
        'change',
        loadItems
      );
    }

    /**
     * Item form
     */
    if (form) {
      form.addEventListener(
        'submit',
        async (event) => {
          event.preventDefault();

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
                `/api/items/${id}?businessId=${businessId}`,
                {
                  method: 'PATCH',
                  body: JSON.stringify(data),
                }
              );
            } else {
              await FrankyAuth.api(
                `/api/items?businessId=${businessId}`,
                {
                  method: 'POST',
                  body: JSON.stringify(data),
                }
              );
            }

            closeModal();

            if (window.frankyToast) {
              window.frankyToast(
                id
                  ? '✓ Item updated'
                  : '✓ Item created'
              );
            }

            await loadItems();
          } catch (error) {
            console.error(
              'Failed to save item:',
              error
            );

            FrankyAuth.showAlert(
              alertEl,
              error.message || 'Failed to save item.'
            );

            FrankyAuth.applyFieldErrors(
              form,
              error.details
            );
          } finally {
            FrankyAuth.setLoading(
              saveBtn,
              false
            );
          }
        }
      );
    }

    /**
     * Stock form
     */
    if (stockForm) {
      stockForm.addEventListener(
        'submit',
        async (event) => {
          event.preventDefault();

          FrankyAuth.hideAlert(stockAlert);
          FrankyAuth.setLoading(
            stockSaveBtn,
            true
          );

          const data = Object.fromEntries(
            new FormData(stockForm).entries()
          );

          try {
            await FrankyAuth.api(
              `/api/items/${stockItemId}/adjust-stock?businessId=${businessId}`,
              {
                method: 'POST',
                body: JSON.stringify({
                  quantityDelta:
                    Number(data.quantityDelta),
                  note: data.note,
                }),
              }
            );

            closeStockModal();

            if (window.frankyToast) {
              window.frankyToast(
                '✓ Stock adjusted'
              );
            }

            await loadItems();
          } catch (error) {
            console.error(
              'Failed to adjust stock:',
              error
            );

            FrankyAuth.showAlert(
              stockAlert,
              error.message ||
                'Failed to adjust stock.'
            );
          } finally {
            FrankyAuth.setLoading(
              stockSaveBtn,
              false
            );
          }
        }
      );
    }
  }

  /**
   * ---------------------------------------------------------
   * INITIALIZATION
   * ---------------------------------------------------------
   *
   * THIS IS THE IMPORTANT PART.
   *
   * AppShell.init() runs FIRST.
   *
   * AppShell then clones:
   *
   * #pageContentTemplate
   *
   * into:
   *
   * #appContent
   *
   * ONLY AFTER THAT do we search for:
   *
   * #type
   * #addBtn
   * #itemForm
   * etc.
   * ---------------------------------------------------------
   */
  async function init() {
    const ctx = await AppShell.init(
      'products.html'
    );

    if (!ctx) {
      return;
    }

    businessId = ctx.businessId;
    currency = ctx.currency || 'USD';

    /**
     * IMPORTANT:
     * The template now exists inside #appContent.
     */
    const elementsReady = cacheElements();

    if (!elementsReady) {
      console.error(
        'FRANKY TECH — Products page initialization stopped because required HTML elements are missing.'
      );

      return;
    }

    /**
     * Attach all event listeners AFTER
     * the template has been rendered.
     */
    bindEvents();

    /**
     * Set correct initial stock visibility.
     */
    toggleStockFields();

    /**
     * Load products.
     */
    await loadItems();
  }

  /**
   * Start page.
   */
  init();
})();