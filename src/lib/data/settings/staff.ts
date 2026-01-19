import PocketBase from 'pocketbase';
import { ValidationError } from '../../settings/validation';

export interface StaffMember {
  userShopId: string;
  userId: string;
  email: string;
  role: string;
  status: 'active' | 'deactivated';
  deactivatedAt: Date | null;
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const roles = ['owner', 'manager', 'staff'];

export async function listStaff(): Promise<StaffMember[]> {
  const pocketbaseUrl = import.meta.env.PUBLIC_POCKETBASE_URL;
  if (!pocketbaseUrl) {
    throw new Error('PocketBase URL nicht konfiguriert.');
  }
  const client = new PocketBase(pocketbaseUrl);
  // Fetch all profiles, assuming admin has access
  const profiles = await client.collection('profiles').getList(1, 1000, {
    expand: 'user'
  });

  return profiles.items.map((profile: any) => {
    const user = profile.expand?.user;
    return {
      userShopId: profile.id,
      userId: user?.id ?? profile.user,
      email: user?.email ?? 'unknown',
      role: profile.role,
      status: profile.active ? 'active' : 'deactivated',
      deactivatedAt: profile.active ? null : new Date() // dummy
    };
  });
}