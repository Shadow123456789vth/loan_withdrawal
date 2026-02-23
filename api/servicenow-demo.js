/**
 * Vercel Serverless Function — Demo Data
 *
 * Authenticates with a read-only service account and returns the
 * latest records from x_dxcis_loans_wi_0_loans_withdrawals.
 *
 * Called on dashboard load in demo mode (no user auth required).
 * Results are edge-cached for 60 s to avoid hammering ServiceNow.
 *
 * Required env vars (server-side, no VITE_ prefix):
 *   SN_DEMO_USERNAME   — read-only service account username
 *   SN_DEMO_PASSWORD   — read-only service account password
 *   SN_INSTANCE        — https://yourinstance.service-now.com
 *   SN_OAUTH_CLIENT_ID
 *   SN_OAUTH_CLIENT_SECRET
 */
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://loan-withdrawal.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const snInstance    = process.env.SN_INSTANCE        || process.env.VITE_SN_INSTANCE;
  const clientId      = process.env.SN_OAUTH_CLIENT_ID  || process.env.VITE_SN_OAUTH_CLIENT_ID;
  const clientSecret  = process.env.SN_OAUTH_CLIENT_SECRET || process.env.VITE_SN_OAUTH_CLIENT_SECRET;
  const username      = process.env.SN_DEMO_USERNAME;
  const password      = process.env.SN_DEMO_PASSWORD;

  if (!snInstance || !username || !password || !clientId || !clientSecret) {
    console.warn('Demo data not configured — missing env vars');
    return res.status(503).json({ error: 'Demo data not configured' });
  }

  try {
    // ── Step 1: Get access token for the demo service account ────────────
    const tokenRes = await fetch(`${snInstance}/oauth_token.do`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'password',
        client_id:     clientId,
        client_secret: clientSecret,
        username,
        password,
      }).toString(),
    });

    if (!tokenRes.ok) {
      console.error('Demo auth failed:', tokenRes.status);
      return res.status(503).json({ error: 'Demo authentication failed' });
    }

    const { access_token } = await tokenRes.json();

    // ── Step 2: Fetch demo records ────────────────────────────────────────
    const params = new URLSearchParams({
      sysparm_limit:   '50',
      sysparm_query:   'active=true',
      sysparm_orderby: 'sys_created_on',
      sysparm_order:   'desc',
      sysparm_fields:  'sys_id,number,state,sys_created_on,transaction_type,touch_level,policy_number,owner_name,channel_source',
    });

    const dataRes = await fetch(
      `${snInstance}/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals?${params}`,
      { headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' } },
    );

    if (!dataRes.ok) {
      console.error('Demo data fetch failed:', dataRes.status);
      return res.status(dataRes.status).json({ error: 'Demo data unavailable' });
    }

    const data = await dataRes.json();

    // Cache at the edge so repeated page loads don't re-authenticate
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Demo data error:', err);
    return res.status(502).json({ error: 'Failed to reach ServiceNow' });
  }
}
