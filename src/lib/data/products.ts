import { prisma } from '../prisma';

export async function listProducts(shopId: string) {
  return prisma.product.findMany({
    where: { shopId, isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { sku: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });
}
