import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { getMaintenanceSettings } from '@/lib/maintenance/guard';
import { saveMaintenanceAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mode maintenance — Admin CPFA' };

const ERRORS: Record<string, string> = {
  password: 'Le mot de passe d’aperçu doit contenir au moins 8 caractères.',
  invalid: 'Certains champs sont invalides — vérifiez la longueur des textes saisis.',
};

export default async function AdminMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/maintenance');
  if (!hasPermission(session.user.roles, 'admin:any')) redirect('/admin');

  const settings = await getMaintenanceSettings();
  const { saved, error } = await searchParams;
  const errorMessage = error ? (ERRORS[error] ?? ERRORS.invalid) : null;

  const fieldClass = 'w-full rounded-md border bg-background px-3 py-2 text-sm';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Mode maintenance</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
          Quand le mode maintenance est activé, les visiteurs ne voient plus le site : ils arrivent
          sur une page d&apos;attente affichant le message ci-dessous. Vous et l&apos;équipe
          continuez à voir le site normalement tant que vous êtes connectés à cet espace
          d&apos;administration.
        </p>
      </header>

      <div
        className={
          'rounded-lg border p-4 text-sm ' +
          (settings.enabled
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : 'border-emerald-300 bg-emerald-50 text-emerald-900')
        }
      >
        <strong>
          {settings.enabled
            ? 'Actuellement : le site est en maintenance.'
            : 'Actuellement : le site est en ligne.'}
        </strong>{' '}
        {settings.enabled
          ? 'Les visiteurs voient la page d’attente.'
          : 'Tout le monde peut consulter le site.'}
      </div>

      {saved ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          Modifications enregistrées.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="border-destructive bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {errorMessage}
        </p>
      ) : null}

      <form action={saveMaintenanceAction} className="space-y-6">
        <section className="bg-card space-y-3 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">État du site</h2>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
            <input
              type="radio"
              name="enabled"
              value="off"
              defaultChecked={!settings.enabled}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="block font-medium">Site en ligne</span>
              <span className="text-muted-foreground">
                Fonctionnement normal — le site est visible par tout le monde.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
            <input
              type="radio"
              name="enabled"
              value="on"
              defaultChecked={settings.enabled}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="block font-medium">Site en maintenance</span>
              <span className="text-muted-foreground">
                Les visiteurs voient uniquement la page d&apos;attente.
              </span>
            </span>
          </label>
        </section>

        <section className="bg-card space-y-4 rounded-lg border p-6">
          <div>
            <h2 className="text-lg font-semibold">Message affiché aux visiteurs</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Ce texte s&apos;affiche sur la page d&apos;attente pendant la maintenance.
            </p>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Titre</span>
            <input
              name="title"
              defaultValue={settings.title}
              maxLength={160}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Message</span>
            <textarea
              name="message"
              rows={4}
              defaultValue={settings.message}
              maxLength={2000}
              className={fieldClass}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                Retour prévu <span className="text-muted-foreground">(optionnel)</span>
              </span>
              <input
                name="reopensAt"
                defaultValue={settings.reopensAt}
                maxLength={160}
                placeholder="Ex. : lundi 4 août, dans la matinée"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                E-mail de contact <span className="text-muted-foreground">(optionnel)</span>
              </span>
              <input
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail}
                maxLength={200}
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        <section className="bg-card space-y-4 rounded-lg border p-6">
          <div>
            <h2 className="text-lg font-semibold">Mot de passe d&apos;aperçu</h2>
            <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
              À donner aux personnes qui doivent voir le site pendant la maintenance sans avoir de
              compte (le client, un prestataire, un testeur). Sur la page d&apos;attente, elles
              laissent le champ e-mail vide et saisissent seulement ce mot de passe.
            </p>
            <p className="mt-2 text-sm">
              {settings.previewPasswordHash ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">
                  Un mot de passe d&apos;aperçu est défini
                </span>
              ) : (
                <span className="bg-muted rounded-full px-2 py-0.5">
                  Aucun mot de passe d&apos;aperçu
                </span>
              )}
            </p>
          </div>
          <label className="block text-sm md:max-w-sm">
            <span className="mb-1 block font-medium">
              {settings.previewPasswordHash ? 'Nouveau mot de passe' : 'Définir un mot de passe'}
            </span>
            <input
              name="previewPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder={settings.previewPasswordHash ? 'Laisser vide pour ne pas changer' : ''}
              className={fieldClass}
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              8 caractères minimum. Par sécurité, il n&apos;est jamais réaffiché.
            </span>
          </label>
          {settings.previewPasswordHash ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="clearPreviewPassword" />
              Supprimer le mot de passe d&apos;aperçu
            </label>
          ) : null}
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            Enregistrer
          </button>
          <span className="text-muted-foreground text-xs">
            La modification prend effet immédiatement.
          </span>
        </div>
      </form>
    </div>
  );
}
