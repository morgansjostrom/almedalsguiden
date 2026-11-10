import { z } from 'zod';

export const CONSENT_VERSION = 'network-v2';
export const networkProfileSchema = z.object({
  action: z.literal('profile'),
  name: z.string().trim().min(1).max(100),
  organization: z.string().trim().max(200),
  role: z.string().trim().max(200),
  interests: z.array(z.string().trim().min(1).max(100)).max(30),
  seeking: z.string().trim().max(1000),
  offering: z.string().trim().max(1000),
  days: z.array(z.iso.date()).max(30),
  visible: z.boolean(),
  consent: z.boolean(),
  consent_version: z.literal(CONSENT_VERSION),
}).strict().refine(p => !p.visible || p.consent, 'Aktivt medgivande krävs');
const target = z.uuid();
const text = z.string().trim().min(1).max(1000);
export const MATCH_TAGS = ['Samarbetspartner', 'Finansiering', 'Kunskap och expertis', 'Rekrytering', 'Kunder och uppdrag', 'Media och synlighet', 'Politiska kontakter', 'Mentorskap'] as const;
export const networkMatchSchema = z.object({ action: z.literal('match'), seeking: z.array(z.enum(MATCH_TAGS)).max(8), offering: z.array(z.enum(MATCH_TAGS)).max(8), share_schedule: z.boolean(), linkedin: z.union([z.literal(''), z.string().trim().max(200).regex(/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+\/?$/)]).optional() }).strict();
export const networkCommandSchema = z.union([
  networkMatchSchema,
  networkProfileSchema,
  z.object({ action: z.enum(['hide', 'delete']) }).strict(),
  z.object({ action: z.enum(['block', 'unblock']), target }).strict(),
  z.object({ action: z.literal('request'), target, text }).strict(),
  z.object({ action: z.literal('report'), target, text, message_id: z.uuid().optional() }).strict(),
  z.object({ action: z.enum(['accept', 'decline', 'cancel', 'close', 'seen']), id: z.uuid() }).strict(),
  z.object({ action: z.literal('message'), id: z.uuid(), text: z.string().trim().min(1).max(2000) }).strict(),
  z.object({ action: z.literal('moderate'), id: z.uuid(), decision: z.enum(['resolve', 'suspend']) }).strict(),
]);
export const networkQuerySchema = z.object({
  mode: z.enum(['home', 'directory', 'messages', 'admin']).default('home'),
  q: z.string().trim().max(100).default(''),
  day: z.union([z.iso.date(), z.literal('')]).default(''),
  page: z.coerce.number().int().min(0).max(1000).default(0),
  id: z.uuid().optional(),
}).refine(v => v.mode !== 'messages' || !!v.id);
export const PROFILE_FIELDS = 'user_id,name,organization,role,interests,seeking,offering,days,visible';