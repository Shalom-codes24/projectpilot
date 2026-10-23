import { sortedReferences } from "./references";
import {
  DEFAULT_FORMATTING,
  awardName,
  collectCaptions,
  formatMonthYear,
  requiredPages,
  toTitleCase
} from "./nigerian-format";

const HEADING_PATTERN = /^(?:chapter\s+\w+\b.*|\d+(?:\.\d+)+\s+\S.*|references|bibliography|appendix\b.*)$/i;

export function isHeadingLine(line) {
  const trimmed = line.trim();
  return trimmed.length > 0 && trimmed.length <= 140 && !/[.;,]$/.test(trimmed) && HEADING_PATTERN.test(trimmed);
}

export function parseBlocks(content = "") {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .flatMap((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const blocks = [];
      let paragraph = [];
      const flush = () => {
        if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
        paragraph = [];
      };
      for (const line of lines) {
        if (isHeadingLine(line)) {
          flush();
          blocks.push({ type: "heading", text: toTitleCase(line) });
        } else if (/^(?:\d+[.)]|[-•*])\s+/.test(line)) {
          flush();
          blocks.push({ type: "list", text: line });
        } else {
          paragraph.push(line);
        }
      }
      flush();
      return blocks;
    });
}

export function getFormatting(project) {
  const formatting = { ...DEFAULT_FORMATTING, ...Object.fromEntries(Object.entries(project.formatting || {}).filter(([, value]) => value)) };
  const size = parseFloat(formatting.fontSizePt);
  const spacing = parseFloat(formatting.lineSpacing);
  return {
    font: formatting.font,
    sizePt: Number.isFinite(size) && size >= 8 && size <= 18 ? size : 12,
    spacing: Number.isFinite(spacing) && spacing >= 1 && spacing <= 3 ? spacing : 1.5
  };
}

function titlePageLines(project) {
  const unit = [
    `A PROJECT SUBMITTED TO THE DEPARTMENT OF ${(project.department || "").toUpperCase()}`,
    project.faculty && `FACULTY OF ${project.faculty.toUpperCase().replace(/^FACULTY OF /, "")}`,
    (project.institution || "").toUpperCase()
  ].filter(Boolean);
  return [
    { text: (project.title || "").toUpperCase(), bold: true, size: 1.4 },
    { text: "" },
    { text: "By" },
    { text: project.studentName, bold: true },
    project.matricNumber && { text: `Matric No: ${project.matricNumber}` },
    { text: "" },
    ...unit.map((text) => ({ text })),
    { text: "" },
    { text: "IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF" },
    { text: awardName(project.degree), bold: true },
    { text: "" },
    project.supervisor && { text: `Supervisor: ${project.supervisor}` },
    project.targetDate && { text: formatMonthYear(project.targetDate) }
  ].filter((entry) => entry && entry.text !== undefined);
}

function orderedChapters(project) {
  return Object.keys(project.chapters)
    .map(Number)
    .sort((a, b) => a - b)
    .map((number) => project.chapters[number]);
}

function standardPageParagraphs(key, project) {
  const author = [project.studentName, project.matricNumber && `(${project.matricNumber})`].filter(Boolean).join(" ") || "the candidate";
  const unit = `Department of ${project.department || ""}${project.institution ? `, ${project.institution}` : ""}`;
  if (key === "declaration") {
    return [
      `I, ${author}, hereby declare that this project, titled "${project.title}", was carried out by me and has not been submitted elsewhere for the award of any degree. All sources used have been acknowledged.`,
      "Signature: ______________________          Date: ______________________"
    ];
  }
  const lines = [
    `This is to certify that this project, titled "${project.title}", was carried out by ${author} in the ${unit}${project.supervisor ? `, under the supervision of ${project.supervisor}` : ""}.`,
    "Project Supervisor: ______________________          Date: ______________________",
    "Head of Department: ______________________          Date: ______________________"
  ];
  if ((project.preliminaryPages || []).some((name) => /external/i.test(name)) || project.externalExaminer) {
    lines.push("External Examiner: ______________________          Date: ______________________");
  }
  return lines;
}

