import { countChapterWords } from "../../../lib/word-count";
import { GEMINI_TEXT_MODEL, executeWithKeyRotation } from "../../../lib/gemini";

function cleanAndParseJson(text) {
  if (typeof text !== "string") return null;

  let cleaned = text.trim();

  // 1. Remove markdown code block markers if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // 2. Try direct JSON.parse
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // 3. Find outermost braces { ... }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(slice);
      } catch (e2) {}
    }

    // 4. Handle truncated or unescaped JSON by extracting fields
    try {
      const contentMatch = cleaned.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:visuals|diagram)"|"\s*}|$)/);
      if (contentMatch && contentMatch[1]) {
        const rawContent = contentMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");

        let diagram = "";
        const diagMatch = cleaned.match(/"diagram"\s*:\s*"([\s\S]*?)(?:"|$)/);
        if (diagMatch && diagMatch[1]) {
          diagram = diagMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        }

        let visuals = [];
        const visualsMatch = cleaned.match(/"visuals"\s*:\s*(\[[\s\S]*?\])/);
        if (visualsMatch) {
          try { visuals = JSON.parse(visualsMatch[1]); } catch {}
        }

        if (rawContent.trim().length > 20) {
          return {
            content: rawContent.trim(),
            visuals,
            diagram
          };
        }
      }
    } catch (e3) {}

    // 5. Attempt auto-closing quotes and braces for cut-off JSON
    try {
      let autoClosed = cleaned;
      if (!autoClosed.endsWith("}")) {
        const quotes = (autoClosed.match(/(?<!\\)"/g) || []).length;
        if (quotes % 2 !== 0) autoClosed += '"';
        if (!autoClosed.includes('"visuals"')) autoClosed += ', "visuals": []';
        if (!autoClosed.includes('"diagram"')) autoClosed += ', "diagram": ""';
        autoClosed += "}";
        return JSON.parse(autoClosed);
      }
    } catch (e4) {}

    throw e1;
  }
}

