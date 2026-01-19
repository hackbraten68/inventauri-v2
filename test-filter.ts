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
  
  const testEmail = 'test+contracts@inventauri.app';
  
  // Test finding the actual test user
  console.log('Testing with email:', testEmail);
  
  try {
    const user = await client.collection('users').getFirstListItem(`email="${testEmail}"`);
    console.log('✓ Found user:', user.id, user.email);
  } catch (error: any) {
    console.error('✗ Filter with quotes failed:', error?.message);
  }
  
  // Try with escaped quotes if needed
  try {
    const user = await client.collection('users').getFirstListItem(`email='${testEmail}'`);
    console.log('✓ Found user with single quotes:', user.id, user.email);
  } catch (error: any) {
    console.error('✗ Single quote filter failed:', error?.message);
  }
}

test().catch(console.error);
