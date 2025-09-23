import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      memberships: Array<{
        orgId: string;
        role: string;
        org: {
          id: string;
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    memberships?: Array<{
      orgId: string;
      role: string;
      org: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    memberships?: Array<{
      orgId: string;
      role: string;
      org: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
  }
}
