// src/utils/getAccessToken.js
export default async function getAccessToken() {
  const authUrl = `https://auth.eu-central-1.aws.commercetools.com/oauth/token`;

  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.CT_CLIENT_ID}:${process.env.CT_CLIENT_SECRET}`
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=client_credentials&scope=manage_project:${process.env.CT_PROJECT_KEY}`,
  });

  if (!res.ok) {
    throw new Error("Failed to get access token");
  }

  const data = await res.json();
  return data.access_token;
}
