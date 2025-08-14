// src/utils/parseBody.js
export async function parseBody(req) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const data = Buffer.concat(chunks).toString();
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error("❌ parseBody error:", err);
    return {};
  }
}