function pageBody(page, project, captions) {
  if (page.kind === "standard") return standardPageParagraphs(page.key, project);
  if (page.key === "tables") return captions.tables;
  if (page.key === "figures") return captions.figures;
  return (project.frontMatter?.[page.key] || "").trim().split(/\n{2,}/).filter(Boolean);
}

function referenceLines(project) {
  return sortedReferences(project.references || [], project.citationStyle);
}

export function manuscriptFileName(project) {
  return `${(project.shortTitle || project.title || "project").replace(/[^a-zA-Z0-9]+/g, "_")}_Manuscript`;
}

export async function buildDocxBlob(project) {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Footer, PageNumber, TableOfContents, NumberFormat } = docx;
  const { font, sizePt, spacing } = getFormatting(project);
  const halfPoints = Math.round(sizePt * 2);
  const line = Math.round(spacing * 240);
  const run = (text, options = {}) => new TextRun({ text, font, size: halfPoints, ...options });

  const centered = (text, options = {}) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240, line },
      children: [run(text, { bold: options.bold, size: Math.round(halfPoints * (options.size || 1)) })]
    });
  const pageTitle = (text, first, heading) =>
    new Paragraph({
      heading,
      alignment: AlignmentType.CENTER,
      pageBreakBefore: !first,
      spacing: { after: 240, line },
      children: [run(text.toUpperCase(), { bold: true, size: Math.round(halfPoints * 1.2) })]
    });
  const body = (text) =>
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 720 }, spacing: { after: 160, line }, children: [run(text)] });
  const plain = (text) => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 160, line }, children: [run(text)] });

  const footer = () =>
    new Footer({
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font, size: halfPoints })] })]
    });
  const pageSetup = (numbers) => ({
    page: {
      size: { width: 11906, height: 16838 },
      margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      ...(numbers ? { pageNumbers: numbers } : {})
    }
  });

  const cover = titlePageLines(project).map((entry) => centered(entry.text, entry));

  const captions = collectCaptions(project.chapters);
  const preliminary = [];
  requiredPages(project).forEach((page, index) => {
    const first = index === 0;
    if (page.key === "contents") {
      preliminary.push(pageTitle(page.label, first), new TableOfContents(page.label, { hyperlink: true, headingStyleRange: "1-2" }));
      return;
    }
    preliminary.push(pageTitle(page.label, first));
    const paragraphs = pageBody(page, project, captions);
    const isList = page.key === "tables" || page.key === "figures";
    paragraphs.forEach((text) => preliminary.push(isList || page.key === "certification" ? plain(text) : body(text)));
  });

  const main = [];
  orderedChapters(project).forEach((chapter, index) => {
    main.push(pageTitle(chapter.title || `Chapter ${index + 1}`, index === 0, HeadingLevel.HEADING_1));
    for (const block of parseBlocks(chapter.content)) {
      if (block.type === "heading") {
        main.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120, line }, children: [run(block.text, { bold: true })] }));
      } else {
        main.push(
          new Paragraph({
            alignment: block.type === "list" ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
            indent: block.type === "list" ? { left: 360 } : { firstLine: 720 },
            spacing: { after: 160, line },
            children: [run(block.text)]
          })
        );
      }
    }
  });

  const references = referenceLines(project);
  if (references.length > 0) {
    main.push(pageTitle("References", false, HeadingLevel.HEADING_1));
    references.forEach((reference) =>
      main.push(new Paragraph({ alignment: AlignmentType.LEFT, indent: { left: 720, hanging: 720 }, spacing: { after: 160, line }, children: [run(reference)] }))
    );
  }
  if (project.appendices?.trim()) {
    main.push(pageTitle("Appendices", false, HeadingLevel.HEADING_1));
    for (const block of parseBlocks(project.appendices)) {
      main.push(block.type === "heading" ? new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120, line }, children: [run(block.text, { bold: true })] }) : block.type === "list" ? plain(block.text) : body(block.text));
    }
  }

  const sections = [{ properties: pageSetup(), children: cover }];
  if (preliminary.length > 0) {
    sections.push({
      properties: pageSetup({ start: 2, formatType: NumberFormat.LOWER_ROMAN }),
      footers: { default: footer() },
      children: preliminary
    });
  }
  sections.push({
    properties: pageSetup({ start: 1, formatType: NumberFormat.DECIMAL }),
    footers: { default: footer() },
    children: main
  });

  const document = new Document({
    title: project.title,
    creator: project.studentName || "ProjectPilot",
    features: { updateFields: true },
    sections
  });
  return Packer.toBlob(document);
}

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

