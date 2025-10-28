import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  parseBusinessProfilePayload,
  parseOperationalPreferencePayload
} from '../../src/lib/settings/validation';

const baseBusinessProfile = {
  legalName: 'Inventauri GmbH',
  displayName: 'Inventauri',
  taxId: null,
  email: 'test@inventauri.app',
  phone: null,
  website: null,
  addressLine1: 'Teststraße 1',
  addressLine2: null,
  city: 'Berlin',
  postalCode: '10115',
  country: 'DE'
};

const baseOperationalPreferences = {
  currencyCode: 'EUR',
  timezone: 'Europe/Berlin',
  unitSystem: 'metric',
  defaultUnitPrecision: 2,
  fiscalWeekStart: 1,
  autoApplyTaxes: false
};

describe('settings version validation', () => {
  it('accepts version 0 for new business profile payloads', () => {
    expect(() =>
      parseBusinessProfilePayload({
        ...baseBusinessProfile,
        version: 0
      })
    ).not.toThrow();
  });

  it('accepts version 0 for new operational preferences payloads', () => {
    expect(() => {
      const payload = parseOperationalPreferencePayload({
        ...baseOperationalPreferences,
        version: 0
      });
      expect(payload.version).toBe(0);
    }).not.toThrow();
  });

  it('rejects negative versions for business profile', () => {
    expect(() =>
      parseBusinessProfilePayload({
        ...baseBusinessProfile,
        version: -1
      })
    ).toThrowError(ValidationError);
  });

  it('rejects non-integer versions for operational preferences', () => {
    expect(() =>
      parseOperationalPreferencePayload({
        ...baseOperationalPreferences,
        version: 1.5
      })
    ).toThrowError(ValidationError);
  });
});
