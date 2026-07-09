export interface CreateApplicationDto {
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  salary?: string;
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  notes?: string;
  appliedAt?: string;
}

export interface UpdateApplicationDto {
  company?: string;
  role?: string;
  location?: string;
  jobUrl?: string;
  salary?: string;
  status?: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  notes?: string;
  appliedAt?: string;
}
