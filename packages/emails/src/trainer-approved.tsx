import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';

export type TrainerApprovedEmailProps = {
  firstName?: string | null;
  spaceUrl: string;
};

export function TrainerApprovedEmail({ firstName, spaceUrl }: TrainerApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre candidature formateur est acceptée — CPFA</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">Bienvenue parmi nos formateurs</Heading>
          <Text>Bonjour {firstName ?? ''},</Text>
          <Text>
            Nous avons le plaisir de vous confirmer que votre candidature a été <strong>acceptée</strong>.
            Vous disposez désormais d&apos;un espace dédié sur la plateforme CPFA.
          </Text>
          <Text>
            <Link href={spaceUrl}>Accéder à mon espace formateur</Link>
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            Vous y retrouverez votre planning, les ressources pédagogiques et la fiche de profil que vous pouvez compléter.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
