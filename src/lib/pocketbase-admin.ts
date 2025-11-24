import PocketBase from 'pocketbase';

const pocketbaseUrl = import.meta.env.PUBLIC_POCKETBASE_URL;
const adminEmail = import.meta.env.POCKETBASE_ADMIN_EMAIL;
const adminPassword = import.meta.env.POCKETBASE_ADMIN_PASSWORD;
const serviceToken = import.meta.env.POCKETBASE_SERVICE_ROLE_TOKEN;

if (!pocketbaseUrl) {
  console.warn('PocketBase admin client initialised without PUBLIC_POCKETBASE_URL.');
}

const pocketbaseAdmin = new PocketBase(pocketbaseUrl ?? '');

if (serviceToken) {
  pocketbaseAdmin.authStore.save(serviceToken, null);
}

export async function ensurePocketBaseAdminAuth() {
  if (serviceToken) {
    return pocketbaseAdmin;
  }
  if (!adminEmail || !adminPassword) {
    throw new Error('PocketBase admin credentials missing. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD.');
  }
  if (pocketbaseAdmin.authStore.isValid) {
    return pocketbaseAdmin;
  }
  await pocketbaseAdmin.admins.authWithPassword(adminEmail, adminPassword);
  return pocketbaseAdmin;
}

export { pocketbaseAdmin };
