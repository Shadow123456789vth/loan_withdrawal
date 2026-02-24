/**
 * Vercel Serverless Function — ServiceNow REST API Proxy
 *
 * Forwards all ServiceNow Table API and Scripted REST API calls.
 * Passes the Bearer token from the client through to ServiceNow.
 * Handles binary payloads (file uploads) by disabling body parsing.
 *
 * Usage:
 *   GET  /api/servicenow-api?path=/api/now/table/sys_user%3Fsysparm_limit%3D1
 *   POST /api/servicenow-api?path=/api/now/table/x_dxcis_loans_wi_0_case
 */
export const config = {
  runtime: 'nodejs',
  api: { bodyParser: false }, // Required for binary/multipart uploads
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Domain');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path } = req.query;
  if (!path) {
    return res.status(400).json({ error: 'path query parameter is required' });
  }

  const snInstance = process.env.SN_INSTANCE || process.env.VITE_SN_INSTANCE;
  if (!snInstance) {
    console.error('Missing SN_INSTANCE environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const targetUrl = `${snInstance}${path}`;

  // Forward relevant headers — never forward host or connection
  const forwardHeaders = {};
  if (req.headers['authorization']) forwardHeaders['Authorization'] = req.headers['authorization'];
  if (req.headers['accept']) forwardHeaders['Accept'] = req.headers['accept'];
  if (req.headers['content-type']) forwardHeaders['Content-Type'] = req.headers['content-type'];
  if (req.headers['x-domain']) forwardHeaders['X-Domain'] = req.headers['x-domain'];

  // Buffer the request body (handles JSON and binary)
  let body;
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

  try {
    const snRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const contentType = snRes.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    const responseBody = await snRes.arrayBuffer();
    return res.status(snRes.status).send(Buffer.from(responseBody));
  } catch (err) {
    console.error('ServiceNow API proxy error:', err);
    return res.status(502).json({ error: 'Failed to reach ServiceNow' });
  }
}
