/**
 * FRANKY TECH — Public Review Submission
 * No authentication — reachable only via an unguessable token.
 */
/**
 * FRANKY TECH — Local HTML escape (public page, no auth.js loaded)
 * See client/js/auth.js escapeHtml for the full rationale.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

(function () {
  const card = document.getElementById('cardContent');
  const token = new URLSearchParams(window.location.search).get('token');

  function starPicker(selected) {
    let html = '<div id="starPicker" style="font-size:2rem; letter-spacing:6px; margin:16px 0; cursor:pointer;">';
    for (let i = 1; i <= 5; i += 1) {
      html += `<span data-star="${i}" style="color:${i <= selected ? 'var(--accent)' : 'var(--border)'};">★</span>`;
    }
    html += '</div>';
    return html;
  }

  function renderForm(businessName, customerName) {
    let rating = 0;
    card.innerHTML = `
      <h1>Rate ${escapeHtml(businessName)}</h1>
      <p class="sub">Hi ${escapeHtml(customerName)}, how was your experience?</p>
      <div class="form-alert" id="formAlert"></div>
      <form id="reviewForm">
        ${starPicker(0)}
        <div class="field"><label for="comment">Comment (optional)</label><textarea id="comment" name="comment" rows="4"></textarea></div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submitBtn"><span class="spinner"></span><span class="btn-label">Submit review</span></button>
      </form>
    `;

    const picker = document.getElementById('starPicker');
    picker.querySelectorAll('[data-star]').forEach((star) => {
      star.addEventListener('click', () => {
        rating = Number(star.dataset.star);
        picker.querySelectorAll('[data-star]').forEach((s) => {
          s.style.color = Number(s.dataset.star) <= rating ? 'var(--accent)' : 'var(--border)';
        });
      });
    });

    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertEl = document.getElementById('formAlert');
      const submitBtn = document.getElementById('submitBtn');
      alertEl.className = 'form-alert';
      if (rating === 0) {
        alertEl.textContent = 'Please select a star rating.';
        alertEl.className = 'form-alert show';
        return;
      }
      submitBtn.disabled = true;
      try {
        const res = await fetch(`/api/public/reviews/request/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment: document.getElementById('comment').value }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error((data.error && data.error.message) || 'Something went wrong.');
        card.innerHTML = `<h1>Thank you! 🎉</h1><p>Your review has been submitted.</p>`;
      } catch (err) {
        alertEl.textContent = err.message;
        alertEl.className = 'form-alert show';
        submitBtn.disabled = false;
      }
    });
  }

  (async function init() {
    if (!token) {
      card.innerHTML = '<h1>Invalid link</h1><p>This review link is missing or malformed.</p>';
      return;
    }
    try {
      const res = await fetch(`/api/public/reviews/request/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || 'This link is invalid or has expired.');
      if (data.request.submitted_at) {
        card.innerHTML = '<h1>Already submitted</h1><p>You already left a review using this link. Thank you!</p>';
        return;
      }
      document.getElementById('sideHeading').textContent = `Rate ${data.request.business_name}`;
      renderForm(data.request.business_name, data.request.customer_name);
    } catch (err) {
      card.innerHTML = `<h1>Link unavailable</h1><p>${err.message}</p>`;
    }
  })();
})();
