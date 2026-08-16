/**
 * FRANKY TECH — Payment Gateway Architecture (Phase 19)
 * -----------------------------------------------------------
 * No live gateway (Stripe/Flutterwave/etc.) is connected yet —
 * that requires real merchant credentials only the business
 * owner can provide. What's built here is the SHAPE every
 * gateway integration must follow, so plugging in a real
 * provider later is a config change, not a rewrite:
 *
 *   1. Every inbound webhook call is logged BEFORE being
 *      trusted (payment_webhook_events), signature-verified
 *      or not.
 *   2. A payment is only ever marked "confirmed" after HMAC
 *      signature verification against PAYMENT_WEBHOOK_SECRET
 *      succeeds — an unsigned or forged call is logged and
 *      rejected, never silently accepted.
 *   3. The webhook handler is idempotent-safe in shape (would
 *      check a provider event ID before applying) — wiring
 *      that check up is provider-specific and left for the
 *      real integration.
 * -----------------------------------------------------------
 */
const crypto = require('crypto');
const webhookModel = require('../models/paymentWebhook.model');

function verifySignature(rawBody, signatureHeader) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || secret === 'replace_with_real_webhook_secret' || !signatureHeader) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = Buffer.from(String(signatureHeader));
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(provided, expectedBuf);
}

/**
 * Handles an inbound webhook call. Always logs the attempt.
 * Only returns { verified: true } when the signature actually
 * checks out — callers must never apply a payment on a
 * verified: false result.
 */
async function handleWebhook({ rawBody, signatureHeader, payload, provider }) {
  const verified = verifySignature(rawBody, signatureHeader);

  await webhookModel.logEvent({
    provider: provider || 'generic',
    signatureValid: verified,
    payload,
    error: verified ? null : 'Signature missing or invalid — event logged but not applied.',
  });

  return { verified };
}

module.exports = { verifySignature, handleWebhook };
