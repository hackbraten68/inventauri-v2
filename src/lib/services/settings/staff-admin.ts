import { supabaseAdmin } from '../../supabase-admin';

const hasServiceRole = Boolean(import.meta.env.SUPABASE_SERVICE_ROLE_KEY);

export interface InviteUserResult {
  userId: string | null;
  email: string;
}

export async function inviteUser(email: string, role: string): Promise<InviteUserResult> {
  if (!hasServiceRole) {
    return { userId: null, email };
  }

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { role }
  });

  if (error) {
    const err = new Error(error.message);
    (err as Error & { status?: number }).status = 502;
    throw err;
  }

  return {
    userId: data?.user?.id ?? null,
    email: data?.user?.email ?? email
  };
}

export async function disableUser(userId: string): Promise<void> {
  if (!hasServiceRole) {
    return;
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { status: 'deactivated' },
    ban_duration: 'permanent'
  });

  if (error) {
    const err = new Error(error.message);
    (err as Error & { status?: number }).status = 502;
    throw err;
  }
}
