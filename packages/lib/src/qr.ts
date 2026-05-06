import QRCode from 'qrcode';

export type QrPayloadKind = 'subscription' | 'resource' | 'payment';

export function buildQrPayload(kind: QrPayloadKind, id: string, secret: string): string {
  return `cpfa:${kind}:${id}:${secret.slice(0, 12)}`;
}

export async function qrToDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, scale: 6 });
}

export async function qrToPngBuffer(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { errorCorrectionLevel: 'M', margin: 1, scale: 6 });
}
