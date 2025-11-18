import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';

import outputs from '../../amplify_outputs.json';
import type { Schema } from '../../amplify/data/resource';

let configured = false;

function ensureConfigured() {
  if (configured) return;

  // Enable SSR-safe config so Astro server builds don't choke on browser-only globals.
  Amplify.configure(outputs, { ssr: true });
  configured = true;
}

/** Return a typed Amplify Data client (AppSync) using the generated schema. */
export function getDataClient() {
  ensureConfigured();
  return generateClient<Schema>();
}

/** Fetch the current auth session (Cognito) after ensuring Amplify is configured. */
export async function getAuthSession() {
  ensureConfigured();
  return fetchAuthSession();
}

/** Convenience helper if you need to manually configure before using sub-clients. */
export function configureAmplify() {
  ensureConfigured();
}
