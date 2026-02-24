/**
 * Vercel Serverless Function — ServiceNow OAuth Token Proxy
 *
 * Handles ROPC (Resource Owner Password Credentials) token exchange.
 * The browser sends only { username, password }; this function adds
 * client_id and client_secret from server-side environment variables.
 * ServiceNow never receives a cross-origin request — this is server-to-server.
 *
 * POST /api/servicenow-oauth
 * Body: { username, password }
 */
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const snInstance = process.env.SN_INSTANCE || process.env.VITE_SN_INSTANCE;
  const clientId = process.env.SN_OAUTH_CLIENT_ID || process.env.VITE_SN_OAUTH_CLIENT_ID;
  const clientSecret = process.env.SN_OAUTH_CLIENT_SECRET || process.env.VITE_SN_OAUTH_CLIENT_SECRET;

  if (!snInstance || !clientId || !clientSecret) {
    console.error('[oauth] Missing env vars: SN_INSTANCE, SN_OAUTH_CLIENT_ID, SN_OAUTH_CLIENT_SECRET');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // SN_OAUTH_SCOPE: space-separated scopes required by the target application.
  // e.g. "useraccount x_dxcis_loans_wi_0" — set in Vercel env vars.
  const scope = process.env.SN_OAUTH_SCOPE || process.env.VITE_SN_OAUTH_SCOPE || '';

  // Handle both JSON body (prod — Vercel parses it) and form-urlencoded (fallback)
  let bodyParams;
  if (typeof req.body === 'string') {
    const existing = new URLSearchParams(req.body);
    existing.set('client_id', clientId);
    existing.set('client_secret', clientSecret);
    if (scope) existing.set('scope', scope);
    bodyParams = existing.toString();
  } else {
    bodyParams = new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: clientId,
      client_secret: clientSecret,
      ...(scope ? { scope } : {}),
    }).toString();
  }

  try {
    console.log('[oauth] Forwarding to ServiceNow:', snInstance);
    const snRes = await fetch(`${snInstance}/oauth_token.do`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams,
    });

    console.log('[oauth] ServiceNow response status:', snRes.status);
    const text = await snRes.text();
    const contentType = snRes.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    return res.status(snRes.status).send(text);
  } catch (err) {
    console.error('[oauth] Error:', err);
    return res.status(502).json({ error: 'Failed to reach ServiceNow' });
  }
}
