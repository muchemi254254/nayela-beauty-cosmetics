export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { message: 'Method not allowed' } });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    body = body || {};

    const { amount, phone, productName, productId } = body;

    if (!amount || !phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'Amount and phone number are required' }
      });
    }

    const apiKey = process.env.PALPLUSS_API_KEY;
    const basicAuth = process.env.PALPLUSS_BASIC_AUTH;

    if (!apiKey && !basicAuth) {
      return res.status(500).json({
        success: false,
        error: { message: 'Payment gateway not configured on server' }
      });
    }

    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
    if (cleanPhone.startsWith('2540')) cleanPhone = '254' + cleanPhone.slice(4);
    if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

    if (cleanPhone.length < 12) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid phone number. Use format 07XX XXX XXX' }
      });
    }

    const accountReference = String(productId || 'NAYELA').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'NAYELA';
    const transactionDesc = String(productName || 'Nayela').replace(/[^\w\s]/g, '').slice(0, 13) || 'Nayela';

    const payload = {
      amount: Math.round(Number(amount)),
      phone: cleanPhone,
      accountReference,
      transactionDesc,
      callbackUrl: 'https://nayela-beauty-cosmetics.vercel.app/api/callback'
    };

    const authHeader = basicAuth
      ? (basicAuth.startsWith('Basic ') ? basicAuth : `Basic ${basicAuth}`)
      : `Basic ${Buffer.from(apiKey + ':').toString('base64')}`;

    const response = await fetch('https://api.palpluss.com/v1/payments/stk', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg =
        data?.error?.message ||
        data?.error?.details?.message ||
        data?.message ||
        'Payment initiation failed';
      return res.status(response.status).json({
        success: false,
        error: { message: msg, code: data?.error?.code || data?.code },
        requestId: data?.requestId
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('STK error:', err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Internal server error' }
    });
  }
}
