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
  client.authStore.save(payload.token, payload.admin);
  
  // Test filtering with the actual DEFAULT_EMAIL
  const email = 'test+contracts@inventauri.app';
  
  try {
    const user = await client.collection('users').create({
      email,
      password: 'Test!123',
      passwordConfirm: 'Test!123',
      emailVisibility: false
    });
    console.log('Created user:', user.id, user.email);
    
    // Try different filter syntaxes
    const filters = [
      `email="${email}"`,
      `email='${email}'`,
      `email = "${email}"`,
      `email = '${email}'`,
    ];
    
    for (const filter of filters) {
      try {
        const found = await client.collection('users').getFirstListItem(filter);
        console.log(`✓ Filter "${filter}" found user:`, found.id);
      } catch (e: any) {
        console.log(`✗ Filter "${filter}" failed:`, e?.message);
      }
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

test().catch(console.error);
