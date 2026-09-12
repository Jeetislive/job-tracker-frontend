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
  SAVED: 'bg-slate-500',
  APPLIED: 'bg-blue-500',
  INTERVIEW: 'bg-amber-500',
  OFFER: 'bg-emerald-500',
  REJECTED: 'bg-rose-500',
};

export interface Application {
  id: string;
  company: string;
  title: string;
  url?: string | null;
  status: ApplicationStatus;
  salaryMin?: number | null;
  salaryMax?: number | null;
  location?: string | null;
  description?: string | null;
  followUpDate?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes?: Array<{ id: string; content: string; createdAt: string }>;
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