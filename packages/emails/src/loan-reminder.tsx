import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { emailCopy, emailXof, type Locale } from './copy';

export type LoanReminderEmailProps = {
  firstName?: string;
  resourceTitle: string;
  dueDate: string;
  daysOverdue?: number;
  penaltyXof?: number;
  locale?: Locale;
};

export function LoanReminderEmail({
  firstName,
  resourceTitle,
  dueDate,
  daysOverdue = 0,
  penaltyXof = 0,
  locale,
}: LoanReminderEmailProps) {
  const c = emailCopy('loanReminder', locale);
  const isOverdue = daysOverdue > 0;
  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">{isOverdue ? c.headingOverdue : c.headingDue}</Heading>
          <Text>{c.greeting(firstName ?? '')}</Text>
          <Text>
            {c.bodyBefore}
            <strong>{resourceTitle}</strong>
            {c.bodyMiddle}
            <strong>{dueDate}</strong>
            {c.bodyAfter}
          </Text>
          {isOverdue ? <Text>{c.overdue(daysOverdue, emailXof(penaltyXof, locale))}</Text> : null}
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
