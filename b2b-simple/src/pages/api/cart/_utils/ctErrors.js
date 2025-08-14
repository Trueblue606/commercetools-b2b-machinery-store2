/**
 * For native fetch() responses from CT REST endpoints.
 */
export async function sendFromCtFetch(res, ctRes) {
  const contentType = ctRes.headers.get('content-type') || '';
  let body;
  try {
    body = contentType.includes('application/json') ? await ctRes.json() : await ctRes.text();
  } catch {
    body = contentType.includes('application/json') ? {} : '';
  }

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return res.status(ctRes.status).json(parsed);
    } catch {
      return res.status(ctRes.status).send(body);
    }
  }
  return res.status(ctRes.status).json(body);
}

// For commercetools SDK responses and thrown errors.
export function sendFromCtSdk(res, sdkResp) {
  const status = sdkResp?.statusCode ?? 500;
  const body = sdkResp?.body ?? { message: 'Unknown CT response' };
  return res.status(status).json(body);
}

export function sendCtError(res, err) {
  const status = err?.statusCode || err?.status || 500;
  const body = err?.body || { message: err?.message || 'Unexpected error' };
  return res.status(status).json(body);
}