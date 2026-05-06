import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export type MagicLinkEmailProps = {
  url: string;
  expiresInMinutes?: number;
};

export function MagicLinkEmail({ url, expiresInMinutes = 15 }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre lien de connexion CPFA</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">Connexion CPFA</Heading>
          <Text>Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans {expiresInMinutes} minutes.</Text>
          <Button href={url} style={{ backgroundColor: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 6 }}>
            Se connecter
          </Button>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            Si vous n&apos;avez pas demandé cet email, ignorez-le simplement.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
