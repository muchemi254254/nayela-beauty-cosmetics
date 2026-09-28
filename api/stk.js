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
    const { amount, phone, productName, productId } = req.body || {};

    if (!amount || !phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'amount and phone are required' }
      });
    }

    const apiKey = process.env.PALPLUSS_API_KEY;
    const channelId = process.env.PALPLUSS_KEY_ID;
    const basicAuth = process.env.PALPLUSS_BASIC_AUTH;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: { message: 'Payment gateway not configured' }
      });
    }

    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.slice(1);
    if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

    const accountReference = (productId || 'NAYELA').toString().slice(0, 12);
    const transactionDesc = (productName || 'Nayela Beauty').toString().slice(0, 13);

    const payload = {
      amount: Number(amount),
      phone: cleanPhone,
      accountReference,
      transactionDesc,
      channelId: channelId || undefined,
      callbackUrl: 'https://nayela-beauty-cosmetics.vercel.app/api/callback'
    };

    const authHeader = basicAuth
      ? `Basic ${basicAuth}`
      : `Basic ${Buffer.from(apiKey + ':').toString('base64')}`;

    const response = await fetch('https://api.palpluss.com/v1/payments/stk', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error || { message: 'Payment initiation failed' },
        requestId: data.requestId
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