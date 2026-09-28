export default async function handler(req, res) {
  const body = req.body || {};
  console.log('PalPluss callback received:', JSON.stringify(body));

  if (body.event_type === 'transaction.success' || body.transaction?.status === 'SUCCESS') {
    console.log('PAYMENT SUCCESS - ready to send WhatsApp receipt');
  }

  res.status(200).json({ received: true });
}