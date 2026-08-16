const paymentGatewayService = require('../services/paymentGateway.service');

/**
 * Generic inbound webhook endpoint. A real integration (Stripe,
 * Flutterwave, etc.) would point its webhook URL at this route.
 * See server/services/paymentGateway.service.js for the
 * verify-before-trust rules this enforces.
 */
async function webhook(req, res, next) {
  try {
    const signatureHeader = req.header('x-webhook-signature');
    const result = await paymentGatewayService.handleWebhook({
      rawBody: req.rawBody || JSON.stringify(req.body || {}),
      signatureHeader,
      payload: req.body,
      provider: req.query.provider,
    });

    if (!result.verified) {
      // Always 200 to the provider so they don't hammer retries on a
      // permanently-invalid signature, but nothing was applied.
      return res.status(200).json({ received: true, verified: false });
    }

    // A real integration would look up the payment intent / invoice
    // reference in req.body here and call paymentService.recordPayment
    // with the confirmed, gateway-verified amount. Left as an
    // architectural stub until real merchant credentials are connected.
    res.status(200).json({ received: true, verified: true });
  } catch (err) { next(err); }
}

module.exports = { webhook };
