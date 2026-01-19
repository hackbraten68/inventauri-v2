import PocketBase from 'pocketbase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const pb = new PocketBase('http://localhost:8090');

async function test() {
  // Authenticate as admin
  const adminRes = await fetch('http://localhost:8090/api/admins/auth-with-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identity: 'mosdev@posteo.com', password: 'uN5$3BV3#DD9x^' })
  });
  const adminPayload = await adminRes.json();
  pb.authStore.save(adminPayload.token, adminPayload.admin);

  // Get or create user
  const filter = `email="test+contracts@inventauri.app"`;
  let user = await pb.collection('users').getFirstListItem(filter).catch(() => null);
  if (!user) {
    console.log('Creating user...');
    user = await pb.collection('users').create({
      email: 'test+contracts@inventauri.app',
      password: 'PocketBase!123',
      passwordConfirm: 'PocketBase!123',
      emailVisibility: false
    });
    console.log('User created:', user.id);
  } else {
    console.log('User already exists:', user.id);
  }

  // Mark verified
  if (!user.verified) {
    user = await pb.collection('users').update(user.id, { verified: true });
  }

  // Get shop mapping
  console.log('Getting shop...');
  const shop = await prisma.shop.findFirst({ where: { slug: 'demo-shop' } });
  console.log('Shop:', shop?.id);

  if (!shop) {
    console.error('No shop found. Prisma seed may not have run.');
    process.exit(1);
  }

  const TEST_ACTOR_ID = '00000000-0000-0000-0000-000000000000';
  let mapping = await prisma.userShop.findFirst({
    where: { shopId: shop.id, userId: TEST_ACTOR_ID }
  });
  if (!mapping) {
    mapping = await prisma.userShop.create({
      data: {
        userId: TEST_ACTOR_ID,
        shopId: shop.id,
        role: 'owner'
      }
    });
  }
  console.log('Mapping:', mapping);

  // Create profile
  console.log('Creating profile...');
  const profilePayload = {
    shopId: shop.id,
    userShopId: mapping.id,
    role: mapping.role,
    user: user.id
  };
  console.log('Profile payload:', profilePayload);

  const profileFilter = `user="${user.id}"`;
  const existingProfile = await pb.collection('profiles').getFirstListItem(profileFilter).catch(() => null);
  if (existingProfile) {
    console.log('Updating existing profile:', existingProfile.id);
    const updated = await pb.collection('profiles').update(existingProfile.id, profilePayload);
    console.log('Profile updated:', updated);
  } else {
    console.log('Creating new profile...');
    const created = await pb.collection('profiles').create(profilePayload);
    console.log('Profile created:', created.id);
  }

  console.log('\n✅ Success!');
  process.exit(0);
}

test().catch((err) => {
  console.error('❌ Error:', err.message);
  if (err.response) {
    console.error('Response:', err.response);
  }
  process.exit(1);
});
