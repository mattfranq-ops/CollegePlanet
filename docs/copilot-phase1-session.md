# GitHub Copilot session: Sprint 2 Phase 1 prompt and response

Saved as evidence for [ai-design-review.md](ai-design-review.md). Copied verbatim from the team's Copilot chat in VS Code.

```text
You are helping our team with ITSC 3155 Implementation Sprint 2 for CollegePlanet.


CONTEXT
- Database: Firebase Firestore (project id: collegeplanet-2e87a), Firebase JS SDK v9+ modular API.
- Local dev uses the Firebase Emulator Suite: Auth 9099, Firestore 8085, UI 4000 (already configured in firebase.json).
- Config values come from a local .env file (never hardcode them).
- Do NOT git commit or push anything. Do not touch the production Firestore database.


PHASE 1 - ANALYZE (do this first, then STOP and wait for approval)
1. Inspect our Figma design via MCP and the existing source code (including the Student Login feature).
2. Review our GitHub Issues/user stories and acceptance criteria.
3. Propose the Firestore data model: collections, document fields with types, references between documents, and required indexes.
4. List assumptions and missing requirements.
5. Propose a UML class diagram and a sequence diagram (PlantUML) for one user story that saves data.


PHASE 2 - AFTER WE APPROVE
1. Save diagrams to docs/uml/ (.puml + rendered PNG).
2. Create typed document models and a repository/data-access layer separate from UI code.
3. Initialize Firebase from env vars and connect to the emulators in development.
4. Write firestore.rules so users can only read/write their own data; update firestore.indexes.json.
5. Add a seed script for sample development data.
6. Implement the approved user story in the existing UI with input validation and error handling. Data must persist after restarting the app.
7. Add .gitignore entries (.env, .env.*, !.env.example, node_modules/, *.pem, *.key, service-account*.json) and a .env.example with placeholder values only.
8. Add Jest or Vitest tests that run against the Firestore emulator: at least one successful operation and one invalid-input case. Add an npm "test" and "lint" script and make lint pass.
9. Write docs/database-setup.md (why Firestore, setup steps, emulator usage, a team verification table with empty rows) and docs/ai-design-review.md (at least one AI suggestion we reviewed and corrected).


Finish with a summary of every file created or changed and anything we should double-check.

To complete Phase 1 (Analyze) properly, I need access to the project artifacts that are not currently available in this chat.

Required Inputs
Please provide one of the following:

Source code repository

GitHub URL (or upload/source files)
Especially:
Firebase setup files
Student Login implementation
Existing data models/types
Package.json
Current project structure
Figma

Figma file link, or
Exported screenshots of the relevant flows/screens
GitHub Issues / User Stories

Link to the project board/issues, or
Paste the user stories and acceptance criteria
What I Will Deliver in Phase 1
After reviewing those artifacts, I will provide:

1. Existing-System Analysis
Current architecture assessment
Student Login implementation review
UI-to-data mapping from Figma screens
Gaps between implementation and requirements
2. Firestore Data Model Proposal
Including:

Collections
Documents
Field types
Document ownership strategy
References/subcollections
Query patterns
Required composite indexes
Rule design considerations
Example format:



users/{uid}
  uid: string
  email: string
  role: "student"
  createdAt: Timestamp

majors/{majorId}
  name: string
  department: string

profiles/{uid}
  displayName: string
  graduationYear: number
  majorId: DocumentReference
3. Assumptions & Missing Requirements
For example:

Should users edit previously saved records?
Should records be soft deleted?
Should instructors/admins exist?
Is data private or shareable?
4. UML Diagrams (PlantUML)
Domain/Class Diagram
Sequence Diagram for a persistence workflow
Example sequence:



Student -> UI : Submit Form
UI -> Repository : saveProfile()
Repository -> Firestore : setDoc()
Firestore --> Repository : success
Repository --> UI : success
UI --> Student : confirmation
5. Index Plan
Example:



{
  "collectionGroup": "applications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
Once you provide the repo, Figma, and issues/acceptance criteria, I'll perform Phase 1 only and stop for approval before proposing any implementation changes.
```
