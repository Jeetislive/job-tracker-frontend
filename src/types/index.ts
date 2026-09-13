export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'SAVED',
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: '#9AA3AE',
  APPLIED: '#5B9BF8',
  INTERVIEW: '#F5B23D',
  OFFER: '#3FBF97',
  REJECTED: '#F0676C',
};

export type ApplicationSort = 'createdAt' | 'updatedAt' | 'followUpDate' | 'company';
export type SortOrder = 'asc' | 'desc';

export type ImportStatus = 'pending' | 'confirmed' | 'rejected';
export type ImportPath = 'regex' | 'llm';

export interface ImportPayload {
  _meta?: { path?: ImportPath; platform?: string };
  from?: string;
  subject?: string | null;
  text?: string | null;
}

export interface Application {
  id: string;
  company: string;
  title: string;
  url?: string | null;
  status: ApplicationStatus;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  description?: string | null;
  followUpDate?: string | null;
  appliedDate?: string | null;
  tags: string[];
  source?: string | null;
  sourceId?: string | null;
  sourceMessageId?: string | null;
  autoImported?: boolean;
  importedAt?: string | null;
  importStatus?: ImportStatus | null;
  importConfidence?: number | null;
  importPayload?: ImportPayload | null;
  priority?: number | null;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { notes: number; documents: number };
}

export interface ApplicationDetail extends Application {
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string };
  }>;
  activities: Array<{
    id: string;
    action: string;
    details: unknown;
    createdAt: string;
    user: { id: string; name: string | null; email: string };
  }>;
  documents: Array<{
    id: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
  }>;
}

export interface Stats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  upcomingFollowUps: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplicationFilters {
  search?: string;
  status?: ApplicationStatus | 'all';
  tags?: string[];
  source?: string;
  page?: number;
  limit?: number;
  sort?: ApplicationSort;
  order?: SortOrder;
  appliedFrom?: string;
  appliedTo?: string;
  followUpFrom?: string;
  followUpTo?: string;
  salaryMin?: number;
  salaryMax?: number;
  archived?: boolean;
  includeArchived?: boolean;
}

// ---------------------------------------------------------------------------
// Phase 3 — Integrations
// ---------------------------------------------------------------------------

/** Source → label/icon/color map. `source` values come from the backend. */
export const SOURCE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  manual: { label: 'Manual', icon: '✏️', color: 'text-text-tertiary' },
  email: { label: 'Email', icon: '📧', color: 'text-blue-500' },
  'email:naukri': { label: 'Naukri', icon: '📧', color: 'text-blue-500' },
  'email:foundit': { label: 'Foundit', icon: '📧', color: 'text-purple-500' },
  'email:linkedin': { label: 'LinkedIn', icon: '💼', color: 'text-sky-500' },
  'email:indeed': { label: 'Indeed', icon: '⚡', color: 'text-indigo-500' },
  'email:instahyre': { label: 'Instahyre', icon: '⚡', color: 'text-orange-500' },
  telegram: { label: 'Telegram', icon: '💬', color: 'text-cyan-500' },
};

export function sourceMeta(source?: string | null) {
  return SOURCE_LABELS[source ?? 'manual'] ?? SOURCE_LABELS.manual;
}

export interface InboxItem {
  id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  url: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  appliedDate: string | null;
  tags: string[];
  source: string | null;
  sourceId: string | null;
  sourceMessageId: string | null;
  importStatus: ImportStatus | null;
  importConfidence: number | null;
  importPayload: ImportPayload | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { notes: number; documents: number };
}

export interface IngestSource {
  id: string;
  type: 'email' | 'telegram';
  identifier: string;
  active: boolean;
  createdAt: string;
}

export interface IngestSettings {
  saveEmailBody: boolean;
  llmExtractionEnabled: boolean;
  telegramNotifyEnabled: boolean;
  emailIngestEnabled: boolean;
  telegramChatId: string | null;
}

export interface IngestSourcesResponse {
  sources: IngestSource[];
  settings: IngestSettings;
}

export interface TelegramLinkResponse {
  token: string;
  deepLink: string;
  expiresIn: number;
}

export interface ExtractionTestResult {
  job: {
    platform: string;
    company: string | null;
    title: string | null;
    location: string | null;
    salary: { min?: number; max?: number; currency?: string } | null;
    applyUrl: string | null;
    appliedDate: string | null;
    sourceId: string | null;
    status: string;
    confidence: number;
  };
  path: ImportPath;
}