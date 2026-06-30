import type { FeatureSchema } from '../../core/types';

export const integrationsSchema: FeatureSchema = {
  key: 'integrations',
  title: 'التكاملات',
  description: 'Google، Microsoft، Slack، Supabase',
  icon: 'fas fa-plug',
  color: 'linear-gradient(135deg,#6366f1,#4f46e5)',
  defaults: {
    googleDrive: true, googleCalendar: false, microsoft365: false, outlook: false,
    slack: false, firebase: false, cloudinary: false, awsS3: false, supabase: true,
  },
  fields: [
    { key: 'googleDrive', label: 'Google Drive', type: 'toggle' },
    { key: 'googleCalendar', label: 'Google Calendar', type: 'toggle' },
    { key: 'microsoft365', label: 'Microsoft 365', type: 'toggle' },
    { key: 'outlook', label: 'Outlook', type: 'toggle' },
    { key: 'slack', label: 'Slack', type: 'toggle' },
    { key: 'firebase', label: 'Firebase', type: 'toggle' },
    { key: 'cloudinary', label: 'Cloudinary', type: 'toggle' },
    { key: 'awsS3', label: 'AWS S3', type: 'toggle' },
    { key: 'supabase', label: 'Supabase', type: 'toggle' },
  ],
};
