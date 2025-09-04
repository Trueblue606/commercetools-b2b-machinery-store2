export default function handler(req, res) {
  console.log('PING SSR', {
    project: process.env.CT_PROJECT_KEY,
    haveSecret: !!process.env.CT_CLIENT_SECRET,
    node: process.version,
  });
  res.status(200).json({ ok: true, env: !!process.env.CT_PROJECT_KEY });
}
