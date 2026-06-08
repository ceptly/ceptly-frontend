/** Public app origin for server-side redirects (never use request.url on Amplify). */
export function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://ceptly.ai"
  );
}

export function appRedirectUrl(path: string): URL {
  return new URL(path, getAppOrigin());
}
