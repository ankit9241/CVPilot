import { escapeLatex } from '../index';

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
  const leetcode = getSocial('leetcode');
  const codeforces = getSocial('codeforces');
  const codechef = getSocial('codechef');
  const hackerrank = getSocial('hackerrank');

  // Contact line assembly
  const contacts: string[] = [];
  if (profile?.phone) contacts.push(profile.phone);
  if (profile?.user?.email || profile?.email) contacts.push(profile.email || profile?.user?.email);
  if (profile?.location) contacts.push(profile.location);

  if (linkedin) contacts.push(shortenLink(linkedin));
  if (github) contacts.push(shortenLink(github));
  if (website) contacts.push(shortenLink(website));
  if (leetcode) contacts.push(shortenLink(leetcode));
  if (codeforces) contacts.push(shortenLink(codeforces));
  if (codechef) contacts.push(shortenLink(codechef));
  if (hackerrank) contacts.push(shortenLink(hackerrank));

  const escapedContacts = contacts.map(c => escapeLatex(c));
  const contactLine = escapedContacts.join(' \\textbullet{} ');

  return {
    fullName: profile?.fullName || 'John Doe',
    headline: resume.metadata?.targetRole || profile?.headline || 'Software Engineer',
    contactLine,
    email: profile?.user?.email || profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    github: shortenLink(github),
    linkedin: shortenLink(linkedin),
    website: shortenLink(website),
    leetcode: shortenLink(leetcode),
    codeforces: shortenLink(codeforces),
    codechef: shortenLink(codechef),
    hackerrank: shortenLink(hackerrank),
    summary: resume.summary || '',
    experience: (resume.experiences || []).map((exp: any) => ({
      companyName: exp.companyName,
      role: exp.role,
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      description: exp.description || '',
      bulletPoints: exp.bulletPoints || [],
    })),
    projects: (resume.projects || []).map((proj: any) => ({
      name: proj.name,
      description: proj.description,
      role: proj.role || '',
      technologies: proj.technologies ? proj.technologies.join(' \\textbullet{} ') : '',
      bulletPoints: proj.bulletPoints || [],
    })),
    education: (resume.education || []).map((edu: any) => ({
      school: edu.school,
      degree: edu.degree,
      field: edu.field || '',
      gpa: edu.gpa || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
    })),
    skills: (resume.skills || []).map((sk: any) => ({
      name: sk.name,
      category: sk.category,
      level: sk.level || 0,
    })),
    certifications: (resume.certificates || []).map((cert: any) => ({
      name: cert.name,
      issuer: cert.issuer,
    })),
    achievements: resume.achievements || [],
  };
}
