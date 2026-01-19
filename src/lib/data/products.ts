import { prisma } from '../prisma';

export async function listProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { sku: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });
}
