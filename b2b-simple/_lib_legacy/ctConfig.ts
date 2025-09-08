// lib/ctConfig.ts - Centralised commercetools REST config

export const projectKey: string = process.env.CT_PROJECT_KEY as string;
export const authUrl: string = (process.env.CT_AUTH_URL || (process.env.CT_HOST ? `https://auth.${process.env.CT_HOST}` : '') ) as string;
export const apiUrl: string = (process.env.CT_API_URL || (process.env.CT_HOST ? `https://api.${process.env.CT_HOST}` : '') ) as string;
export const scope: string = (process.env.CT_SCOPE || (projectKey ? `manage_project:${projectKey}` : '')) as string;

export const priceCountry: string = (process.env.NEXT_PUBLIC_CT_PRICE_COUNTRY || 'GB') as string;
export const priceCurrency: string = (process.env.NEXT_PUBLIC_CT_PRICE_CURRENCY || 'GBP') as string;

if (!projectKey) throw new Error('CT_PROJECT_KEY missing');
if (!authUrl) throw new Error('CT_AUTH_URL or CT_HOST missing');
if (!apiUrl) throw new Error('CT_API_URL or CT_HOST missing');
if (!scope) throw new Error('CT_SCOPE missing');
