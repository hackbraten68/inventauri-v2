import { prisma } from '../prisma';

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function getWarehouseById(id: string) {
  return prisma.warehouse.findUnique({
    where: { id }
  });
}
