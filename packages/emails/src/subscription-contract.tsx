import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { emailCopy, type Locale } from './copy';

export type SubscriptionContractEmailProps = {
  subscriberName: string;
  cardNumber: string;
  tierLabel: string;
  expiresAt: string;
  locale?: Locale;
};

// Envoyé à l'activation de l'abonnement, avec le contrat en pièce jointe.
// L'abonné(e) doit l'imprimer, le compléter et le signer — le message le dit
// en une phrase, sans jargon.
export function SubscriptionContractEmail({
  subscriberName,
  cardNumber,
  tierLabel,
  expiresAt,
  locale,
}: SubscriptionContractEmailProps) {
  const c = emailCopy('subscriptionContract', locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container
          style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}
        >
          <Heading as="h1">{c.heading}</Heading>
          <Text>{c.greeting(subscriberName)}</Text>
          <Text>{c.body}</Text>
          <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
            <strong>{c.tierLabel}</strong> {tierLabel}
            <br />
            <strong>{c.cardLabel}</strong> {cardNumber}
            <br />
            <strong>{c.validUntilLabel}</strong> {expiresAt}
          </Text>
          <Text>{c.instruction}</Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
