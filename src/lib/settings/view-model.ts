import { prisma } from '../prisma';

export interface BusinessProfileViewModel {
  displayName: string;
  legalName: string;
  location?: string;
  contactEmail?: string;
}

export async function getBusinessProfileViewModel(shopId?: string): Promise<BusinessProfileViewModel> {
  const profile = await prisma.businessProfile.findFirst({
    where: shopId ? { shopId } : {},
    orderBy: { updatedAt: 'desc' }
  });

  if (!profile) {
    return {
      displayName: 'Inventauri',
      legalName: 'Inventauri',
      location: undefined,
      contactEmail: undefined
    };
  }

  return {
    displayName: profile.displayName,
    legalName: profile.legalName,
    location: profile.city ? `${profile.city}${profile.country ? `, ${profile.country}` : ''}` : undefined,
    contactEmail: profile.email
  };
}
