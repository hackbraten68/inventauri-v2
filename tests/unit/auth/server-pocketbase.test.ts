import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordModel } from 'pocketbase';

import { getUserFromRequest, requireUser } from '../../../src/lib/auth/server';
import { POCKETBASE_ACCESS_COOKIE } from '../../../src/lib/auth/pocketbase-session';

const mockGetTokenPayload = vi.fn();
const mockGetOne = vi.fn();

class MockPocketBase {
  authStore: {
    token: string;
    refreshToken: string;
    save: (token: string) => void;
  };

  collection = vi.fn(() => ({ getOne: mockGetOne }));

  constructor() {
    this.authStore = {
      token: '',
      refreshToken: '',
      save: (token: string) => {
        this.authStore.token = token;
      }
    };
  }
}

const pocketBaseConstructor = vi.fn(() => new MockPocketBase());

vi.mock('pocketbase', () => ({
  default: pocketBaseConstructor,
  getTokenPayload: mockGetTokenPayload
}));

function createUserRecord(profileOverrides: Record<string, unknown> = {}) {
  return {
    id: 'pb-user-1',
    email: 'owner@inventauri.app',
    expand: {
      profile: {
        id: 'profile-1',
        role: 'owner',
        active: true,
        ...profileOverrides
      }
    }
  } as unknown as RecordModel;
}

function buildCookieRequest(token?: string) {
  const headers: HeadersInit = token
    ? { cookie: `${POCKETBASE_ACCESS_COOKIE}=${token}` }
    : undefined;
  return new Request('http://localhost', { headers });
}

function buildHeaderRequest(token: string, cookieToken?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };
  if (cookieToken) {
    headers.cookie = `${POCKETBASE_ACCESS_COOKIE}=${cookieToken}`;
  }
  return new Request('http://localhost', {
    headers
  });
}

describe('PocketBase auth server helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTokenPayload.mockReturnValue({ id: 'pb-user-1' });
    mockGetOne.mockResolvedValue(createUserRecord());
  });

  it('returns null when no token is provided', async () => {
    const result = await getUserFromRequest(new Request('http://localhost'));
    expect(result).toBeNull();
  });

  it('hydrates profile and tenant info from cookie tokens', async () => {
    const token = 'cookie-token';
    const request = buildCookieRequest(token);
    const user = await getUserFromRequest(request);
    expect(user).toMatchObject({
      id: 'pb-user-1',
      role: 'owner',
      profileId: 'profile-1',
      profileActive: true
    });
    expect(mockGetTokenPayload).toHaveBeenCalledWith(token);
    expect(pocketBaseConstructor).toHaveBeenCalled();
  });

  it('prefers the Authorization header over cookies', async () => {
    const request = buildHeaderRequest('header-token', 'cookie-token');
    await getUserFromRequest(request);
    expect(mockGetTokenPayload).toHaveBeenCalledWith('header-token');
  });

  it('errors when requireUser is invoked without a valid session', async () => {
    await expect(requireUser(new Request('http://localhost'))).rejects.toThrow(
      'Nicht authentifiziert'
    );
  });

  it('returns null if the profile is deactivated', async () => {
    mockGetOne.mockResolvedValue(createUserRecord({ active: false }));
    const request = buildCookieRequest('cookie-token');
    const result = await getUserFromRequest(request);
    expect(result).toBeNull();
  });

  it('returns null when the profile lacks required identifiers', async () => {
    mockGetOne.mockResolvedValue(createUserRecord({ shopId: undefined }));
    const request = buildCookieRequest('cookie-token');
    const result = await getUserFromRequest(request);
    expect(result).toBeNull();
  });

  it('returns null when the token payload lacks a user id', async () => {
    mockGetTokenPayload.mockReturnValue({});
    const request = buildCookieRequest('cookie-token');
    const result = await getUserFromRequest(request);
    expect(result).toBeNull();
    expect(mockGetOne).not.toHaveBeenCalled();
  });
});
