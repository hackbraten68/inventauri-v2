import PocketBase from 'pocketbase';

const pocketbaseUrl = import.meta.env.PUBLIC_POCKETBASE_URL;

if (!pocketbaseUrl) {
  console.warn('PocketBase client initialised without PUBLIC_POCKETBASE_URL. Set it in your environment.');
}

export const pocketbase = new PocketBase(pocketbaseUrl ?? '');
