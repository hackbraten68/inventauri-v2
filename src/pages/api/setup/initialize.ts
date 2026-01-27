import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { prisma } from '../../../lib/prisma';
import { json, errorResponse } from '../../../lib/api/response';
import { getSetupStatus } from '../../../lib/data/setup';
import { WarehouseType } from '@prisma/client';

export const prerender = false;

const pocketbaseUrl = import.meta.env.PUBLIC_POCKETBASE_URL;
// Use process.env as primary for private server-side vars in Astro
const pbAdminEmail = process.env.POCKETBASE_ADMIN_EMAIL || import.meta.env.POCKETBASE_ADMIN_EMAIL;
const pbAdminPass = process.env.POCKETBASE_ADMIN_PASSWORD || import.meta.env.POCKETBASE_ADMIN_PASSWORD;

export const POST: APIRoute = async ({ request }) => {
    try {
        console.log('--- SETUP INITIALIZE STARTED ---');

        // 1. Security Check: Is it already initialized?
        const status = await getSetupStatus();
        if (status.isInitialized) {
            console.warn('Setup blocked: Instance already initialized.');
            return errorResponse('Instanz ist bereits initialisiert.', 403);
        }

        const payload = await request.json();
        const { admin: owner, shop, config } = payload; // admin in payload is the business owner

        if (!owner.email || !owner.password || !shop.name) {
            return errorResponse('Unvollständige Daten (E-Mail, Passwort oder Shopname fehlt).', 400);
        }

        // 2. PocketBase Admin Auth (used for configuration)
        if (!pocketbaseUrl || !pbAdminEmail || !pbAdminPass) {
            console.error('Missing environment variables for PocketBase setup.');
            return errorResponse('Server-Konfiguration fehlt (PB_ADMIN_EMAIL/PASSWORD).', 500);
        }

        const pb = new PocketBase(pocketbaseUrl);
        try {
            console.log('Authenticating as PocketBase Admin for setup...');
            await pb.admins.authWithPassword(pbAdminEmail, pbAdminPass);
            console.log('PB Admin authenticated.');
        } catch (authErr: any) {
            console.warn('PB Admin Auth Failed, checking if initial setup is needed...');

            // Try to create the first admin if it doesn't exist
            try {
                console.log('Attempting to create first PB Admin...');
                await pb.admins.create({
                    email: pbAdminEmail,
                    password: pbAdminPass,
                    passwordConfirm: pbAdminPass,
                });
                console.log('First PB Admin created successfully.');

                // Try to authenticate again
                await pb.admins.authWithPassword(pbAdminEmail, pbAdminPass);
                console.log('PB Admin authenticated after creation.');
            } catch (createErr: any) {
                console.error('PB Admin Setup Failed:', createErr.message);
                return errorResponse('PocketBase Admin Login fehlgeschlagen. Bitte prüfen Sie, ob der Admin-Account existiert und die .env-Werte korrekt sind.', 500);
            }
        }

        // 3. Create regular user in PocketBase (The Shop Owner)
        let pbUser;
        try {
            console.log('Creating Shop Owner in PocketBase:', owner.email);
            pbUser = await pb.collection('users').create({
                email: owner.email,
                password: owner.password,
                passwordConfirm: owner.password,
                emailVisibility: true,
                verified: true
            });
            console.log('Shop Owner created in PB. ID:', pbUser.id);
        } catch (userErr: any) {
            console.error('Failed to create PB Owner:', userErr.message, userErr.data);
            return errorResponse(`Fehler beim Erstellen des Shop-Besitzers: ${userErr.message}`, 400);
        }

        // 4. Create Shop & Infrastructure in Prisma
        let dbShop;
        try {
            console.log('Creating shop in Prisma:', shop.name);
            const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-');

            // Step 4a: Create the Shop itself
            dbShop = await prisma.shop.create({
                data: {
                    name: shop.name,
                    slug: shopSlug
                }
            });

            // Step 4b: Create Business Profile separately
            await prisma.businessProfile.create({
                data: {
                    shopId: dbShop.id,
                    legalName: shop.legalName || shop.name,
                    displayName: shop.name,
                    email: owner.email,
                    addressLine1: shop.address || 'Hauptsitz',
                    city: 'Berlin',
                    postalCode: '10115',
                    country: 'DE',
                    updatedBy: '00000000-0000-0000-0000-000000000000'
                }
            });

            // Step 4c: Create Operational Preferences
            await prisma.operationalPreference.create({
                data: {
                    shopId: dbShop.id,
                    currencyCode: 'EUR',
                    timezone: 'Europe/Berlin',
                    fiscalWeekStart: 1,
                    updatedBy: '00000000-0000-0000-0000-000000000000'
                }
            });

            console.log('Shop and related profiles created in Prisma. ID:', dbShop.id);
        } catch (prismaErr: any) {
            console.error('Prisma Setup Failed:', prismaErr.message);
            return errorResponse('Datenbank-Fehler beim Erstellen des Shops.', 500);
        }

        // 5. Create Profile & UserShop for OWNER 
        try {
            console.log('Linking owner profile...');
            await pb.collection('profiles').create({
                user: pbUser.id,
                role: 'owner', // Shop Owners are 'owner'
                active: true
            });

            await prisma.userShop.create({
                data: {
                    userId: pbUser.id,
                    shopId: dbShop.id,
                    role: 'owner',
                    status: 'active'
                }
            });
        } catch (profileErr: any) {
            console.error('Failed to link Owner profile:', profileErr.message, profileErr.data);
            return errorResponse('Profil-Verknüpfung fehlgeschlagen.', 500);
        }

        // 6. Create Infrastructure (Warehouse)
        try {
            console.log('Creating central warehouse...');
            await prisma.warehouse.create({
                data: {
                    name: 'Zentrallager HQ',
                    slug: 'central-hq',
                    type: WarehouseType.central
                }
            });

            if (config.createDemoPOS) {
                console.log('Creating demo POS...');
                await prisma.warehouse.create({
                    data: {
                        name: 'POS Innenstadt',
                        slug: 'pos-city',
                        type: WarehouseType.pos,
                        posProfile: {
                            create: {
                                contactName: 'Shop Manager',
                                contactEmail: owner.email
                            }
                        }
                    }
                });
            }
        } catch (infraErr: any) {
            console.error('Infrastructure setup failed:', infraErr.message);
        }

        console.info(`Setup Complete. Owner: ${owner.email}`);

        return json({
            success: true,
            message: 'Initialisierung erfolgreich.',
            shopId: dbShop.id
        });

    } catch (err: any) {
        console.error('--- SETUP FAILED UNEXPECTEDLY ---');
        console.error('Error:', err.message);
        return errorResponse(err.message || 'Ein unerwarteter Fehler ist aufgetreten.', 500);
    }
};
