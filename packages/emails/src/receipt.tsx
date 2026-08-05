import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { emailCopy, emailXof, type Locale } from './copy';

export type ReceiptEmailProps = {
  customerName: string;
  invoiceNumber: string;
  amountXof: number;
  description: string;
  issuedAt: string;
  locale?: Locale;
};

export function ReceiptEmail({
  customerName,
  invoiceNumber,
  amountXof,
  description,
  issuedAt,
  locale,
}: ReceiptEmailProps) {
  const c = emailCopy('receipt', locale);
  const amount = emailXof(amountXof, locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview(invoiceNumber)}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">{c.heading}</Heading>
          <Text>{c.greeting(customerName)}</Text>
          <Text>{c.body}</Text>
          <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
            <strong>{c.numberLabel}</strong> {invoiceNumber}
            <br />
            <strong>{c.dateLabel}</strong> {issuedAt}
            <br />
            <strong>{c.purposeLabel}</strong> {description}
            <br />
            <strong>{c.amountLabel}</strong> {amount}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
