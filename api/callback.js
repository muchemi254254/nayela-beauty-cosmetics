export default async function handler(req, res) {
  console.log('PalPluss callback:', JSON.stringify(req.body || {}));
  res.status(200).json({ received: true });
}