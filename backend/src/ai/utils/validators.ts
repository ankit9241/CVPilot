import { GeneratedResume, GeneratedExperience, GeneratedProject, GeneratedSkill } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationResult {
  errors: ValidationError[] = [];

  isValid(): boolean {
    return this.errors.length === 0;
  }

  addError(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  throw(): void {
    if (!this.isValid()) {
      const errorMessages = this.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
  }
}

export function validateExperience(exp: unknown): ValidationResult {
  const result = new ValidationResult();
  const e = exp as Record<string, unknown>;

  if (typeof e.companyName !== 'string' || !e.companyName.trim()) {
    result.addError('companyName', 'Company name is required');
  }
  if (typeof e.role !== 'string' || !e.role.trim()) {
    result.addError('role', 'Role is required');
  }
  if (!Array.isArray(e.bulletPoints)) {
    result.addError('bulletPoints', 'Bullet points must be an array');
  }

  return result;
}

export function validateProject(proj: unknown): ValidationResult {
  const result = new ValidationResult();
  const p = proj as Record<string, unknown>;

  if (typeof p.name !== 'string' || !p.name.trim()) {
    result.addError('name', 'Project name is required');
  }
  if (!Array.isArray(p.bulletPoints)) {
    result.addError('bulletPoints', 'Bullet points must be an array');
  }
  if (!Array.isArray(p.technologies)) {
    result.addError('technologies', 'Technologies must be an array');
  }

  return result;
}

export function validateSkill(skill: unknown): ValidationResult {
  const result = new ValidationResult();
  const s = skill as Record<string, unknown>;

  if (typeof s.name !== 'string' || !s.name.trim()) {
    result.addError('name', 'Skill name is required');
  }
  if (typeof s.category !== 'string') {
    result.addError('category', 'Category is required');
  }

  return result;
}

export function validateGeneratedResume(resume: unknown): ValidationResult {
  const result = new ValidationResult();
  const r = resume as Record<string, unknown>;

  if (typeof r.summary !== 'string' || !r.summary.trim()) {
    result.addError('summary', 'Summary is required');
  }
  if (!Array.isArray(r.experiences) || r.experiences.length === 0) {
    result.addError('experiences', 'At least one experience is required');
  } else {
    r.experiences.forEach((exp, idx) => {
      const expResult = validateExperience(exp);
      expResult.errors.forEach((err) => {
        result.addError(`experiences[${idx}].${err.field}`, err.message);
      });
    });
  }
  if (!Array.isArray(r.skills) || r.skills.length === 0) {
    result.addError('skills', 'At least one skill is required');
  } else {
    r.skills.forEach((skill, idx) => {
      const skillResult = validateSkill(skill);
      skillResult.errors.forEach((err) => {
        result.addError(`skills[${idx}].${err.field}`, err.message);
      });
    });
  }
  if (!Array.isArray(r.education)) {
    result.addError('education', 'Education must be an array');
  }
  if (!Array.isArray(r.projects)) {
    result.addError('projects', 'Projects must be an array');
  }

  return result;
}
