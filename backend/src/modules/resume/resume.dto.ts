export interface CreateResumeDto {
  title: string;
  templateId?: string;
  company?: string;
  role?: string;
}

export interface UpdateResumeDto {
  title?: string;
  templateId?: string;
  company?: string;
  role?: string;
  isFavorite?: boolean;
}

export interface CreateResumeVersionDto {
  label?: string;
  contentJson: Record<string, unknown>;
  pdfUrl?: string;
  latexSource?: string;
}
