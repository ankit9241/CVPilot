export interface ProfileDomain {
  id: string;
  userId: string;
  fullName: string;
  headline?: string;
  phone?: string;
  location?: string;
  summary?: string;
  avatarUrl?: string;
  completionPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletion {
  completionPct: number;
  missing: string[];
  sections?: Record<string, number>;
}
