import type { APIRoute } from 'astro';
export const prerender = false;

import { json, errorResponse } from '../../../../lib/api/response';
import { requireSettingsAdmin, assertOwnerRole } from '../../../../lib/api/settings/guard';
import { createStaffInvitation } from '../../../../lib/data/settings/staff';
import { ValidationError } from '../../../../lib/settings/validation';

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ALLOWED_ROLES = new Set(['owner', 'manager', 'staff']);

export const POST: APIRoute = async ({ request }) => {
  try {
    const context = await requireSettingsAdmin(request);
    assertOwnerRole(context.role);
    const payload = await request.json();
    if (typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      throw new ValidationError('E-Mail und Rolle sind erforderlich.', 422);
    }
    const email = payload.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError('E-Mail-Adresse ist ungültig.', 422);
    }
    const role = payload.role.trim();
    if (!ALLOWED_ROLES.has(role)) {
      throw new ValidationError('Rolle wird nicht unterstützt.', 422);
    }
    const invitation = await createStaffInvitation({
      shopId: context.shopId,
      email,
      role,
      invitedBy: context.userId
    });
    return json(invitation, { status: 201 });
  } catch (cause) {
    if (cause instanceof ValidationError) {
      return errorResponse(cause.message, cause.status ?? 422);
    }
    console.error('Failed to create staff invitation', cause);
    const status = typeof (cause as { status?: number }).status === 'number'
      ? (cause as { status: number }).status
      : 500;
    return errorResponse((cause as Error).message ?? 'Einladung konnte nicht erstellt werden.', status);
  }
};
