import type { APIRoute } from 'astro';
import { createWarehouse, listWarehouses } from '../../../lib/data/warehouses';
import { json, errorResponse } from '../../../lib/api/response';
import { requireUser } from '../../../lib/auth/server';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        await requireUser(request);
        const warehouses = await listWarehouses();
        return json({ warehouses });
    } catch (err: any) {
        return errorResponse(err.message, err.status || 500);
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const auth = await requireUser(request);

        // Only SuperAdmin or Owner can create warehouses
        if (auth.role !== 'superadmin' && auth.role !== 'owner') {
            return errorResponse('Insufficient permissions.', 403);
        }

        const payload = await request.json();
        const { name, type, address, contactEmail, contactName } = payload;

        if (!name || !type) {
            return errorResponse('Name and type are required.', 400);
        }

        if (!['central', 'pos', 'virtual'].includes(type)) {
            return errorResponse('Invalid warehouse type.', 400);
        }

        const warehouse = await createWarehouse({
            name,
            type,
            address,
            contactEmail,
            contactName
        });

        return json({
            success: true,
            warehouse
        });

    } catch (err: any) {
        console.error('Failed to create warehouse:', err);
        return errorResponse(err.message || 'Failed to create warehouse.', 500);
    }
};
