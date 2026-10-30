# ProjectPilot

ProjectPilot helps students draft and refine final-year project chapters using their department guideline and project documents.

## AI writing setup

Chapter writing, diagram suggestions, and image generation use the Gemini API. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey), copy `.env.example` to `.env.local`, set `GEMINI_API_KEY`, and restart the development server. The key is used only by server routes and must not be exposed in client-side variables. Gemini text and image models are configurable; check Google AI Studio for the models and free-tier quota available to your account. Image generation may not be available on every tier.

The app supports text-readable/searchable PDF, DOCX, TXT, and Markdown uploads (up to 8 MB each; 25 MB combined). Image-only scanned PDFs are not supported. New projects require a department/university guideline and up to three project source documents. To continue an existing project, import one document for each of Chapters 1-3 and at least one supporting source document; the department guideline is optional and the selected chapter structure is used when no guideline is provided. For guests, project data and extracted document text remain in browser storage; signed-in project data is saved to the user's Neon account. Text is sent to Gemini only after the student explicitly checks the consent box and requests chapter writing or refinement; image generation sends the approved image prompt. Gemini API usage is subject to Google's quotas, model availability, and billing terms.

## Accounts and cloud project saves

ProjectPilot uses Neon Managed Better Auth for email/password accounts and Neon Postgres to save each signed-in user's projects. A Neon project named `projectpilot` with Managed Better Auth is provisioned for this app. Copy its Auth URL from Neon Console → Auth settings into `NEON_AUTH_BASE_URL`; add the database connection string from the project dashboard as `DATABASE_URL`. Generate a unique cookie secret of at least 32 characters for `NEON_AUTH_COOKIE_SECRET`, then restart the app. Keep these server-only values out of `NEXT_PUBLIC_*` variables and source control.

The `projectpilot_projects` table is defined in `migrations/0001-projectpilot-projects.sql` and has already been created in the provisioned database. Apply that migration to any other Neon database before running the app. Signed-in users can view all their saved projects from the Student Dashboard, reopen them, and mark them completed. Browser-only projects are uploaded to the signed-in account the first time a user signs in; signing out removes the cloud project from the current browser session. Guests can continue using local browser saves.

The database stores project drafts and extracted text from uploaded documents. Account owners can access their own saved project; treat the contents as private academic work and avoid using shared devices without signing out.

Generated chapters follow the uploaded guideline, use natural academic prose grounded in the student's project details, cite only uploaded sources, flag missing facts/references, and are checked for a minimum of 500 words excluding the reference list. The count includes the chapter title and headings. Students should review, verify, and take responsibility for generated content, citations, and visuals before submission. Relevant image prompts can be used to generate images, and project-specific Mermaid diagrams are rendered for review.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
