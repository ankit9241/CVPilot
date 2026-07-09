export interface ApplicationDomain {
  id: string;
  userId: string;
  resumeId?: string;
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  salary?: string;
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  notes?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStageDomain {
  id: string;
  applicationId: string;
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  note?: string;
  changedAt: string;
}
