export function baseUrl() {
  const raw = process.env.BASE_URL?.trim();
  const chosen = !raw || raw === '/' ? 'http://localhost:4321' : raw;
  // remove all trailing slashes
  return chosen.replace(/\/+$/, '');
}

export async function getJson<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T | any }> {
  const res = await fetch(`${baseUrl()}${path}`, init);
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}
