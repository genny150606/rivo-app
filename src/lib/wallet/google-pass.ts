import crypto from 'crypto';

export interface GenerateGooglePassInput {
  passId: string;
  passToken: string;
  organizationName: string;
  customerName?: string | null;
  stampsCount: number;
  maxStamps: number;
  rewardText?: string | null;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Creates Google Wallet Generic Pass JWT and Save URL
 */
export function generateGoogleWalletSaveUrl(input: GenerateGooglePassInput): { saveUrl: string; isSandbox: boolean } {
  const issuerId = process.env.GOOGLE_ISSUER_ID || '3388000000022211111';
  const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  const classId = `${issuerId}.rivo_loyalty_class`;
  const objectId = `${issuerId}.${input.passToken.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccountEmail || 'rivo-wallet-service@rivo-hospitality.iam.gserviceaccount.com',
    aud: 'google',
    origins: ['https://rivo-app-ten.vercel.app'],
    typ: 'savetojwt',
    payload: {
      genericObjects: [
        {
          id: objectId,
          classId: classId,
          cardTitle: {
            defaultValue: {
              language: 'it',
              value: `Carta Fedeltà • ${input.organizationName}`,
            },
          },
          header: {
            defaultValue: {
              language: 'it',
              value: `${input.stampsCount} / ${input.maxStamps} Timbri`,
            },
          },
          subheader: {
            defaultValue: {
              language: 'it',
              value: input.customerName || 'Cliente Fedele',
            },
          },
          logo: {
            sourceUri: {
              uri: 'https://rivo-app-ten.vercel.app/icon.png',
            },
            contentDescription: {
              defaultValue: {
                language: 'it',
                value: input.organizationName,
              },
            },
          },
          barcode: {
            type: 'QR_CODE',
            value: input.passToken,
            alternateText: input.passToken,
          },
          textModulesData: [
            {
              id: 'reward_info',
              header: 'PREMIO AL 10° TIMBRO',
              body: input.rewardText || 'Omaggio esclusivo al tavolo',
            },
            {
              id: 'powered_by',
              header: 'SISTEMA SMART',
              body: 'RIVO Technologies - Autonomous Hospitality OS',
            },
          ],
          hexBackgroundColor: '#121214',
        },
      ],
    },
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  if (privateKey && serviceAccountEmail) {
    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(dataToSign);
      sign.end();
      const signature = sign.sign(privateKey.replace(/\\n/g, '\n'));
      const encodedSignature = signature
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const jwt = `${dataToSign}.${encodedSignature}`;
      return {
        saveUrl: `https://pay.google.com/gp/v/save/${jwt}`,
        isSandbox: false,
      };
    } catch (e) {
      console.warn('[Google Wallet] Real RSA-SHA256 signing failed, falling back to sandbox mode:', e);
    }
  }

  // Sandbox / Preview mode when service account key is not provisioned
  const dummySignature = base64UrlEncode('sandbox_signature_for_development');
  const sandboxJwt = `${dataToSign}.${dummySignature}`;
  return {
    saveUrl: `https://pay.google.com/gp/v/save/${sandboxJwt}`,
    isSandbox: true,
  };
}
