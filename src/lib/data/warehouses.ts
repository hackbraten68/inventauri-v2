import { prisma } from '../prisma';

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    include: { posProfile: true },
    orderBy: { name: 'asc' }
  });
}

export async function getWarehouseById(id: string) {
  return prisma.warehouse.findUnique({
    where: { id }
  });
}

export async function createWarehouse(data: {
  name: string;
  type: 'central' | 'pos' | 'virtual';
  address?: string;
  contactEmail?: string;
  contactName?: string;
}) {
  const slug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return prisma.warehouse.create({
    data: {
      name: data.name,
      slug,
      type: data.type,
      address: data.address,
      posProfile:
        data.type === 'pos'
          ? {
            create: {
              contactEmail: data.contactEmail,
              contactName: data.contactName
            }
          }
          : undefined
    }
  });
}

export async function updateWarehouse(id: string, data: {
  name?: string;
  type?: 'central' | 'pos' | 'virtual';
  address?: string;
  contactEmail?: string;
  contactName?: string;
}) {
  return prisma.warehouse.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      address: data.address,
      posProfile: data.type === 'pos' ? {
        upsert: {
          create: {
            contactEmail: data.contactEmail,
            contactName: data.contactName
          },
          update: {
            contactEmail: data.contactEmail,
            contactName: data.contactName
          }
        }
      } : undefined
    }
  });
}
