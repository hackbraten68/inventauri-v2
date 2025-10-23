import {
  SettingsChangeType,
  SettingsSection,
  StaffInvitationStatus,
  UserMembershipStatus
} from '@prisma/client';
import { prisma } from '../../prisma';
import { recordSettingsChange, buildSettingsDiff } from './audit';
import { ValidationError } from '../../settings/validation';
import { inviteUser, disableUser } from '../../services/settings/staff-admin';

export interface StaffMember {
  userShopId: string;
  userId: string;
  email: string;
  role: string;
  status: UserMembershipStatus;
  deactivatedAt: Date | null;
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const roles = ['owner', 'manager', 'staff'];

export async function listStaff(shopId: string): Promise<StaffMember[]> {
  const members = await prisma.userShop.findMany({
    where: { shopId },
    orderBy: { createdAt: 'asc' }
  });

  return members.map((member) => ({
    userShopId: member.id,
    userId: member.userId,
    email: member.userId,
    role: member.role,
    status: member.status,
    deactivatedAt: member.deactivatedAt
  }));
}

export interface InviteStaffArgs {
  shopId: string;
  email: string;
  role: string;
  invitedBy: string;
}

export async function createStaffInvitation(args: InviteStaffArgs) {
  const email = args.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('E-Mail-Adresse ist ungültig.', 422);
  }
  if (!roles.includes(args.role)) {
    throw new ValidationError('Rolle wird nicht unterstützt.', 422);
  }
  const supabaseInvitation = await inviteUser(email, args.role);

  const invitation = await prisma.staffInvitation.create({
    data: {
      shopId: args.shopId,
      email,
      role: args.role,
      invitedBy: args.invitedBy,
      status: StaffInvitationStatus.pending,
      supabaseInvitationId: supabaseInvitation.userId ?? supabaseInvitation.email ?? 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  await recordSettingsChange({
    shopId: args.shopId,
    section: SettingsSection.staff,
    changeType: SettingsChangeType.create,
    actorId: args.invitedBy,
    actorEmail: 'system@inventauri.app',
    diff: buildSettingsDiff(null, invitation)
  });

  return invitation;
}

export interface StaffUpdateArgs {
  shopId: string;
  userShopId: string;
  role?: string;
  status?: UserMembershipStatus;
  actorId: string;
}

export async function updateStaffMember(args: StaffUpdateArgs) {
  const existing = await prisma.userShop.findUnique({ where: { id: args.userShopId } });
  if (!existing || existing.shopId !== args.shopId) {
    throw new ValidationError('Mitarbeiter konnte nicht gefunden werden.', 404);
  }

  if (args.role && !roles.includes(args.role)) {
    throw new ValidationError('Rolle wird nicht unterstützt.', 422);
  }
  if (args.status && !Object.values(UserMembershipStatus).includes(args.status)) {
    throw new ValidationError('Status ist ungültig.', 422);
  }

  if (args.status === 'deactivated' && existing.status !== 'deactivated') {
    try {
      await disableUser(existing.userId);
    } catch (error) {
      console.error('Failed to disable Supabase user', error);
    }
  }

  const updated = await prisma.userShop.update({
    where: { id: args.userShopId },
    data: {
      role: args.role ?? existing.role,
      status: args.status ?? existing.status,
      deactivatedAt: args.status === 'deactivated' ? new Date() : existing.deactivatedAt
    }
  });

  await recordSettingsChange({
    shopId: args.shopId,
    section: SettingsSection.staff,
    changeType: SettingsChangeType.update,
    actorId: args.actorId,
    actorEmail: 'system@inventauri.app',
    diff: buildSettingsDiff(existing, updated)
  });

  return updated;
}
