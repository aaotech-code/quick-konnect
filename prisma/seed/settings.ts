import { PrismaClient, SettingValueType } from '@prisma/client';

const SETTINGS: {
  key: string;
  valueType: SettingValueType;
  value: unknown;
  description: string;
}[] = [
  {
    key: 'protected_payment_enabled',
    valueType: 'boolean',
    value: false,
    description:
      'Gates NEW protected-payment checkouts only. Does NOT affect existing payments. ' +
      'Controlled exclusively by Admin -> Settings -> Payments. Never read from env.',
  },
  {
    key: 'direct_payment_enabled',
    valueType: 'boolean',
    value: true,
    description: 'Customers and providers may arrange payment directly.',
  },
  {
    key: 'payment_provider',
    valueType: 'string',
    value: 'paystack',
    description: 'Active payment provider adapter key.',
  },
  {
    key: 'commission_rate',
    valueType: 'number',
    value: 10.0,
    description: 'Platform commission percentage on eligible completed transactions.',
  },
  {
    key: 'site_name',
    valueType: 'string',
    value: 'Quick-Konnect',
    description: 'Brand name shown in the site header and metadata.',
  },
  {
    key: 'site_logo_url',
    valueType: 'string',
    value: '',
    description: 'Public URL for the site logo. Empty = use default mark.',
  },  {
    key: 'chatway_widget_code',
    valueType: 'string',
    value: '',
    description: 'Chatway (or any chat widget) HTML/JS snippet. Rendered on every page.',
  },
];
export async function seedSettings(db: PrismaClient) {
  for (const s of SETTINGS) {
    await db.platformSetting.upsert({
      where:  { key: s.key },
      update: {}, // never overwrite an admin-chosen value
      create: {
        key: s.key,
        valueType: s.valueType,
        value: s.value as any,
        description: s.description,
      },
    });
  }
}