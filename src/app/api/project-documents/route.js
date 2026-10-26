import { join } from "node:path";
import { pathToFileURL } from "node:url";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

PDFParse.setWorker(
  pathToFileURL(join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")).href
);

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_GUIDELINE_CHARS = 60000;
const MAX_SOURCE_CHARS = 300000;

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

export async function POST(request) {
  try {
    const requestBytes = Number(request.headers.get("content-length"));
    if (Number.isFinite(requestBytes) && requestBytes > 30 * 1024 * 1024) {
      return Response.json({ error: "The total upload request exceeds the 30 MB limit." }, { status: 413 });
    }

    const formData = await request.formData();
    const guidelineFile = formData.get("guideline");
    const sourceFiles = formData.getAll("sources").filter((file) => file instanceof File);

    if (!(guidelineFile instanceof File) || sourceFiles.length === 0) {
      return Response.json(
        { error: "Upload a department guideline and at least one project source document." },
        { status: 400 }
      );
    }
    if (sourceFiles.length > 3) {
      return Response.json({ error: "Upload no more than 3 project source documents. The department guideline is separate." }, { status: 400 });
    }
    const totalBytes = [guidelineFile, ...sourceFiles].reduce((total, file) => total + file.size, 0);
    if (totalBytes > 25 * 1024 * 1024) {
      return Response.json({ error: "The combined document size must not exceed 25 MB." }, { status: 413 });
    }

    const guideline = await extractText(guidelineFile);
    const sources = await Promise.all(
      sourceFiles.map(async (file) => ({ name: file.name, content: await extractText(file) }))
    );
    const sourceCharacters = sources.reduce((total, source) => total + source.content.length, 0);

    if (guideline.length > MAX_GUIDELINE_CHARS || sourceCharacters > MAX_SOURCE_CHARS) {
      return Response.json(
        { error: "The extracted documents are too long. Shorten the guideline to 60,000 characters and project sources to 300,000 characters combined." },
        { status: 413 }
      );
    }

    return Response.json({
      guideline,
      guidelineName: guidelineFile.name,
      sources
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not extract text from the uploaded project documents." },
      { status: 400 }
    );
  }
}
