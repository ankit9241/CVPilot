export const analyzeJobDescriptionPrompt = `Analyze the target job description and identify key requirements, responsibilities, and desired skills.

Extract and categorize:
1. Hard skills required
2. Soft skills required
3. Experience level/years needed
4. Key responsibilities
5. Must-have qualifications
6. Nice-to-have qualifications

Return a JSON object with:
{
  "hardSkills": string[],
  "softSkills": string[],
  "experienceYears": number,
  "keyResponsibilities": string[],
  "mustHave": string[],
  "niceToHave": string[],
  "roleLevel": "junior" | "mid" | "senior" | "lead",
  "summary": string (1-2 sentences)
}

Only return valid JSON. No markdown.`;
