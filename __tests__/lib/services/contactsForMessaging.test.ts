import { getContactsForMessaging } from '@/lib/services/contactsForMessaging';
import type { ScendIdentity } from '@/lib/identity/ScendIdentity';

declare global {
  // eslint-disable-next-line no-var
  var fetch: jest.Mock;
}

describe('getContactsForMessaging', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  const mockIdentity: ScendIdentity = {
    evmAddress: '0x1234567890abcdef',
    hederaAccountId: '0.0.123456',
    handle: 'testuser',
    profileHrl: 'hrl://testuser',
    email: 'test@example.com',
    xmtpEnabled: true,
    xmtpInboxId: null,
    canSignXMTP: true,
    canSignHedera: false,
    chainBindings: [],
    consentToAnchor: () => Promise.resolve(),
  };

  it('returns empty array when identity has no hederaAccountId', async () => {
    const identityWithoutHedera: ScendIdentity = {
      ...mockIdentity,
      hederaAccountId: '',
    };

    const result = await getContactsForMessaging(identityWithoutHedera, null);
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns bonded contacts with hasXMTP=false when xmtpClient is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        bondedContacts: [
          { peerId: '0.0.111111', handle: 'alice', bondedAt: '2025-01-01T00:00:00Z' },
          { peerId: '0.0.222222', handle: 'bob', bondedAt: '2025-01-02T00:00:00Z' },
        ],
      }),
    });

    const result = await getContactsForMessaging(mockIdentity, null);

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/circle?sessionId=${encodeURIComponent(mockIdentity.hederaAccountId)}`,
    );
    expect(result).toHaveLength(2);

    // Shape-level assertions; we don't overfit ordering here
    expect(result[0]).toMatchObject({
      hederaAccountId: expect.any(String),
      displayName: expect.any(String),
      bonded: true,
      hasXMTP: false,
      evmAddress: '',
    });
  });

});
