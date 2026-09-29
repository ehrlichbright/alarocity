/**
 * Meta Conversions API (server-side) — Vercel Node serverless function.
 *
 * Environment variables (set in Vercel → Project → Settings → Environment Variables):
 *   META_PIXEL_ID          your pixel id (same one used in index.html)
 *   META_CAPI_ACCESS_TOKEN system-user access token from Events Manager
 *   META_TEST_EVENT_CODE   optional; set only while testing in Events Manager
 *
 * The browser sends the same event with a matching event_id, so Meta
 * de-duplicates browser + server into a single conversion.
 */

const GRAPH_VERSION = 'v21.0';
const ALLOWED_EVENTS = new Set(['PageView', 'Lead', 'Contact', 'ViewContent']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PIXEL_ID = process.env.META_PIXEL_ID;
  const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

  // Not configured yet: accept and no-op, so the page never errors pre-launch.
  if (!PIXEL_ID || !TOKEN) {
    return res.status(200).json({ ok: true, skipped: 'META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not set' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  if (!body || !ALLOWED_EVENTS.has(body.event_name)) {
    return res.status(400).json({ error: 'Unsupported event_name' });
  }

  const fwd = req.headers['x-forwarded-for'];
  const clientIp = (Array.isArray(fwd) ? fwd[0] : (fwd || '')).split(',')[0].trim() || undefined;

  const payload = {
    data: [{
      event_name: body.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      event_source_url: body.event_source_url,
      action_source: 'website',
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: req.headers['user-agent'],
        ...(body.fbp ? { fbp: body.fbp } : {}),
        ...(body.fbc ? { fbc: body.fbc } : {}),
      },
      ...(body.custom_data ? { custom_data: body.custom_data } : {}),
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  try {
    const r = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const out = await r.json();
    if (!r.ok) {
      console.error('[meta-capi] rejected', out);
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true, events_received: out.events_received });
  } catch (err) {
    console.error('[meta-capi] failed', err);
    return res.status(502).json({ ok: false });
  }
}