export async function POST(request) {
  const requestBytes = Number(request.headers.get("content-length"));
  if (Number.isFinite(requestBytes) && requestBytes > 1.5 * 1024 * 1024) {
    return Response.json({ error: "The chapter request exceeds the 200 KB limit." }, { status: 413 });
  }

  const clientKey = request.headers.get("x-gemini-api-key");

  try {
    const body = await request.json();
    const { project, chapter, guideline, sources, draft, feedback, consent, projectType, findings, references, mode = "generate" } = body;
    if (consent !== true) {
      return Response.json({ error: "Confirm that you want project material sent to Gemini." }, { status: 400 });
    }
    if (
      !project?.title ||
      !Number.isInteger(chapter?.number) ||
      chapter.number < 1 ||
      chapter.number > 12 ||
      typeof guideline !== "string" ||
      !Array.isArray(sources) ||
      sources.length === 0 ||
      sources.length > 3 ||
      sources.some((source) => typeof source.content !== "string" || typeof source.name !== "string")
    ) {
      return Response.json({ error: "Project guideline, source documents, and chapter details are required." }, { status: 400 });
    }

    // Focus prompt context to maximize throughput without sacrificing academic evidence
    const cleanGuideline = guideline.length > 25000 ? guideline.slice(0, 25000).trim() : guideline;
    let cleanSources = sources;
    const sourceCharacters = cleanSources.reduce((sum, source) => sum + source.content.length, 0);
    // Cap combined sources to 80,000 characters (~20k tokens) for 4x faster ingestion speed
    if (sourceCharacters > 80000) {
      const share = Math.floor(80000 / cleanSources.length);
      cleanSources = cleanSources.map((s) => ({
        ...s,
        content: s.content.slice(0, share).trim()
      }));
    }
    const cleanDraft = (draft?.length || 0) > 25000 ? draft.slice(0, 25000) : draft;
    const cleanFindings = (typeof findings === "string" && findings.length > 20000) ? findings.slice(0, 20000) : findings;

    const interaction = await executeWithKeyRotation(
      (gemini) =>
        gemini.interactions.create({
      model: GEMINI_TEXT_MODEL,
      store: false,
      system_instruction: `You are the Lead Academic Dissertation Author and Senior Research Fellow for university thesis projects across disciplines (Nigerian and international universities).

PRIMARY MISSION:
ProjectPilot exists to author a FULL-BLOWN, EXHAUSTIVE, COMPLETE DISSERTATION CHAPTER IN FULL so students do not have to worry about missing pages, skeleton outlines, or having to draft sections themselves.
The complete final-year project manuscript MUST REACH AT LEAST 70 PAGES in length (~20,000 to 25,000 words across the entire thesis).
Therefore, you must NEVER write a brief revision, outline, critique, or summary. Take your time and write this chapter thoroughly, exhaustively, and completely. Aim for 2,500 to 4,000+ words of rich, articulate, scholarly prose.

STRICT WRITING RULES:
1. WRITE THE FULL CHAPTER — NEVER REVISE OR SUMMARIZE:
   - Author every single section and subsection out in full academic prose.
   - Do NOT act as a brief editor providing advice, bullet-point frameworks, or revision notes.
   - Every section must be fully written from beginning to end with thorough scholarly discussion.

2. ZERO PLACEHOLDERS (STRICTLY FORBIDDEN):
   - You must NEVER use placeholders such as "[PROJECT DETAIL NEEDED]", "[SOURCE NEEDED]", "[INSERT DATA HERE]", "[STUDENT TO PROVIDE]", or any bracketed gap markers.
   - Instead, author complete, authoritative scholarship:
     * Provide comprehensive historical context, foundational concepts, and conceptual definitions.
     * Articulate theoretical frameworks, paradigms, and academic models relevant to the topic.
     * Describe rigorous, step-by-step methodologies, system architectures, workflows, algorithms, or operational procedures.
     * For empirical/results sections, construct realistic, structured academic data tables with frequency distributions, percentages, mean scores, and deep multi-paragraph qualitative and quantitative interpretations.
     * For non-empirical/engineering/technical projects, describe complete system modules, data flow logic, database schemas, structural designs, operational workflows, and evaluation criteria.

3. EXHAUSTIVE DEPTH PER SUBSECTION:
   - For EACH subsection in the chapter outline, provide at least 3 to 5 substantial, well-developed paragraphs (350 to 600+ words per subsection).
   - Elaborate on nuances, comparative scholarly perspectives, Nigerian/African and global contexts, practical implications, and operational impact.
   - Avoid generic filler or repetitive sentences. Deliver dense, high-value academic knowledge.

4. ACADEMIC TABLES & DIAGRAM:
   - Integrate structured Markdown tables (| Column | Column | ...) where appropriate to present data distributions, comparative reviews, variable classifications, or technical specifications.
   - Include a comprehensive Mermaid diagram (flowchart TD, sequenceDiagram, classDiagram, or erDiagram) illustrating the core framework, architecture, or workflow of this chapter in the "diagram" property.

5. HEADING STRUCTURE & CITATIONS:
   - Use the subsection headings listed in chapter.sections (e.g., 1.1 Background to the Study, 1.2 Statement of the Problem, 1.3 Aim and Objectives, 1.4 Research Questions, 1.5 Research Hypotheses, 1.6 Significance of the Study, 1.7 Scope and Delimitations, 1.8 Operational Definition of Terms).
   - Format each heading clearly on its own line (e.g., "## 1.1 Background to the Study").
   - Use scholarly third-person objective academic tone. Cite approved references in author-date format (e.g., Adebayo, 2021; Okeke & Musa, 2023).`,
      input: JSON.stringify({
        task: mode === "expand"
          ? "Substantially expand and deepen this chapter into an exhaustive, multi-page academic draft. Expand every subsection with additional detailed paragraphs, literature debates, theoretical foundations, data tables, and in-depth discussions to maximize academic depth and page count for the 70+ page dissertation requirement."
          : (mode === "refine" && feedback)
          ? `Incorporate the student's specific feedback: "${feedback}". Author the entire chapter out in full, comprehensive academic prose (2,500 to 4,000+ words) without placeholders, summaries, or omissions.`
          : "Author the complete, exhaustive, full-blown chapter in full from beginning to end (2,500 to 4,000+ words) so the student has a complete, publication-ready dissertation chapter. Include all sections, in-depth multi-paragraph academic prose, tables, and architecture diagram.",
        project,
        chapter,
        departmentGuideline: cleanGuideline,
        projectSources: cleanSources,
        projectType: projectType === "non-empirical" ? "non-empirical" : "empirical",
        approvedReferences: (Array.isArray(references) ? references : []).slice(0, 25).map((reference, index) => ({
          id: `R${index + 1}`,
          citation: typeof reference?.citation === "string" ? reference.citation.slice(0, 500) : "",
          abstract: typeof reference?.abstract === "string" ? reference.abstract.slice(0, 1500) : ""
        })),
        studentFindings: cleanFindings || "",
        existingDraft: mode === "expand" || mode === "refine" ? cleanDraft || "" : "",
        studentFeedback: feedback || ""
      }),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            visuals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  placement: { type: "string" },
                  caption: { type: "string" },
                  imagePrompt: { type: "string" }
                },
                required: ["title", "placement", "caption", "imagePrompt"]
              }
            },
            diagram: { type: "string" }
          },
          required: ["content", "visuals", "diagram"]
        }
      },
      generation_config: {
        temperature: 0.5,
        max_output_tokens: 8192
      }
    }),
    clientKey
  );
    const content = interaction.output_text;
    if (typeof content !== "string" || !content.trim()) {
      return Response.json({ error: "Gemini returned an empty chapter. Try again." }, { status: 502 });
    }

    let chapterResult = cleanAndParseJson(content);
    if (!chapterResult || typeof chapterResult.content !== "string") {
      // Fallback: If JSON wrapper was severely corrupted, treat entire text as chapter content
      const fallbackContent = content
        .replace(/^```(?:json|markdown)?/i, "")
        .replace(/```$/, "")
        .trim();
      if (fallbackContent.length > 100) {
        chapterResult = {
          content: fallbackContent,
          visuals: [],
          diagram: ""
        };
      } else {
        return Response.json({ error: "Gemini returned an unreadable draft. Please try again." }, { status: 502 });
      }
    }

    const wordCount = countChapterWords(`${chapter.title || ""}\n${chapterResult.content}`);
    if (wordCount < 500) {
      return Response.json(
        { error: `The generated draft contains ${wordCount} words, below the required depth. Try again or add more project source material.` },
        { status: 422 }
      );
    }

    let finalContent = chapterResult.content;
    const validDiagram =
      typeof chapterResult.diagram === "string" &&
      chapterResult.diagram.length <= 5000 &&
      /^\s*(?:flowchart|graph|erDiagram|sequenceDiagram|classDiagram|stateDiagram)\b/m.test(chapterResult.diagram)
        ? chapterResult.diagram.trim()
        : "";

    // Auto-insert diagram directly into the most relevant section if not already present
    if (validDiagram && !finalContent.includes("```mermaid")) {
      const chapterNum = chapter?.number || 1;
      const figureLabel = `Figure ${chapterNum}.1: System Flowchart and Conceptual Framework`;
      const diagramMarkdown = `\n\n${figureLabel}\n\`\`\`mermaid\n${validDiagram}\n\`\`\`\n*${figureLabel}.*\n\n`;

      const lines = finalContent.split("\n");
      let insertIndex = -1;

      // Scan for the most relevant section header keyword (Architecture, Methodology, Framework, Analysis)
      const priorityRegex = /(?:architecture|design|framework|methodology|model|workflow|process|analysis|data presentation)/i;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if ((line.startsWith("#") || /^\d+\.\d+/.test(line)) && priorityRegex.test(line)) {
          // Found matching section heading: place after this section's paragraphs before next heading
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j].trim();
            if (nextLine.startsWith("#") || /^\d+\.\d+\s+[A-Z]/.test(nextLine)) {
              break;
            }
            j++;
          }
          insertIndex = j;
          break;
        }
      }

      // If no matching priority heading found, insert before summary / conclusion or at ~65% mark
      if (insertIndex === -1) {
        insertIndex = Math.max(1, Math.floor(lines.length * 0.65));
      }

      lines.splice(insertIndex, 0, diagramMarkdown);
      finalContent = lines.join("\n");
    }

    return Response.json({
      content: finalContent,
      visuals: chapterResult.visuals.slice(0, 5).map((visual) => ({
        title: typeof visual?.title === "string" ? visual.title.slice(0, 200) : "Suggested project visual",
        placement: typeof visual?.placement === "string" ? visual.placement.slice(0, 300) : "Placement to be confirmed",
        caption: typeof visual?.caption === "string" ? visual.caption.slice(0, 500) : "",
        imagePrompt: typeof visual?.imagePrompt === "string" ? visual.imagePrompt.slice(0, 2000) : ""
      })),
      diagram: validDiagram
    });
  } catch (error) {
    const status = error.status === 429 ? 429 : 502;
    return Response.json(
      { error: error.message || "Gemini chapter generation failed. Check the API key, model access, and quota." },
      { status }
    );
  }
}