// The browser print dialog cannot set roman/arabic page numbering; use the DOCX export for numbered pages.
export function buildPrintableHtml(project) {
  const { font, sizePt, spacing } = getFormatting(project);
  const captions = collectCaptions(project.chapters);
  const chapters = orderedChapters(project);

  const section = (title, inner) => `<section class="chapter"><h1>${escapeHtml(title)}</h1>${inner}</section>`;
  const title = titlePageLines(project)
    .map((entry) => `<p class="center${entry.bold ? " bold" : ""}">${escapeHtml(entry.text) || "&nbsp;"}</p>`)
    .join("");

  const preliminary = requiredPages(project)
    .map((page) => {
      if (page.key === "contents") {
        const entries = chapters.map((chapter) => `<p>${escapeHtml(chapter.title)}</p>`).join("");
        const extra = [referenceLines(project).length ? "References" : "", project.appendices?.trim() ? "Appendices" : ""]
          .filter(Boolean)
          .map((name) => `<p>${name}</p>`)
          .join("");
        return section(page.label, entries + extra);
      }
      const css = page.kind === "standard" || page.key === "tables" || page.key === "figures" ? "plain" : "paragraph";
      return section(page.label, pageBody(page, project, captions).map((text) => `<p class="${css}">${escapeHtml(text)}</p>`).join(""));
    })
    .join("");

  const main = chapters
    .map((chapter) => {
      const content = parseBlocks(chapter.content)
        .map((block) => (block.type === "heading" ? `<h2>${escapeHtml(block.text)}</h2>` : `<p class="${block.type}">${escapeHtml(block.text)}</p>`))
        .join("");
      return section(chapter.title, content);
    })
    .join("");

  const references = referenceLines(project);
  const referenceSection = references.length
    ? section("References", references.map((text) => `<p class="reference">${escapeHtml(text)}</p>`).join(""))
    : "";
  const appendixSection = project.appendices?.trim()
    ? section("Appendices", parseBlocks(project.appendices).map((block) => (block.type === "heading" ? `<h2>${escapeHtml(block.text)}</h2>` : `<p class="${block.type}">${escapeHtml(block.text)}</p>`)).join(""))
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(manuscriptFileName(project))}</title><style>
@page { size: A4; margin: 1in; }
body { font-family: '${font.replace(/'/g, "")}', 'Times New Roman', serif; font-size: ${sizePt}pt; line-height: ${spacing}; color: #000; }
.center { text-align: center; } .bold { font-weight: bold; }
.title-page { page-break-after: always; padding-top: 80pt; }
.chapter { page-break-before: always; }
h1 { text-align: center; text-transform: uppercase; font-size: ${sizePt * 1.2}pt; }
h2 { font-size: ${sizePt}pt; margin: 18pt 0 6pt; }
p { margin: 0 0 8pt; } p.paragraph { text-align: justify; text-indent: 0.5in; } p.list, p.plain { margin-left: 0.25in; }
p.reference { margin-left: 0.5in; text-indent: -0.5in; }
</style></head><body><div class="title-page">${title}</div>${preliminary}${main}${referenceSection}${appendixSection}</body></html>`;
}
