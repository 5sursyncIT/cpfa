import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export type ReceiptEmailProps = {
  customerName: string;
  invoiceNumber: string;
  amountXof: number;
  description: string;
  issuedAt: string;
};

export function ReceiptEmail({
  customerName,
  invoiceNumber,
  amountXof,
  description,
  issuedAt,
}: ReceiptEmailProps) {
  const fmt = `${amountXof.toLocaleString('fr-FR')} FCFA`;
  return (
    <Html>
      <Head />
      <Preview>Reçu N° {invoiceNumber} — CPFA</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">Paiement confirmé</Heading>
          <Text>Bonjour {customerName},</Text>
          <Text>
            Votre paiement a bien été reçu et confirmé par nos services. Vous trouverez en pièce
            jointe le reçu officiel correspondant.
          </Text>
          <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
            <strong>N°</strong> {invoiceNumber}
            <br />
            <strong>Date</strong> {issuedAt}
            <br />
            <strong>Objet</strong> {description}
            <br />
            <strong>Montant</strong> {fmt}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            Si vous avez des questions concernant ce paiement, contactez l’équipe comptable du CPFA.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
