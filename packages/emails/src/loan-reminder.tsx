import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export type LoanReminderEmailProps = {
  firstName?: string;
  resourceTitle: string;
  dueDate: string;
  daysOverdue?: number;
  penaltyXof?: number;
};

export function LoanReminderEmail({
  firstName,
  resourceTitle,
  dueDate,
  daysOverdue = 0,
  penaltyXof = 0,
}: LoanReminderEmailProps) {
  const isOverdue = daysOverdue > 0;
  return (
    <Html>
      <Head />
      <Preview>Rappel d&apos;échéance — Bibliothèque CPFA</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">{isOverdue ? 'Retour en retard' : 'Rappel d’échéance'}</Heading>
          <Text>Bonjour {firstName ?? ''},</Text>
          <Text>
            L&apos;ouvrage <strong>{resourceTitle}</strong> doit être restitué le <strong>{dueDate}</strong>.
          </Text>
          {isOverdue ? (
            <Text>
              Retard : {daysOverdue} jour(s). Pénalité accumulée : <strong>{penaltyXof} FCFA</strong>.
            </Text>
          ) : null}
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>Merci de passer à la bibliothèque pour le retour.</Text>
        </Container>
      </Body>
    </Html>
  );
}
