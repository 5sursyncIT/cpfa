import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { emailCopy, emailXof, type Locale } from './copy';

export type PaymentInstructionsEmailProps = {
  payerName: string;
  amountXof: number;
  /** Référence à rappeler au moment du paiement (n° de carte d'abonné). */
  reference: string;
  tierLabel: string;
  waveNumber?: string;
  orangeNumber?: string;
  /** Consigne libre saisie par l'administration. */
  instructions?: string;
  locale?: Locale;
};

// Envoyé à la souscription : l'abonné retrouve dans sa boîte mail les QR codes
// (en pièces jointes) et les numéros, sans avoir à revenir sur le site.
export function PaymentInstructionsEmail({
  payerName,
  amountXof,
  reference,
  tierLabel,
  waveNumber,
  orangeNumber,
  instructions,
  locale,
}: PaymentInstructionsEmailProps) {
  const c = emailCopy('paymentInstructions', locale);
  const amount = emailXof(amountXof, locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container
          style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}
        >
          <Heading as="h1">{c.heading}</Heading>
          <Text>{c.greeting(payerName)}</Text>
          <Text>{c.body(amount)}</Text>
          <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
            <strong>{c.tierLabel}</strong> {tierLabel}
            <br />
            <strong>{c.amountLabel}</strong> {amount}
            <br />
            <strong>{c.referenceLabel}</strong> {reference}
          </Text>
          {waveNumber || orangeNumber ? (
            <Text>
              {waveNumber ? (
                <>
                  <strong>Wave</strong> {waveNumber}
                  <br />
                </>
              ) : null}
              {orangeNumber ? (
                <>
                  <strong>Orange Money</strong> {orangeNumber}
                </>
              ) : null}
            </Text>
          ) : null}
          <Text>{c.qrNotice}</Text>
          {instructions ? (
            <Text style={{ fontSize: 13, color: '#475569' }}>{instructions}</Text>
          ) : null}
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
