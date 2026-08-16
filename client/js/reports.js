/**
 * FRANKY TECH — Reports Page
 * -----------------------------------------------------------
 * IMPORTANT:
 * AppShell.init() MUST run before accessing elements inside
 * #pageContentTemplate.
 * -----------------------------------------------------------
 */

(function () {

  let businessId = null;
  let currency = 'USD';

  /* ---------------------------------------------------------
   * DOM ELEMENTS
   * These are assigned AFTER AppShell.init()
   * --------------------------------------------------------- */

  let fromDate = null;
  let toDate = null;
  let applyBtn = null;

  let plGrid = null;
  let salesChart = null;
  let expenseBreakdown = null;
  let topProducts = null;
  let invoiceBreakdown = null;


  /* ---------------------------------------------------------
   * CACHE DOM ELEMENTS
   * --------------------------------------------------------- */

  function cacheElements() {

    fromDate =
      document.getElementById('fromDate');

    toDate =
      document.getElementById('toDate');

    applyBtn =
      document.getElementById('applyBtn');

    plGrid =
      document.getElementById('plGrid');

    salesChart =
      document.getElementById('salesChart');

    expenseBreakdown =
      document.getElementById('expenseBreakdown');

    topProducts =
      document.getElementById('topProducts');

    invoiceBreakdown =
      document.getElementById('invoiceBreakdown');
  }


  /* ---------------------------------------------------------
   * VALIDATE ELEMENTS
   * --------------------------------------------------------- */

  function validateElements() {

    const missing = [];

    if (!fromDate) {
      missing.push('#fromDate');
    }

    if (!toDate) {
      missing.push('#toDate');
    }

    if (!applyBtn) {
      missing.push('#applyBtn');
    }

    if (!plGrid) {
      missing.push('#plGrid');
    }

    if (!salesChart) {
      missing.push('#salesChart');
    }

    if (!expenseBreakdown) {
      missing.push('#expenseBreakdown');
    }

    if (!topProducts) {
      missing.push('#topProducts');
    }

    if (!invoiceBreakdown) {
      missing.push('#invoiceBreakdown');
    }

    if (missing.length > 0) {

      console.error(
        'FRANKY TECH — Reports page missing elements:',
        missing.join(', ')
      );

      return false;
    }

    return true;
  }


  /* ---------------------------------------------------------
   * MONEY FORMATTER
   * --------------------------------------------------------- */

  function money(n) {

    return `${currency} ${Number(n || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;
  }


  /* ---------------------------------------------------------
   * PROFIT & LOSS
   * --------------------------------------------------------- */

  function renderPL(pl) {

    const cards = [
      [
        'Gross revenue',
        money(pl.grossRevenue)
      ],
      [
        'Expenses',
        money(pl.expenses)
      ],
      [
        'Net profit',
        money(pl.netProfit)
      ],
      [
        'Margin',
        `${pl.margin}%`
      ]
    ];

    plGrid.innerHTML =
      cards.map(([label, number]) => `
        <div class="dash-card">
          <div class="l">
            ${label}
          </div>

          <div class="n">
            ${number}
          </div>
        </div>
      `).join('');
  }


  /* ---------------------------------------------------------
   * SALES CHART
   * --------------------------------------------------------- */

  function renderSalesChart(byDay) {

    if (!Array.isArray(byDay)) {
      byDay = [];
    }

    if (byDay.length === 0) {

      salesChart.innerHTML = `
        <div class="dash-empty">
          No sales in this period.
        </div>
      `;

      return;
    }

    const max =
      Math.max(
        ...byDay.map(
          (day) => Number(day.total) || 0
        ),
        1
      );

    salesChart.innerHTML = `

      <div
        style="
          display:flex;
          align-items:flex-end;
          gap:4px;
          height:160px;
        "
      >

        ${byDay.map((day) => {

          const total =
            Number(day.total) || 0;

          const height =
            Math.max(
              4,
              (total / max) * 150
            );

          return `
            <div
              title="${day.date}: ${money(total)}"
              style="
                flex:1;
                background:var(--accent);
                border-radius:3px 3px 0 0;
                height:${height}px;
              "
            ></div>
          `;

        }).join('')}

      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          font-size:var(--caption);
          color:var(--text-muted);
          margin-top:6px;
        "
      >
        <span>
          ${byDay[0].date}
        </span>

        <span>
          ${byDay[byDay.length - 1].date}
        </span>
      </div>
    `;
  }


  /* ---------------------------------------------------------
   * EXPENSE BREAKDOWN
   * --------------------------------------------------------- */

  function renderExpenseBreakdown(rows) {

    if (!Array.isArray(rows)) {
      rows = [];
    }

    if (rows.length === 0) {

      expenseBreakdown.innerHTML = `
        <div class="dash-empty">
          No expenses in this period.
        </div>
      `;

      return;
    }

    const max =
      Math.max(
        ...rows.map(
          (row) => Number(row.total) || 0
        ),
        1
      );

    expenseBreakdown.innerHTML =
      rows.map((row) => {

        const total =
          Number(row.total) || 0;

        const width =
          (total / max) * 100;

        return `
          <div style="margin-bottom:10px;">

            <div
              style="
                display:flex;
                justify-content:space-between;
                font-size:var(--small);
                margin-bottom:4px;
              "
            >
              <span>
                ${FrankyAuth.escapeHtml(
                  row.category || ''
                )}
              </span>

              <span>
                ${money(total)}
              </span>
            </div>

            <div
              style="
                background:var(--surface-secondary);
                border-radius:4px;
                height:8px;
              "
            >

              <div
                style="
                  width:${width}%;
                  background:var(--primary);
                  height:100%;
                  border-radius:4px;
                "
              ></div>

            </div>

          </div>
        `;

      }).join('');
  }


  /* ---------------------------------------------------------
   * TOP PRODUCTS / SERVICES
   * --------------------------------------------------------- */

  function renderTopProducts(rows) {

    if (!Array.isArray(rows)) {
      rows = [];
    }

    if (rows.length === 0) {

      topProducts.innerHTML = `
        <div class="dash-empty">
          No sales data yet.
        </div>
      `;

      return;
    }

    topProducts.innerHTML = `

      <table class="data-table">

        <thead>
          <tr>
            <th>Item</th>
            <th>Qty sold</th>
            <th>Revenue</th>
          </tr>
        </thead>

        <tbody>

          ${rows.map((row) => `
            <tr>

              <td>
                ${FrankyAuth.escapeHtml(
                  row.description || ''
                )}
              </td>

              <td>
                ${row.quantity_sold ?? 0}
              </td>

              <td>
                ${money(row.revenue)}
              </td>

            </tr>
          `).join('')}

        </tbody>

      </table>
    `;
  }


  /* ---------------------------------------------------------
   * INVOICE BREAKDOWN
   * --------------------------------------------------------- */

  function renderInvoiceBreakdown(rows) {

    if (!Array.isArray(rows)) {
      rows = [];
    }

    if (rows.length === 0) {

      invoiceBreakdown.innerHTML = `
        <div class="dash-empty">
          No invoices yet.
        </div>
      `;

      return;
    }

    invoiceBreakdown.innerHTML = `

      <div
        style="
          display:flex;
          gap:12px;
          flex-wrap:wrap;
        "
      >

        ${rows.map((row) => {

          const status =
            String(
              row.status || ''
            ).replace(
              /_/g,
              ' '
            );

          return `

            <div
              class="dash-card"
              style="
                flex:1;
                min-width:140px;
              "
            >

              <div class="l">

                <span
                  class="badge badge-${FrankyAuth.escapeHtml(
                    row.status || ''
                  )}"
                >
                  ${FrankyAuth.escapeHtml(
                    status
                  )}
                </span>

              </div>

              <div class="n">
                ${row.count ?? 0}
              </div>

              <div class="trend">
                ${money(row.total)}
              </div>

            </div>
          `;

        }).join('')}

      </div>
    `;
  }


  /* ---------------------------------------------------------
   * LOAD REPORT DATA
   * --------------------------------------------------------- */

  async function load() {

    try {

      applyBtn.disabled = true;

      const params = {
        businessId
      };

      if (fromDate.value) {
        params.from =
          fromDate.value;
      }

      if (toDate.value) {
        params.to =
          toDate.value;
      }

      const qs =
        new URLSearchParams(params);

      const [
        pl,
        sales,
        invoices
      ] = await Promise.all([

        FrankyAuth.api(
          `/api/reports/profit-and-loss?${qs.toString()}`
        ),

        FrankyAuth.api(
          `/api/reports/sales?${qs.toString()}`
        ),

        FrankyAuth.api(
          `/api/reports/invoices?businessId=${encodeURIComponent(
            businessId
          )}`
        )

      ]);


      /* -----------------------------------------------------
       * Update date range returned by backend
       * ----------------------------------------------------- */

      if (pl.range) {

        if (pl.range.from) {
          fromDate.value =
            pl.range.from;
        }

        if (pl.range.to) {
          toDate.value =
            pl.range.to;
        }
      }


      /* -----------------------------------------------------
       * Render everything
       * ----------------------------------------------------- */

      renderPL(pl);

      renderExpenseBreakdown(
        pl.expensesByCategory || []
      );

      renderSalesChart(
        sales.byDay || []
      );

      renderTopProducts(
        sales.topProducts || []
      );

      renderInvoiceBreakdown(
        invoices.statusBreakdown || []
      );

    } catch (error) {

      console.error(
        'FRANKY TECH — Failed to load reports:',
        error
      );

      plGrid.innerHTML = `
        <div class="dash-empty">
          Unable to load report data.
        </div>
      `;

    } finally {

      applyBtn.disabled = false;
    }
  }


  /* ---------------------------------------------------------
   * EVENT LISTENERS
   * --------------------------------------------------------- */

  function setupEventListeners() {

    applyBtn.addEventListener(
      'click',
      load
    );
  }


  /* ---------------------------------------------------------
   * INITIALIZATION
   * --------------------------------------------------------- */

  async function init() {

    try {

      /*
       * STEP 1
       * Let AppShell load reports.html first.
       */
      const ctx =
        await AppShell.init(
          'reports.html'
        );

      if (!ctx) {

        console.warn(
          'FRANKY TECH — Reports: AppShell returned no context.'
        );

        return;
      }


      /*
       * STEP 2
       * Get business information.
       */
      businessId =
        ctx.businessId;

      currency =
        ctx.currency || 'USD';


      /*
       * STEP 3
       * NOW find elements inside the template.
       */
      cacheElements();


      /*
       * STEP 4
       * Confirm all required elements exist.
       */
      if (!validateElements()) {
        return;
      }


      /*
       * STEP 5
       * Attach event listeners.
       */
      setupEventListeners();


      /*
       * STEP 6
       * Load initial report.
       */
      await load();

    } catch (error) {

      console.error(
        'FRANKY TECH — Reports initialization failed:',
        error
      );
    }
  }


  /* ---------------------------------------------------------
   * START
   * --------------------------------------------------------- */

  init();

})();