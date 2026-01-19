import type { RecordModel } from 'pocketbase';

export type TenantRole = 'owner' | 'manager' | 'staff';

export interface PocketBaseProfile {
  id: string;
  role: TenantRole;
  active: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: TenantRole;
  profileId: string;
  profileActive: boolean;
  record: RecordModel;
}
