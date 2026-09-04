import crypto from 'node:crypto';

const { MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID } = process.env;

// ---------------------------------------------------------------------------
// Mailchimp helpers
// ---------------------------------------------------------------------------

function datacenter(apiKey) {
  return apiKey.split('-').pop();
}

function emailHash(email) {
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
}

async function upsertMember(email, name, tags) {
  const dc = datacenter(MAILCHIMP_API_KEY);
  const hash = emailHash(email);
  const base = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}`;
  const auth = Buffer.from(`key:${MAILCHIMP_API_KEY}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' };

  const [first = '', ...rest] = (name || '').trim().split(/\s+/);

  // PUT = create-or-update; status_if_new prevents re-subscribing existing members
  const putRes = await fetch(`${base}/members/${hash}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      email_address: email.toLowerCase().trim(),
      status_if_new: 'subscribed',
      merge_fields: {
        ...(first && { FNAME: first }),
        ...(rest.length && { LNAME: rest.join(' ') }),
      },
    }),
  });

  if (!putRes.ok) {
    throw new Error(`Mailchimp member ${putRes.status}: ${await putRes.text()}`);
  }

  // Tag the contact
  if (tags.length > 0) {
    const tagRes = await fetch(`${base}/members/${hash}/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tags: tags.map(name => ({ name, status: 'active' })) }),
    });
    if (!tagRes.ok) {
      throw new Error(`Mailchimp tags ${tagRes.status}: ${await tagRes.text()}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Tag inference for the general contact form
// ---------------------------------------------------------------------------

function inferContactTags(message) {
  const t = (message || '').toLowerCase();
  const tags = new Set();

  if (/\b(buy|buying|purchas|for sale|quiero comprar|compra)\b/.test(t)) tags.add('buyer');
  if (/\b(rent|rental|renting|lease|monthly|alquil|arrendar)\b/.test(t)) tags.add('renter');
  if (/\b(land|plot|terrain|terreno|predio|parcela|hectare|acre)\b/.test(t)) tags.add('land-buyer');
  if (/\b(off.?grid|offgrid|solar|borehole|deep.?well|pozo|permaculture|self.?suf)\b/.test(t)) tags.add('off-grid');

  return tags.size > 0 ? [...tags] : ['enquiry'];
}

// ---------------------------------------------------------------------------
// Function handler
// ---------------------------------------------------------------------------

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { formType, name, email, message, sellOrRent, enquiryType } = data;

  // Basic email guard
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ ok: false, error: 'Valid email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Resolve Mailchimp tags based on which form was submitted and what was selected
  let tags;
  if (formType === 'sell') {
    // "Wanting to sell or rent?" modal — map the dropdown selection
    const val = (sellOrRent || '').trim();
    if (/^(For sale|En venta)$/i.test(val))        tags = ['seller'];
    else if (/^(For rent|En alquiler)$/i.test(val)) tags = ['landlord'];
    else                                             tags = ['seller']; // "Not sure yet" / "Aún no lo sé"
  } else if (formType === 'property-enquiry') {
    tags = enquiryType === 'rent' ? ['renter'] : ['buyer'];
  } else if (formType === 'contact-menu') {
    const typeMap = {
      'buying':      'buyer',
      'renting':     'renter',
      'land':        'land-buyer',
      'off-grid':    'off-grid',
      'selling':     'seller',
      'renting-out': 'landlord',
      'general':     'enquiry',
    };
    tags = [typeMap[(sellOrRent || '').toLowerCase()] || 'enquiry'];
  } else {
    // General contact form — infer from the free-text "what are you looking for?" field
    tags = inferContactTags(message);
  }

  // Call Mailchimp — a failure here must never block the user's form submission
  let mcError = null;
  if (MAILCHIMP_API_KEY && MAILCHIMP_LIST_ID) {
    try {
      await upsertMember(email, name, tags);
    } catch (err) {
      mcError = err.message;
      console.error('[form-submit] Mailchimp error (non-fatal):', err.message);
    }
  } else {
    console.warn('[form-submit] MAILCHIMP_API_KEY or MAILCHIMP_LIST_ID missing — Mailchimp step skipped.');
  }

  return new Response(
    JSON.stringify({ ok: true, tags, ...(mcError && { mcError }) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
