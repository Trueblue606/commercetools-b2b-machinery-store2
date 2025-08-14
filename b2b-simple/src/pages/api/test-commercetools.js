// pages/api/test-commercetools.js
// Create this file to test if Commercetools is working

export default async function handler(req, res) {
  console.log('Testing Commercetools connection...');
  
  // Check environment variables
  const hasCredentials = {
    projectKey: !!process.env.CTP_PROJECT_KEY,
    clientId: !!process.env.CTP_CLIENT_ID,
    clientSecret: !!process.env.CTP_CLIENT_SECRET,
  };

  console.log('Environment check:', hasCredentials);

  if (!hasCredentials.projectKey || !hasCredentials.clientId || !hasCredentials.clientSecret) {
    return res.status(200).json({
      success: false,
      message: 'Missing Commercetools credentials',
      hasCredentials,
      help: 'Create .env.local file with CTP_PROJECT_KEY, CTP_CLIENT_ID, and CTP_CLIENT_SECRET'
    });
  }

  try {
    // Try to import and use Commercetools
    const { createApiClient } = await import('../../lib/commercetools');
    const apiClient = createApiClient();
    
    // Try to get project info
    const project = await apiClient
      .get()
      .execute();

    return res.status(200).json({
      success: true,
      message: 'Commercetools connected successfully!',
      project: {
        key: project.body.key,
        name: project.body.name,
        currencies: project.body.currencies,
        countries: project.body.countries
      }
    });

  } catch (error) {
    console.error('Commercetools error:', error);
    return res.status(200).json({
      success: false,
      message: 'Failed to connect to Commercetools',
      error: error.message,
      hint: 'Check if packages are installed and credentials are correct'
    });
  }
}