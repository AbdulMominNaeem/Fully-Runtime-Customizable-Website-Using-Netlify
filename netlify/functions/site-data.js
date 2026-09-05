const { connectLambda, getStore } = require('@netlify/blobs');

const STORE_NAME = 'lumen-site-data';
const KEY = 'site-data';

exports.handler = async (event) => {
  try {
    // Required when using the classic Lambda-style handler on Netlify.
    connectLambda(event);

    const store = getStore(STORE_NAME);

    if (event.httpMethod === 'OPTIONS') {
      return response(204, null);
    }

    if (event.httpMethod === 'GET') {
      const data = await store.get(KEY, { type: 'json' });
      return response(200, data || null);
    }

    if (event.httpMethod === 'POST') {
      let incoming;
      try {
        incoming = JSON.parse(event.body || '{}');
      } catch (_) {
        return response(400, { error: 'Invalid JSON sent to the save endpoint.' });
      }

      if (!incoming || typeof incoming !== 'object' || !incoming.company) {
        return response(400, { error: 'Invalid site data. Company information is required.' });
      }

      // Preserve the saved PIN if one already exists. The browser dashboard is
      // not a security boundary; this only prevents accidental PIN changes.
      const current = await store.get(KEY, { type: 'json' });
      if (current && current.company && current.company.adminPin) {
        if (!incoming.company.adminPin || incoming.company.adminPin !== current.company.adminPin) {
          return response(403, { error: 'Admin PIN does not match the saved site.' });
        }
      }

      await store.setJSON(KEY, incoming);
      return response(200, { ok: true });
    }

    return {
      statusCode: 405,
      headers: { 'Allow': 'GET, POST, OPTIONS', 'Cache-Control': 'no-store' },
      body: 'Method Not Allowed'
    };
  } catch (error) {
    return response(500, {
      error: 'Netlify could not access the site data store.',
      detail: error && error.message ? error.message : String(error)
    });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: body === null ? '' : JSON.stringify(body)
  };
}
