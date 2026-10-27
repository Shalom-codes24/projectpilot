import { GEMINI_TEXT_MODEL, executeWithKeyRotation } from "../../../lib/gemini";

export async function POST(request) {
  const clientKey = request.headers.get("x-gemini-api-key");

  try {
    const { project, chapters, consent } = await request.json();
    if (consent !== true) {
      return Response.json({ error: "Confirm that you want your chapters sent to Gemini." }, { status: 400 });
    }
    if (!Array.isArray(chapters) || chapters.length === 0 || chapters.some((chapter) => typeof chapter?.content !== "string")) {
      return Response.json({ error: "Chapter text is required to write an abstract." }, { status: 400 });
    }
    const totalCharacters = chapters.reduce((sum, chapter) => sum + chapter.content.length, 0);
    if (totalCharacters === 0 || totalCharacters > 150000) {
      return Response.json({ error: "Write your chapters first (and keep them under 150,000 characters) before generating the abstract." }, { status: 413 });
    }

    const interaction = await executeWithKeyRotation(
      (gemini) =>
        gemini.interactions.create({
          model: GEMINI_TEXT_MODEL,
          store: false,
          system_instruction: `Write a comprehensive, publication-ready abstract for this student's university final-year project.
- Length: 200 to 350 words, structured as one or two dense, scholarly paragraphs with no headings or citations.
- Cover in logical sequence: (1) Background and problem statement, (2) Aim and research methodology (design, population, sample, tools), (3) Key empirical findings, statistical results, or system implementation outcomes (synthesize realistic, meaningful outcomes if not explicitly stated), and (4) Primary conclusions, academic contributions, and recommendations.
- STRICTLY FORBIDDEN: Never write "[PROJECT DETAIL NEEDED]", "[SOURCE NEEDED]", or any bracketed gap markers. The abstract must be 100% complete and ready for the student's final manuscript submission.`,
          input: JSON.stringify({
            project: { title: project?.title, projectType: project?.projectType || "empirical" },
            chapters: chapters.map((chapter) => ({ title: String(chapter.title || ""), content: chapter.content }))
          }),
          generation_config: { temperature: 0.3, max_output_tokens: 1000 }
        }),
      clientKey
    );

    const abstract = typeof interaction.output_text === "string" ? interaction.output_text.trim() : "";
    if (!abstract) {
      return Response.json({ error: "Gemini returned an empty abstract. Try again." }, { status: 502 });
    }
    return Response.json({ abstract });
  } catch (error) {
    const status = error.status === 429 ? 429 : 502;
    return Response.json({ error: error.message || "Abstract generation failed." }, { status });
  }
}
