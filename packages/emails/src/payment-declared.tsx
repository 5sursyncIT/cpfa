import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export type PaymentDeclaredEmailProps = {
  payerName: string;
  payerEmail?: string;
  amountXof: number;
  channelLabel: string;
  reference: string;
  purpose: string;
  cardNumber?: string;
  paymentId: string;
};

// Alerte comptabilité : un abonné déclare avoir payé. Le message porte tout ce
// qu'il faut pour retrouver la transaction dans Wave / Orange Money, puis
// confirmer depuis /admin/payments.
export function PaymentDeclaredEmail({
  payerName,
  payerEmail,
  amountXof,
  channelLabel,
  reference,
  purpose,
  cardNumber,
  paymentId,
}: PaymentDeclaredEmailProps) {
  const amount = `${amountXof.toLocaleString('fr-FR')} FCFA`;
  return (
    <Html>
      <Head />
      <Preview>
        Paiement déclaré — {amount} par {channelLabel}
      </Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container
          style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}
        >
          <Heading as="h1">Paiement à vérifier</Heading>
          <Text>
            {payerName} déclare avoir réglé {amount} par {channelLabel}.
          </Text>
          <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
            <strong>Référence de transaction</strong> {reference}
            <br />
            <strong>Montant</strong> {amount}
            <br />
            <strong>Objet</strong> {purpose}
            {cardNumber ? (
              <>
                <br />
                <strong>N° de carte</strong> {cardNumber}
              </>
            ) : null}
            {payerEmail ? (
              <>
                <br />
                <strong>Contact</strong> {payerEmail}
              </>
            ) : null}
          </Text>
          <Text>
            Vérifiez la transaction dans l’application {channelLabel}, puis confirmez le paiement
            depuis la page Paiements du back-office. L’abonnement s’active automatiquement à la
            confirmation.
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            Référence interne du paiement : {paymentId}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
