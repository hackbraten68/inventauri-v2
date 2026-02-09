import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/hooks';
import type { ChangeEvent, FormEvent } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface BusinessProfileState {
  legalName: string;
  displayName: string;
  taxId: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  version: number;
}

const emptyProfile: BusinessProfileState = {
  legalName: '',
  displayName: '',
  taxId: null,
  email: '',
  phone: null,
  website: null,
  addressLine1: '',
  addressLine2: null,
  city: '',
  postalCode: '',
  country: 'DE',
  version: 0
};

type FieldKey = keyof BusinessProfileState;

export function BusinessProfileForm() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<BusinessProfileState>(emptyProfile);
  const [baseline, setBaseline] = useState<BusinessProfileState>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(baseline), [profile, baseline]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/settings/business-profile');
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? body.message ?? t('common.error'));
        }
        if (active) {
          setProfile(body);
          setBaseline(body);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : t('common.error'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const onFieldChange = useCallback(
    (key: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setProfile((current) => ({
        ...current,
        [key]: value === '' && (key === 'taxId' || key === 'phone' || key === 'website' || key === 'addressLine2')
          ? null
          : key === 'country'
            ? value.toUpperCase()
            : value
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/settings/business-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? body.message ?? t('common.error'));
        }
        setProfile(body);
        setBaseline(body);
        setSuccess(t('settings.businessProfile.success'));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t('common.error'));
      } finally {
        setSaving(false);
      }
    },
    [profile]
  );

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <fieldset className="space-y-4" disabled={loading || saving}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('settings.businessProfile.legalName')}
            id="legalName"
            value={profile.legalName}
            onChange={onFieldChange('legalName')}
            required
          />
          <FormField
            label={t('settings.businessProfile.displayName')}
            id="displayName"
            value={profile.displayName}
            onChange={onFieldChange('displayName')}
            required
          />
          <FormField
            label={t('settings.businessProfile.taxId')}
            id="taxId"
            value={profile.taxId ?? ''}
            onChange={onFieldChange('taxId')}
            placeholder={t('settings.businessProfile.placeholders.taxId')}
          />
          <FormField
            label={t('settings.businessProfile.email')}
            id="email"
            type="email"
            value={profile.email}
            onChange={onFieldChange('email')}
            required
          />
          <FormField
            label={t('settings.businessProfile.phone')}
            id="phone"
            value={profile.phone ?? ''}
            onChange={onFieldChange('phone')}
            placeholder={t('settings.businessProfile.placeholders.phone')}
          />
          <FormField
            label={t('settings.businessProfile.website')}
            id="website"
            type="url"
            value={profile.website ?? ''}
            onChange={onFieldChange('website')}
            placeholder={t('settings.businessProfile.placeholders.website')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('settings.businessProfile.address')}
            id="addressLine1"
            value={profile.addressLine1}
            onChange={onFieldChange('addressLine1')}
            required
          />
          <FormField
            label={t('settings.businessProfile.addressLine2')}
            id="addressLine2"
            value={profile.addressLine2 ?? ''}
            onChange={onFieldChange('addressLine2')}
          />
          <FormField
            label={t('settings.businessProfile.postalCode')}
            id="postalCode"
            value={profile.postalCode}
            onChange={onFieldChange('postalCode')}
            required
          />
          <FormField
            label={t('settings.businessProfile.city')}
            id="city"
            value={profile.city}
            onChange={onFieldChange('city')}
            required
          />
          <FormField
            label={t('settings.businessProfile.country')}
            id="country"
            value={profile.country}
            onChange={onFieldChange('country')}
            required
            maxLength={2}
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          {error ? <p className="text-destructive">{error}</p> : null}
          {success && !error ? <p className="text-emerald-600">{success}</p> : null}
          {isDirty ? <p className="text-muted-foreground">{t('settings.businessProfile.unsavedChanges')}</p> : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setProfile(baseline);
              setError(null);
              setSuccess(null);
            }}
            disabled={!isDirty || saving}
          >
            {t('settings.businessProfile.discard')}
          </Button>
          <Button type="submit" disabled={saving || !isDirty}>
            {saving ? t('settings.businessProfile.saving') : t('settings.businessProfile.save')}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function FormField(props: FormFieldProps) {
  const { id, label, className, ...rest } = props;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className={className} {...rest} />
    </div>
  );
}
