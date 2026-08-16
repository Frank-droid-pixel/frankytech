/**
 * FRANKY TECH — Shared Document Builder
 * -----------------------------------------------------------
 * Powers both the invoice and quotation creation forms. Totals
 * shown here are a live PREVIEW only — the server always
 * recalculates from scratch using server-trusted item prices,
 * per the "never trust client totals" rule.
 * -----------------------------------------------------------
 */

const DocumentBuilder = (function () {
  function create({ containerId, businessId, currency, itemsCache, onSubmit }) {
    const container = document.getElementById(containerId);
    let lineCount = 0;

    function addLine(prefill) {
      lineCount += 1;
      const id = `line_${lineCount}`;
      const row = document.createElement('div');
      row.className = 'builder-line-row';
      row.dataset.lineId = id;
      row.innerHTML = `
        <select class="line-item-select">
          <option value="">Custom line…</option>
          ${itemsCache.map((it) => `<option value="${it.id}" data-price="${it.price}" data-tax="${it.tax_rate}" data-name="${FrankyAuth.escapeHtml(it.name)}">${FrankyAuth.escapeHtml(it.name)} (${currency} ${it.price})</option>`).join('')}
        </select>
        <input type="text" class="line-desc" placeholder="Description" value="${prefill?.description || ''}">
        <input type="number" class="line-qty" min="0.01" step="0.01" value="${prefill?.quantity || 1}" placeholder="Qty">
        <input type="number" class="line-price" min="0" step="0.01" value="${prefill?.unitPrice || 0}" placeholder="Price">
        <input type="number" class="line-tax" min="0" step="0.01" value="${prefill?.taxRate || 0}" placeholder="Tax %">
        <button type="button" class="builder-line-remove" title="Remove line">&times;</button>
      `;
      container.appendChild(row);

      const select = row.querySelector('.line-item-select');
      const descInput = row.querySelector('.line-desc');
      const priceInput = row.querySelector('.line-price');
      const taxInput = row.querySelector('.line-tax');

      select.addEventListener('change', () => {
        const opt = select.selectedOptions[0];
        if (opt && opt.value) {
          descInput.value = opt.dataset.name;
          priceInput.value = opt.dataset.price;
          taxInput.value = opt.dataset.tax;
        }
        recalc();
      });
      [descInput, priceInput, taxInput, row.querySelector('.line-qty')].forEach((el) => el.addEventListener('input', recalc));
      row.querySelector('.builder-line-remove').addEventListener('click', () => { row.remove(); recalc(); });

      recalc();
    }

    function getLines() {
      return Array.from(container.querySelectorAll('.builder-line-row')).map((row) => ({
        itemId: row.querySelector('.line-item-select').value || null,
        description: row.querySelector('.line-desc').value,
        quantity: Number(row.querySelector('.line-qty').value) || 0,
        unitPrice: Number(row.querySelector('.line-price').value) || 0,
        taxRate: Number(row.querySelector('.line-tax').value) || 0,
      }));
    }

    function recalc() {
      const lines = getLines();
      let subtotal = 0;
      let tax = 0;
      lines.forEach((l) => {
        const lineSub = l.quantity * l.unitPrice;
        subtotal += lineSub;
        tax += (lineSub * l.taxRate) / 100;
      });

      const discountType = document.getElementById('discountType')?.value || 'fixed';
      const discountValue = Number(document.getElementById('discountValue')?.value) || 0;
      const shipping = Number(document.getElementById('shippingAmount')?.value) || 0;
      const labour = Number(document.getElementById('labourAmount')?.value) || 0;

      const discount = discountType === 'percent' ? (subtotal * discountValue) / 100 : discountValue;
      const total = Math.max(0, subtotal - discount + tax + shipping + labour);

      const fmt = (n) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const totalsEl = document.getElementById('builderTotals');
      if (totalsEl) {
        totalsEl.innerHTML = `
          <div class="row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          <div class="row"><span>Discount</span><span>-${fmt(discount)}</span></div>
          <div class="row"><span>Tax</span><span>${fmt(tax)}</span></div>
          <div class="row"><span>Shipping</span><span>${fmt(shipping)}</span></div>
          <div class="row"><span>Labour</span><span>${fmt(labour)}</span></div>
          <div class="row total"><span>Total</span><span>${fmt(total)}</span></div>
        `;
      }
    }

    ['discountType', 'discountValue', 'shippingAmount', 'labourAmount'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', recalc);
    });

    return { addLine, getLines, recalc };
  }

  return { create };
})();
