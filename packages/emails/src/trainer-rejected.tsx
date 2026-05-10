import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export type TrainerRejectedEmailProps = {
  firstName?: string | null;
  reason?: string | null;
};

export function TrainerRejectedEmail({ firstName, reason }: TrainerRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Suite donnée à votre candidature formateur — CPFA</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">Suite donnée à votre candidature</Heading>
          <Text>Bonjour {firstName ?? ''},</Text>
          <Text>
            Nous vous remercions sincèrement pour l&apos;intérêt que vous portez au CPFA.
            Après examen attentif de votre dossier, nous ne sommes malheureusement pas en mesure
            de donner une suite favorable à votre candidature pour le moment.
          </Text>
          {reason ? (
            <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
              <strong>Motif :</strong> {reason}
            </Text>
          ) : null}
          <Text>
            Cette décision n&apos;est pas définitive — vous pouvez nous adresser une nouvelle candidature
            à l&apos;avenir si votre situation évolue.
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            L&apos;équipe pédagogique du CPFA
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
