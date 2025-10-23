/**
 * Shared validation helpers for admin settings payloads.
 * These utilities intentionally avoid external validation libraries so they can
 * run within API routes and UI helpers without adding bundle weight.
 */

export interface BusinessProfilePayload {
  legalName: string;
  displayName: string;
  taxId?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postalCode: string;
  country: string;
  version: number;
}

export interface OperationalPreferencePayload {
  currencyCode: string;
  timezone: string;
  unitSystem: 'metric' | 'imperial';
  defaultUnitPrecision: number;
  fiscalWeekStart: number;
  autoApplyTaxes?: boolean;
  version: number;
}

export interface NotificationPreferencePatch {
  id: string;
  isEnabled: boolean;
  throttleMinutes?: number | null;
  version: number;
}

export class ValidationError extends Error {
  public readonly status: number;

  constructor(message: string, status = 422) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
const COUNTRY_REGEX = /^[A-Z]{2}$/;

function ensureString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`Feld '${field}' darf nicht leer sein.`);
  }
  return value.trim();
}

function ensureOptionalString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('Ungültiger optionaler String-Wert.');
  }
  return value.trim();
}

function ensureNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ValidationError(`Feld '${field}' muss eine Zahl sein.`);
  }
  return value;
}

function ensureBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`Feld '${field}' muss boolesch sein.`);
  }
  return value;
}

function ensureVersion(value: unknown): number {
  const parsed = ensureNumber(value, 'version');
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ValidationError('Version muss eine positive ganze Zahl sein.');
  }
  return parsed;
}

export function parseBusinessProfilePayload(payload: unknown): BusinessProfilePayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new ValidationError('Ungültige Nutzlast für Geschäftsprofil.');
  }

  const body = payload as Record<string, unknown>;

  const legalName = ensureString(body.legalName, 'legalName');
  const displayName = ensureString(body.displayName, 'displayName');
  const taxId = ensureOptionalString(body.taxId);
  const email = ensureString(body.email, 'email').toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('E-Mail-Adresse ist ungültig.');
  }
  const phone = ensureOptionalString(body.phone);
  if (phone && !PHONE_REGEX.test(phone)) {
    throw new ValidationError('Telefonnummer ist ungültig.');
  }
  const website = ensureOptionalString(body.website);
  if (website && !website.startsWith('http')) {
    throw new ValidationError('Webseiten-URL muss mit http(s) beginnen.');
  }

  const addressLine1 = ensureString(body.addressLine1, 'addressLine1');
  const addressLine2 = ensureOptionalString(body.addressLine2);
  const city = ensureString(body.city, 'city');
  const postalCode = ensureString(body.postalCode, 'postalCode');
  const country = ensureString(body.country, 'country').toUpperCase();
  if (!COUNTRY_REGEX.test(country)) {
    throw new ValidationError('Land muss als ISO-3166 Alpha-2 angegeben werden.');
  }

  const version = ensureVersion(body.version);

  return {
    legalName,
    displayName,
    taxId,
    email,
    phone,
    website,
    addressLine1,
    addressLine2,
    city,
    postalCode,
    country,
    version
  };
}

export function parseOperationalPreferencePayload(payload: unknown): OperationalPreferencePayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new ValidationError('Ungültige Nutzlast für betriebliche Vorgaben.');
  }
  const body = payload as Record<string, unknown>;

  const currencyCode = ensureString(body.currencyCode, 'currencyCode').toUpperCase();
  if (currencyCode.length !== 3) {
    throw new ValidationError('Währungscode muss ein dreistelliger ISO-4217 Code sein.');
  }

  const timezone = ensureString(body.timezone, 'timezone');
  if (!timezone.includes('/')) {
    throw new ValidationError('Zeitzone muss im IANA-Format angegeben werden (z.B. Europe/Berlin).');
  }

  const unitSystemRaw = ensureString(body.unitSystem, 'unitSystem').toLowerCase();
  if (unitSystemRaw !== 'metric' && unitSystemRaw !== 'imperial') {
    throw new ValidationError('unitSystem muss metric oder imperial sein.');
  }

  const defaultUnitPrecision = ensureNumber(body.defaultUnitPrecision, 'defaultUnitPrecision');
  if (!Number.isInteger(defaultUnitPrecision) || defaultUnitPrecision < 0 || defaultUnitPrecision > 4) {
    throw new ValidationError('defaultUnitPrecision muss zwischen 0 und 4 liegen.');
  }

  const fiscalWeekStart = ensureNumber(body.fiscalWeekStart, 'fiscalWeekStart');
  if (!Number.isInteger(fiscalWeekStart) || fiscalWeekStart < 0 || fiscalWeekStart > 6) {
    throw new ValidationError('fiscalWeekStart muss zwischen 0 (Sonntag) und 6 (Samstag) liegen.');
  }

  const autoApplyTaxes = body.autoApplyTaxes === undefined
    ? false
    : ensureBoolean(body.autoApplyTaxes, 'autoApplyTaxes');

  const version = ensureVersion(body.version);

  return {
    currencyCode,
    timezone,
    unitSystem: unitSystemRaw as 'metric' | 'imperial',
    defaultUnitPrecision,
    fiscalWeekStart,
    autoApplyTaxes,
    version
  };
}

export function parseNotificationPreferencePatch(payload: unknown): NotificationPreferencePatch {
  if (typeof payload !== 'object' || payload === null) {
    throw new ValidationError('Ungültige Nutzlast für Benachrichtigungseinstellungen.');
  }
  const body = payload as Record<string, unknown>;

  const id = ensureString(body.id, 'id');
  const isEnabled = ensureBoolean(body.isEnabled, 'isEnabled');
  const throttleMinutesRaw = body.throttleMinutes;
  let throttleMinutes: number | null = null;
  if (throttleMinutesRaw !== undefined && throttleMinutesRaw !== null) {
    const value = ensureNumber(throttleMinutesRaw, 'throttleMinutes');
    if (!Number.isInteger(value) || value < 0) {
      throw new ValidationError('throttleMinutes muss eine nicht-negative Ganzzahl sein.');
    }
    throttleMinutes = value;
  }
  const version = ensureVersion(body.version);

  return {
    id,
    isEnabled,
    throttleMinutes,
    version
  };
}

export function ensureExpectedVersion(provided: number, current: number) {
  if (provided !== current) {
    throw new ValidationError('Die gespeicherten Daten wurden bereits geändert. Bitte aktualisieren und erneut versuchen.', 409);
  }
}
