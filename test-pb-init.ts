import PocketBase from 'pocketbase';

async function test() {
  const client = new PocketBase('http://localhost:8090');
  
  // Authenticate as admin
  const response = await fetch('http://localhost:8090/api/admins/auth-with-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identity: 'mosdev@posteo.com', password: 'uN5$3BV3#DD9x^' })
  });
  const payload = await response.json();
  if (!response.ok) {
    console.error('Admin auth failed:', payload);
    return;
  }
  client.authStore.save(payload.token, payload.admin);
  
  // Try to list users
  try {
    const result = await client.collection('users').getList(1, 10);
    console.log('Users found:', result.totalItems);
    for (const user of result.items) {
      console.log(`  - ${user.id}: ${user.email}`);
    }
  } catch (error: any) {
    console.error('List users failed:', error?.message);
  }
  
  // Try to create a test user
  try {
    const testEmail = 'init-test-' + Date.now() + '@example.com';
    const user = await client.collection('users').create({
      email: testEmail,
      password: 'Test!123',
      passwordConfirm: 'Test!123',
      emailVisibility: false
    });
    console.log('User created:', user.id, user.email);
    
    // Now try to find it with filter
    try {
      const found = await client.collection('users').getFirstListItem(`email="${testEmail}"`);
      console.log('Found by filter:', found.id);
    } catch (e: any) {
      console.error('Filter failed:', e?.message);
    }
  } catch (error: any) {
    console.error('User creation failed:', error?.response?.message || error?.message);
    console.log('Error data:', JSON.stringify(error?.response?.data, null, 2));
  }
}

test().catch(console.error);
