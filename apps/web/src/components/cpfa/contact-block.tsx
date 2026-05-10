'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { contactSchema, type ContactInput } from '@/server/routers/contact-schema';

export type ContactBlockProps = {
  contact: {
    address1: string;
    address2: string;
    phone: string;
    email: string;
  };
};

export function ContactBlock({ contact }: ContactBlockProps) {
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

  const sent = submit.isSuccess;

  return (
    <div
      className="row gap-7"
      style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}
    >
      <div className="card" style={{ padding: 32 }}>
        {sent ? (
          <div
            className="col gap-4"
            role="status"
            aria-live="polite"
            style={{ textAlign: 'center', padding: '32px 0' }}
          >
            <div
              aria-hidden="true"
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 56,
                lineHeight: 1,
                color: 'var(--orange-deep)',
              }}
            >
              ✓
            </div>
            <h3>Message reçu</h3>
            <p className="fs-15 text-mid">
              Notre équipe vous répondra sous 48 heures ouvrées.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => submit.reset()}
              style={{ alignSelf: 'center' }}
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form className="col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="label" htmlFor="contact-name">
                Nom complet
              </label>
              <input
                id="contact-name"
                className="input"
                {...register('name')}
                required
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'contact-name-error' : undefined}
              />
              {errors.name ? (
                <p
                  id="contact-name-error"
                  className="fs-13"
                  style={{ color: 'var(--danger)', marginTop: 6 }}
                >
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="row gap-3">
              <div style={{ flex: 1 }}>
                <label className="label" htmlFor="contact-email">
                  Email
                </label>
                <input
                  id="contact-email"
                  className="input"
                  type="email"
                  {...register('email')}
                  required
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                />
                {errors.email ? (
                  <p
                    id="contact-email-error"
                    className="fs-13"
                    style={{ color: 'var(--danger)', marginTop: 6 }}
                  >
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
              <div style={{ flex: 1 }}>
                <label className="label" htmlFor="contact-phone">
                  Téléphone (optionnel)
                </label>
                <input id="contact-phone" className="input" {...register('phone')} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="contact-subject">
                Objet
              </label>
              <input
                id="contact-subject"
                className="input"
                {...register('subject')}
                placeholder="Information sur les formations, partenariat, concours…"
                aria-invalid={errors.subject ? true : undefined}
                aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
              />
              {errors.subject ? (
                <p
                  id="contact-subject-error"
                  className="fs-13"
                  style={{ color: 'var(--danger)', marginTop: 6 }}
                >
                  {errors.subject.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="label" htmlFor="contact-message">
                Message
              </label>
              <textarea
                id="contact-message"
                className="textarea"
                {...register('message')}
                rows={5}
                placeholder="Précisez votre demande…"
                required
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
              ></textarea>
              {errors.message ? (
                <p
                  id="contact-message-error"
                  className="fs-13"
                  style={{ color: 'var(--danger)', marginTop: 6 }}
                >
                  {errors.message.message}
                </p>
              ) : null}
            </div>

            <div role="alert" aria-live="assertive">
              {submit.isError ? (
                <p className="fs-13" style={{ color: 'var(--danger)' }}>
                  Désolé, l&apos;envoi a échoué. Réessayez dans quelques instants.
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting || submit.isPending}
              style={{ alignSelf: 'start' }}
            >
              {isSubmitting || submit.isPending ? 'Envoi…' : 'Envoyer le message'}{' '}
              {!(isSubmitting || submit.isPending) ? <span className="arrow">→</span> : null}
            </button>
          </form>
        )}
      </div>

      <div className="col gap-5">
        <div className="card">
          <div className="label">Adresse</div>
          <p className="fs-15" style={{ marginTop: 8, lineHeight: 1.45 }}>
            {contact.address1}
            <br />
            {contact.address2}
          </p>
        </div>
        <div className="card">
          <div className="label">Standard</div>
          <p className="fs-15" style={{ marginTop: 8, lineHeight: 1.45 }}>
            <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} style={{ color: 'inherit' }}>
              {contact.phone}
            </a>
          </p>
        </div>
        <div className="card">
          <div className="label">Email</div>
          <p className="fs-15" style={{ marginTop: 8, lineHeight: 1.45 }}>
            <a href={`mailto:${contact.email}`} style={{ color: 'inherit' }}>
              {contact.email}
            </a>
          </p>
        </div>
        <div
          className="card"
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
            borderColor: 'transparent',
          }}
        >
          <div className="label" style={{ color: 'oklch(70% 0.02 80)' }}>
            Vous êtes une entreprise ?
          </div>
          <h4 style={{ color: 'var(--bg)', margin: '12px 0', fontSize: 24 }}>
            Concevons une formation sur mesure pour vos équipes.
          </h4>
          <button
            type="button"
            className="btn"
            style={{ background: 'var(--orange)', color: 'white' }}
          >
            Découvrir le programme corporate <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
