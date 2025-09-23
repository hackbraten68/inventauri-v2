import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/db';
import GoogleProvider from 'next-auth/providers/google';
import { Adapter } from 'next-auth/adapters';

// Define Org type locally since we can't import it from @prisma/client
type Org = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      memberships: Array<{
        org: Org;
        role: string;
        userId: string;
        orgId: string;
      }>;
    } & DefaultSession['user'];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        // Get the user's memberships with org data
        const userWithMemberships = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            memberships: {
              include: {
                org: true
              }
            }
          }
        });

        let memberships: Array<{
          org: Org;
          role: string;
          userId: string;
          orgId: string;
        }> = [];

        // If no memberships, create a default org and add user as owner
        if (userWithMemberships && userWithMemberships.memberships.length === 0) {
          const defaultOrg = await prisma.org.create({
            data: {
              name: `${user.name || 'My'}'s Organization`,
              memberships: {
                create: {
                  userId: user.id,
                  role: 'OWNER'
                }
              }
            },
            include: {
              memberships: true
            }
          });

          memberships = [{
            org: defaultOrg,
            role: 'OWNER',
            userId: user.id,
            orgId: defaultOrg.id
          }];
        } else if (userWithMemberships?.memberships) {
          // Map memberships to the expected format
          memberships = userWithMemberships.memberships.map((membership: { org: Org; role: string; userId: string; orgId: string }) => ({
            org: membership.org,
            role: membership.role,
            userId: membership.userId,
            orgId: membership.orgId
          }));
        }

        // Add user ID and memberships to the session
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
            memberships
          }
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add user ID to the token
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  events: {
    async signIn({ user, profile, isNewUser }) {
      // Update user name and image if not set
      if (isNewUser && (profile?.name || profile?.image)) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: (profile?.name as string | undefined) || user.name,
            image: (profile?.image as string | undefined) || user.image
          }
        });
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
