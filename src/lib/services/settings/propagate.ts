import { prisma } from '../../prisma';

export async function propagateOperationalChanges(shopId: string) {
  await prisma.shop.update({
    where: { id: shopId },
    data: { updatedAt: new Date() }
  });
}
