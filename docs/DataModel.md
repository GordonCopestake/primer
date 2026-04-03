# DataModel.md

## Core entities

- ParentAccount
- Household
- ChildProfile
- LearnerState
- CurriculumNode
- Session
- SessionTurn
- AssessmentResult
- SafetyEvent
- StoryInstance
- HomeworkArtifact
- AuditEvent

## Persistence strategy

- Use PostgreSQL and Prisma.
- Keep relational tables for core records.
- Use JSON columns for learner state, curriculum metadata, session summaries, and permissions/settings.
- Seed curriculum from versioned fixtures in-repo.
