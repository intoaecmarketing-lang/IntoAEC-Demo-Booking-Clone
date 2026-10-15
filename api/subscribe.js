// Vercel serverless function: adds a newsletter subscriber to a MailerLite group.
// Needs two environment variables (Vercel > Project > Settings > Environment Variables):
//   MAILERLITE_API_KEY   MailerLite API token
//   MAILERLITE_GROUP_ID  numeric ID of the group new subscribers go into
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { MAILERLITE_API_KEY: key, MAILERLITE_GROUP_ID: group } = process.env;
  if (!key || !group) {
    console.error('Missing MAILERLITE_API_KEY or MAILERLITE_GROUP_ID');
    return res.status(500).json({ success: false, error: 'Sign-up is not available right now.' });
  }

  const email = String((req.body && req.body.email) || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  try {
    const r = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, groups: [group] }),
    });

    // 200 = existing subscriber updated, 201 = new subscriber created
    if (r.status === 200 || r.status === 201) return res.status(200).json({ success: true });

    if (r.status === 422) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    console.error('MailerLite error', r.status, await r.text());
    return res.status(502).json({ success: false, error: 'Something went wrong. Please try again.' });
  } catch (err) {
    console.error('MailerLite request failed', err);
    return res.status(502).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
};
