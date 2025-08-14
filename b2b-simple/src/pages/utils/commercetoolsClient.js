import { createClient as createSdkClient } from '@commercetools/sdk-client';
import { createHttpClient } from '@commercetools/sdk-client-http';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import fetch from 'node-fetch';

export const createClient = () => {
  return createSdkClient({
    middlewares: [
      createAuthMiddlewareForClientCredentialsFlow({
        host: process.env.CT_AUTH_URL,
        projectKey: process.env.CT_PROJECT_KEY,
        credentials: {
          clientId: process.env.CT_CLIENT_ID,
          clientSecret: process.env.CT_CLIENT_SECRET
        },
        fetch
      }),
      createHttpClient({
        host: process.env.CT_API_URL,
        fetch
      })
    ]
  });
};
