// A Vercel serverless function that acts as a secure proxy to the Zendesk API.

export default async function handler(request, response) {
  // --- Securely get credentials from Vercel Environment Variables ---
  const subdomain = process.env.ZENDESK_SUBDOMAIN;
  const email = process.env.ZENDESK_EMAIL;
  const apiToken = process.env.ZENDESK_API_TOKEN;

  // Check if essential environment variables are set
  if (!subdomain || !email || !apiToken) {
    return response.status(500).json({ error: 'Server configuration error.' });
  }

  // Get the Zendesk API endpoint the frontend wants to access from the query parameters.
  // Example: /api/zendesk?endpoint=search.json?query=...
  const { endpoint } = request.query;
  if (!endpoint) {
    return response.status(400).json({ error: 'Zendesk API endpoint not provided.' });
  }

  const zendeskUrl = `https://${subdomain}.zendesk.com/api/v2/${endpoint}`;
  const authHeader = `Basic ${btoa(`${email}/token:${apiToken}`)}`;

  try {
    const zendeskResponse = await fetch(zendeskUrl, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!zendeskResponse.ok) {
      // Forward Zendesk's error status and message if something goes wrong
      const errorData = await zendeskResponse.text();
      console.error('Zendesk API Error:', errorData);
      return response.status(zendeskResponse.status).json({ error: 'Failed to fetch data from Zendesk.' });
    }

    const data = await zendeskResponse.json();
    // --- Send the data from Zendesk back to the frontend ---
    return response.status(200).json(data);

  } catch (error) {
    console.error('Proxy function error:', error);
    return response.status(500).json({ error: 'Internal server error.' });
  }
}