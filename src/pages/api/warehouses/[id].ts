import type { APIRoute } from 'astro';
import { updateWarehouse, getWarehouseById } from '../../../lib/data/warehouses';
import { json, errorResponse } from '../../../lib/api/response';
import { requireUser } from '../../../lib/auth/server';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
    try {
        const auth = await requireUser(request);
        const { id } = params;

        if (!id) return errorResponse('ID fehlt.', 400);

        // Only SuperAdmin or Owner can update warehouses
        if (auth.role !== 'superadmin' && auth.role !== 'owner') {
            return errorResponse('Nicht ausreichend Berechtigungen.', 403);
        }

        const payload = await request.json();

        const warehouse = await updateWarehouse(id, payload);

        return json({
            success: true,
            warehouse
        });

    } catch (err: any) {
        console.error('Failed to update warehouse:', err);
        return errorResponse(err.message || 'Fehler beim Aktualisieren des Standorts.', 500);
    }
};
