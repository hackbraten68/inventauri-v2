import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('POCKETBASE_ADMIN_PASSWORD:', process.env.POCKETBASE_ADMIN_PASSWORD);
console.log('Length:', process.env.POCKETBASE_ADMIN_PASSWORD?.length);
console.log('Chars:', Array.from(process.env.POCKETBASE_ADMIN_PASSWORD || '').map(c => c + '(' + c.charCodeAt(0) + ')').join(' '));
