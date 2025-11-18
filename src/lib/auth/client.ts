// Minimal client-side auth helper used by server-side pages when a full
// auth integration isn't required for build-time rendering. Some pages
// import `getAuthHeaders` expecting a HeadersInit-like object. Provide a
// lightweight implementation so imports resolve during build and tests.

export async function getAuthHeaders(): Promise<HeadersInit> {
  // TODO: Replace with a real implementation that reads cookies or
  // extracts auth tokens from the request context when running on the
  // server (Astro). For now return an empty object so server-side
  // fetches that don't require auth still work and the import error is fixed.
  return {};
}

export default getAuthHeaders;
