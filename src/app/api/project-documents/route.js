import { join } from "node:path";
import { pathToFileURL } from "node:url";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

PDFParse.setWorker(
  pathToFileURL(join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")).href
);

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_FILE_BYTES = 25 * 1024 * 1024;
const MAX_GUIDELINE_CHARS = 60000;
const MAX_SOURCE_CHARS = 300000;
const MAX_PREVIOUS_CHAPTER_CHARS = 180000;

async function extractText(file) {
  if (!file || file.size === 0) throw new Error("One of the selected documents is empty.");
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} exceeds the 8 MB file size limit.`);

  const extension = file.name.split(".").pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  let text;

  if (extension === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      text = result.text;
    } finally {
      await parser.destroy();
    }
  } else if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (extension === "txt" || extension === "md") {
    text = buffer.toString("utf8");
  } else {
    throw new Error(`${file.name} is not supported. Upload a PDF, DOCX, TXT, or Markdown file.`);
  }

  const normalized = text.replace(/\u0000/g, "").trim();
  if (!normalized) {
    const detail = extension === "pdf"
      ? " It may be an image-only scanned PDF; scanned documents are not supported."
      : "";
    throw new Error(`No readable text was found in ${file.name}.${detail}`);
  }
  return normalized;
}

function shortenGuideline(text, maxChars = MAX_GUIDELINE_CHARS) {
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars);
  const lastNewline = sliced.lastIndexOf("\n");
  if (lastNewline > maxChars * 0.9) {
    return sliced.slice(0, lastNewline).trim();
  }
  return sliced.trim();
}

function shortenSourcesCombined(sources, maxCombinedChars = MAX_SOURCE_CHARS) {
  const total = sources.reduce((sum, s) => sum + s.content.length, 0);
  if (total <= maxCombinedChars) return sources;

  const items = sources.map((s, idx) => ({ idx, name: s.name, content: s.content, len: s.content.length }));
  items.sort((a, b) => a.len - b.len);

  let remainingBudget = maxCombinedChars;
  for (let i = 0; i < items.length; i++) {
    const remainingCount = items.length - i;
    const share = Math.floor(remainingBudget / remainingCount);
    if (items[i].len > share) {
      const sliced = items[i].content.slice(0, share);
      const lastNewline = sliced.lastIndexOf("\n");
      items[i].content = (lastNewline > share * 0.9 ? sliced.slice(0, lastNewline) : sliced).trim();
      items[i].len = items[i].content.length;
    }
    remainingBudget -= items[i].len;
  }

  items.sort((a, b) => a.idx - b.idx);
  return items.map(({ name, content }) => ({ name, content }));
}

export async function POST(request) {
  try {
    const requestBytes = Number(request.headers.get("content-length"));
    if (Number.isFinite(requestBytes) && requestBytes > 30 * 1024 * 1024) {
      return Response.json({ error: "The total upload request exceeds the 30 MB limit." }, { status: 413 });
    }

    const formData = await request.formData();
    const mode = formData.get("mode");
    if (mode !== null && mode !== "new" && mode !== "continue") {
      return Response.json({ error: "Choose whether to create a new project or continue an existing one." }, { status: 400 });
    }
    const continuationMode = mode === "continue";
    const guidelineValue = formData.get("guideline");
    const guidelineFile = guidelineValue instanceof File ? guidelineValue : null;
    const sourceFiles = formData.getAll("sources").filter((file) => file instanceof File);
    const chapterFiles = formData.getAll("chapters").filter((file) => file instanceof File);

    if ((!continuationMode && !guidelineFile) || sourceFiles.length === 0) {
      return Response.json(
        { error: continuationMode
          ? "Upload at least one document that supported the project."
          : "Upload a department guideline and at least one project source document." },
        { status: 400 }
      );
    }
    if (sourceFiles.length > 3) {
      return Response.json({ error: "Upload no more than 3 project source documents. The department guideline is separate." }, { status: 400 });
    }
    if (continuationMode && chapterFiles.length !== 3) {
      return Response.json({ error: "Upload one document for each of Chapters 1, 2, and 3." }, { status: 400 });
    }
    if (!continuationMode && chapterFiles.length > 0) {
      return Response.json({ error: "Chapter uploads are only accepted when continuing an existing project." }, { status: 400 });
    }
    const uploadedFiles = [guidelineFile, ...chapterFiles, ...sourceFiles].filter(Boolean);
    const totalBytes = uploadedFiles.reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_TOTAL_FILE_BYTES) {
      return Response.json({ error: "The combined document size must not exceed 25 MB." }, { status: 413 });
    }

    const [rawGuideline, rawSources, rawChapters] = await Promise.all([
      guidelineFile ? extractText(guidelineFile) : Promise.resolve(""),
      Promise.all(sourceFiles.map(async (file) => ({ name: file.name, content: await extractText(file) }))),
      Promise.all(chapterFiles.map(async (file) => ({ name: file.name, content: await extractText(file) })))
    ]);

    const guideline = rawGuideline
      ? shortenGuideline(rawGuideline, MAX_GUIDELINE_CHARS)
      : "No department guideline was uploaded. Continue the chapter structure, terminology, project scope, and citation style evident in the supplied Chapters 1-3. Follow the selected chapter structure in the project workspace for remaining chapters, and do not claim institution-specific formatting rules.";
    const sources = shortenSourcesCombined(rawSources, MAX_SOURCE_CHARS);
    const previousChapters = shortenSourcesCombined(rawChapters, MAX_PREVIOUS_CHAPTER_CHARS)
      .map((chapter, index) => ({ number: index + 1, ...chapter }));

    return Response.json({
      guideline,
      guidelineName: guidelineFile?.name || "Structure inferred from Chapters 1-3",
      guidelineProvided: Boolean(guidelineFile),
      sources,
      previousChapters
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not extract text from the uploaded project documents." },
      { status: 400 }
    );
  }
}
