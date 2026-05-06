'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { contactSchema, type ContactInput } from '@/server/routers/contact-schema';

export function ContactForm() {
  const submit = trpc.contact.submit.useMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactInput) => {
    await submit.mutateAsync(data);
    reset();
  };

  if (submit.isSuccess) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-sm">
        <h2 className="text-lg font-semibold">Merci pour votre message.</h2>
        <p className="mt-2 text-muted-foreground">
          L’équipe CPFA vous répond sous 48 h ouvrées. Vous recevrez une copie de votre demande à
          l’adresse indiquée.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-6">
      <Field label="Nom complet" error={errors.name?.message}>
        <input
          {...register('name')}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Téléphone (optionnel)" error={errors.phone?.message}>
          <input
            {...register('phone')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </div>

      <Field label="Sujet" error={errors.subject?.message}>
        <input
          {...register('subject')}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <Field label="Message" error={errors.message?.message}>
        <textarea
          {...register('message')}
          rows={6}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      {submit.isError ? (
        <p className="text-sm text-destructive">
          Désolé, l’envoi a échoué. Réessayez dans quelques instants.
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting || submit.isPending} size="lg">
        {isSubmitting || submit.isPending ? 'Envoi…' : 'Envoyer le message'}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
