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