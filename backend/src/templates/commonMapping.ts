import { escapeLatex } from './index';

function shortenLink(url: string | undefined | null): string {
  if (!url) return '';
  return url
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/$/, '');
}

export function mapResumeToVariables(resume: any, profile: any): any {
  const socials = profile?.socialLinks || [];
  const getSocial = (platform: string) => socials.find((s: any) => s.platform?.toLowerCase() === platform)?.url || '';

  const github = getSocial('github');
  const linkedin = getSocial('linkedin');
  const website = getSocial('website') || getSocial('portfolio');

  // Contact line assembly (Phone • Email • LinkedIn • GitHub • Portfolio)
  const contacts: string[] = [];
  if (profile?.phone) {
    contacts.push(profile.phone);
  }
  const email = profile?.email || profile?.user?.email;
  if (email) {
    contacts.push(email);
  }
  if (linkedin) {
    contacts.push(shortenLink(linkedin));
  }
  if (github) {
    contacts.push(shortenLink(github));
  }
  if (website) {
    contacts.push(shortenLink(website));
  }

  const escapedContacts = contacts.map(c => escapeLatex(c));
  // Standard LaTeX bullet separator with padding
  const contactLine = escapedContacts.join(' \\textbullet{} ');

  const educationList = (resume.education || []).map((edu: any) => ({
    school: edu.school || '',
    degree: edu.degree || '',
    field: edu.field || '',
    gpa: edu.gpa || '',
    startDate: edu.startDate || '',
    endDate: edu.endDate || '',
  }));

  const experienceList = (resume.experiences || []).map((exp: any) => ({
    companyName: exp.companyName || '',
    role: exp.role || '',
    location: exp.location || '',
    startDate: exp.startDate || '',
    endDate: exp.endDate || '',
    bulletPoints: exp.bulletPoints || [],
  }));

  const projectList = (resume.projects || []).map((proj: any) => ({
    name: proj.name || '',
    technologies: proj.technologies ? proj.technologies.map((t: string) => escapeLatex(t)).join(' \\textbullet{} ') : '',
    startDate: proj.startDate || '',
    endDate: proj.endDate || '',
    bulletPoints: proj.bulletPoints || [],
  }));

  const skillsList = (resume.skills || []).map((sk: any) => ({
    category: sk.category || 'Other',
    name: sk.name || '',
  }));

  const certificationList = (resume.certificates || []).map((cert: any) => ({
    name: cert.name || '',
    issuer: cert.issuer || '',
  }));

  const achievementList = (resume.achievements || []).map((ach: any) => {
    if (typeof ach === 'string') return ach;
    return ach.description || ach.name || '';
  });

  return {
    fullName: profile?.fullName || 'John Doe',
    headline: resume.metadata?.targetRole || profile?.headline || 'Software Engineer',
    contactLine,
    email: email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    github: shortenLink(github),
    linkedin: shortenLink(linkedin),
    website: shortenLink(website),
    summary: resume.summary || '',
    
    // Arrays
    education: educationList,
    experience: experienceList,
    projects: projectList,
    skills: skillsList,
    certifications: certificationList,
    achievements: achievementList,

    // Boolean flags for conditional sections
    hasSummary: !!resume.summary,
    hasEducation: educationList.length > 0,
    hasExperience: experienceList.length > 0,
    hasProjects: projectList.length > 0,
    hasSkills: skillsList.length > 0,
    hasCertifications: certificationList.length > 0,
    hasAchievements: achievementList.length > 0,
  };
}
