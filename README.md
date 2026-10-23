# ProjectPilot

ProjectPilot helps students draft and refine final-year project chapters using their department guideline and project documents.

## AI writing setup

Chapter writing, diagram suggestions, and image generation use the Gemini API. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey), copy `.env.example` to `.env.local`, set `GEMINI_API_KEY`, and restart the development server. The key is used only by server routes and must not be exposed in client-side variables. Gemini text and image models are configurable; check Google AI Studio for the models and free-tier quota available to your account. Image generation may not be available on every tier.

The app supports text-readable/searchable PDF, DOCX, TXT, and Markdown uploads (up to 8 MB each; 25 MB combined). Image-only scanned PDFs are not supported. New projects require a department/university guideline, plus up to three project source documents. The guideline is separate from the three-source limit. Uploaded document text is stored in the browser's local storage for the project. It is sent to Gemini only after the student explicitly checks the consent box and requests chapter writing or refinement; image generation sends the approved image prompt. Gemini API usage is subject to Google's quotas, model availability, and billing terms.

Generated chapters follow the uploaded guideline, use natural academic prose grounded in the student's project details, cite only uploaded sources, flag missing facts/references, and are checked for a minimum of 500 words excluding the reference list. The count includes the chapter title and headings. Students should review, verify, and take responsibility for generated content, citations, and visuals before submission. Relevant image prompts can be used to generate images, and project-specific Mermaid diagrams are rendered for review.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
