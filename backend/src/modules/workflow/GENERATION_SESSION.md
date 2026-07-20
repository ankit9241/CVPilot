# Generation Session Orchestration

The Generation Session orchestration layer handles the complete workflow for preparing a resume context before AI-driven generation.

## Architecture

### Key Components

1. **GenerationSessionService** - Orchestrates the entire workflow
2. **GenerationSessionRepository** - Data access for sessions
3. **WorkflowLogRepository** - Tracks workflow execution steps
4. **AIMessageRepository** - Records progress messages visible to the user

## Workflow Flow

```
User initiates generation (POST /workflow)
    ↓
Create GenerationSession (status: QUEUED)
    ↓
Execute workflow (POST /workflow/:id/execute)
    ├─ Read Master Profile
    ├─ Read Company Information
    ├─ Parse Job Description
    ├─ Extract Keywords
    ├─ Read Experiences
    ├─ Read Projects
    ├─ Read Skills
    ├─ Read Educations
    ├─ Read Certificates
    ├─ Read Achievements
    ├─ Rank Experiences
    ├─ Rank Projects
    ├─ Rank Skills
    └─ Prepare AI Context
    ↓
Return ResumeContext (status: COMPLETED)
```

## API Endpoints

### 1. Initiate Generation Session

**POST** `/workflow`

Creates a new generation session. No LLM calls yet.

```json
{
  "input": {
    "companyName": "Tech Corp",
    "targetRole": "Senior Software Engineer",
    "jobDescription": "We are looking for a senior engineer with 5+ years of experience..."
  }
}
```

**Response:**
```json
{
  "id": "sess_abc123",
  "userId": "user_xyz",
  "companyName": "Tech Corp",
  "targetRole": "Senior Software Engineer",
  "status": "QUEUED",
  "currentStep": null,
  "createdAt": "2026-07-10T10:30:00Z"
}
```

### 2. Get Session Details

**GET** `/workflow/:id`

Retrieves the current session including workflow logs and AI messages.

```json
{
  "id": "sess_abc123",
  "status": "PROCESSING",
  "currentStep": "Rank Experiences",
  "workflowLogs": [...],
  "aiMessages": [...]
}
```

### 3. Get Workflow Logs

**GET** `/workflow/:id/logs`

Returns all workflow steps executed for the session.

```json
[
  {
    "id": "log_1",
    "sessionId": "sess_abc123",
    "stepName": "Master Profile",
    "message": "Loaded profile for John Doe",
    "status": "COMPLETED",
    "timestamp": "2026-07-10T10:30:01Z"
  },
  ...
]
```

### 4. Execute Workflow & Get ResumeContext

**POST** `/workflow/:id/execute`

Executes the complete workflow and returns the fully prepared ResumeContext.

**Response:**
```json
{
  "personalInfo": {
    "fullName": "John Doe",
    "headline": "Software Engineer",
    "phone": "+1-555-0100",
    "location": "San Francisco, CA",
    "summary": "Experienced engineer...",
    "avatarUrl": null
  },
  "experiences": [
    {
      "id": "exp_1",
      "companyName": "Tech Corp",
      "role": "Senior Engineer",
      "location": "San Francisco, CA",
      "startDate": "2020-01-15T00:00:00Z",
      "endDate": null,
      "isCurrent": true,
      "description": "Led team of 5...",
      "technologiesUsed": ["TypeScript", "React", "PostgreSQL"],
      "achievements": ["Reduced load time by 40%", "Mentored 3 junior engineers"],
      "relevanceScore": 0.95
    }
  ],
  "projects": [...],
  "skills": [...],
  "educations": [...],
  "certificates": [...],
  "achievements": [...],
  "company": {
    "name": "Tech Corp",
    "description": "Leading tech company...",
    "industry": "Technology"
  },
  "targetRole": "Senior Software Engineer",
  "jobDescription": {
    "raw": "Full job description text...",
    "requirements": ["5+ years experience", ...],
    "responsibilities": ["Lead technical team", ...],
    "keywords": ["TypeScript", "React", "Leadership", ...]
  },
  "extractedKeywords": ["TypeScript", "React", "PostgreSQL", "Leadership", "Full-stack", ...],
  "generationSessionId": "sess_abc123",
  "createdAt": "2026-07-10T10:30:15Z"
}
```

## Data Structures

### ResumeContext

The complete context prepared for AI processing. Contains:

- **personalInfo**: User's personal information
- **professionalSummary**: Professional headline/summary
- **experiences**: Ranked work experiences
- **projects**: Ranked portfolio projects
- **skills**: Ranked technical skills
- **educations**: Educational background
- **certificates**: Professional certificates
- **achievements**: Notable achievements
- **company**: Target company information
- **targetRole**: The role being applied for
- **jobDescription**: Parsed job description with keywords
- **extractedKeywords**: All extracted keywords for relevance matching

### GenerationSession Status

- `QUEUED`: Waiting to be processed
- `PROCESSING`: Currently executing workflow
- `COMPLETED`: Workflow finished successfully
- `FAILED`: Workflow encountered an error

## Workflow Logs & AI Messages

### WorkflowLog

Records each step of the workflow:
- Step name (e.g., "Master Profile", "Rank Experiences")
- Execution status (PENDING, IN_PROGRESS, COMPLETED, FAILED)
- Human-readable message
- Timestamp

### AIMessage

Messages sent to the user during workflow:
- Type: STARTED, CONTEXT_READY, ERROR, etc.
- Message: User-friendly description
- Metadata: Additional context (counts, scores, etc.)
- Timestamp

## Ranking Algorithm

### Experience Ranking

Experiences are ranked by:
1. Recency (most recent first)
2. Relevance score (keyword matches)
3. Current employment status

### Project Ranking

Projects are ranked by:
1. Featured flag (featured projects first)
2. Relevance score (keyword matches)
3. Creation date (newer first)

### Skill Ranking

Skills are ranked by:
1. Sort order (explicit ordering by user)
2. Relevance score (keyword matches)
3. Category match (matching job requirements)

## Keyword Extraction

The system extracts keywords using:
1. **Technology keywords**: Pre-defined list of common tech terms
2. **Capitalized phrases**: Multi-word technical terms from job description
3. **Text analysis**: Keywords found in requirements and responsibilities

Maximum 30 keywords extracted.

## Error Handling

If any step fails:
1. Session status is set to FAILED
2. Error message is recorded
3. All workflow logs up to failure are retained
4. AI message with error details is logged

## Future Enhancements

This layer prepares data for:
1. LangGraph AI workflow (next phase)
2. ATS scoring and optimization
3. PDF/LaTeX generation
4. Template selection and formatting

Currently, no LLM calls are made during this phase. The ResumeContext is the input for downstream AI services.
