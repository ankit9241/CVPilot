export interface TemplateDomain {
  id: string;
  name: string;
  description?: string;
  category: 'MODERN' | 'CLASSIC' | 'MINIMAL' | 'PROFESSIONAL' | 'CREATIVE' | 'ACADEMIC' | 'CORPORATE';
  previewUrl?: string;
  latexSource?: string;
  isPremium: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
