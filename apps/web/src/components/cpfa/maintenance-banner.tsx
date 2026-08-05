import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getMaintenanceSettings, hasMaintenanceBypass } from '@/lib/maintenance/guard';
import { richTags } from '@/lib/i18n-tags';
import { lockMaintenanceAction } from '@/app/maintenance/actions';

// Shown only to someone browsing the public site while it is closed to the
// public — without it, staff have no way of telling a live site from a hidden
// one and end up announcing a URL nobody else can open.
export async function MaintenanceBanner() {
  const settings = await getMaintenanceSettings();
  if (!settings.enabled) return null;
  if (!(await hasMaintenanceBypass())) return null;

  const t = await getTranslations('maintenanceBanner');

  return (
    <div
      style={{
        background: 'var(--warning)',
        color: 'var(--navy-deep)',
        padding: '10px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontSize: 14,
      }}
    >
      <span>{t.rich('notice', richTags)}</span>
      <Link href="/admin/maintenance" style={{ color: 'inherit', textDecoration: 'underline' }}>
        {t('manageCta')}
      </Link>
      <form action={lockMaintenanceAction}>
        <button
          type="submit"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'inherit',
            textDecoration: 'underline',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          {t('exitCta')}
        </button>
      </form>
    </div>
  );
}
