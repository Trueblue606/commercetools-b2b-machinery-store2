import { getCTToken } from "@/lib/ctAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { cartId } = req.body || {};
  if (!cartId) return res.status(400).json({ error: "cartId required" });

  try {
    const token = await getCTToken();
    const ctRes = await fetch(
      `${process.env.CT_API_URL}/${process.env.CT_PROJECT_KEY}/carts/${cartId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!ctRes.ok) {
      const text = await ctRes.text();
      return res.status(ctRes.status).send(text);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
