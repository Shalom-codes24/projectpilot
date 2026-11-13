/**
 * Academic Draft Sanitizer
 * Removes Gemini/markdown artifacts (**, ##, <br/>) and standardizes formatting
 * so drafts look like clean, professional university dissertations ready for Word.
 */

export function cleanHeadingText(text = "") {
  if (typeof text !== "string") return "";
  return text
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*+|\*\*+$/g, "")
    .replace(/^<br\s*\/?>|<br\s*\/?>$/gi, "")
    .replace(/:$/, "")
    .trim();
}

function sanitizeLatexNotation(text) {
  const superscripts = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "+": "⁺",
    "-": "⁻",
    "=": "⁼",
    "(": "⁽",
    ")": "⁾",
    n: "ⁿ",
    i: "ⁱ"
  };
  const subscripts = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
    "+": "₊",
    "-": "₋",
    "=": "₌",
    "(": "₍",
    ")": "₎",
    a: "ₐ",
    e: "ₑ",
    h: "ₕ",
    i: "ᵢ",
    j: "ⱼ",
    k: "ₖ",
    l: "ₗ",
    m: "ₘ",
    n: "ₙ",
    o: "ₒ",
    p: "ₚ",
    r: "ᵣ",
    s: "ₛ",
    t: "ₜ",
    u: "ᵤ",
    v: "ᵥ",
    x: "ₓ"
  };

  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$([^$\n]+)\$/g, "$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
    .replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\times\b/g, "×")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\div\b/g, "÷")
    .replace(/\\pm\b/g, "±")
    .replace(/\\(?:leq|le)\b/g, "≤")
    .replace(/\\(?:geq|ge)\b/g, "≥")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\neq\b/g, "≠")
    .replace(/\^\{([^{}]+)\}|\^([0-9+-]+)/g, (match, grouped, ungrouped) =>
      [...(grouped || ungrouped)].map((character) => superscripts[character] || character).join("")
    )
    .replace(/_\{([^{}]+)\}|_([a-z0-9+-]+)/gi, (match, grouped, ungrouped) =>
      [...(grouped || ungrouped)].map((character) => subscripts[character] || character).join("")
    )
    .replace(/\\(?:,|;|:|!| )/g, " ")
    .replace(/[ \t]{2,}/g, " ");
}

export function sanitizeAcademicDraft(text = "") {
  if (typeof text !== "string" || !text) return "";

  // 1. Temporarily isolate mermaid diagram blocks to preserve diagram syntax
  const mermaidBlocks = [];
  let sanitized = text.replace(/```(?:mermaid)?\s*([\s\S]*?)```/gi, (match) => {
    mermaidBlocks.push(match);
    return `__PROJECTPILOT_MERMAID_${mermaidBlocks.length - 1}__`;
  });

  // 2. Remove raw markdown code fences around standard prose (e.g. ```markdown or ```)
  sanitized = sanitized.replace(/^```(?:markdown|text)?\s*$/gim, "");

  // 3. Remove HTML breaks (<br/>, <br>, <br />) outside of mermaid diagrams
  // Double breaks -> standard paragraph break
  sanitized = sanitized.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "\n\n");
  // Single break -> newline
  sanitized = sanitized.replace(/<br\s*\/?>/gi, "\n");
  // Clean other stray HTML container tags
  sanitized = sanitized.replace(/<\/?(?:p|div|span|em|strong)[^>]*>/gi, "");
  sanitized = sanitized.replace(/&nbsp;/gi, " ");
  sanitized = sanitized.replace(/&amp;/gi, "&");

  // 4. Remove empty bold artifacts (** **, ****, __ __)
  sanitized = sanitized.replace(/\*\*\s*\*\*/g, "");
  sanitized = sanitized.replace(/__\s*__/g, "");

  sanitized = sanitizeLatexNotation(sanitized);

  // 5. Line-by-line processing
  const lines = sanitized.split(/\r?\n/);
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Preserve empty lines for paragraph separation
    if (!line) {
      processedLines.push("");
      continue;
    }

    // Preserve mermaid placeholder intact
    if (line.startsWith("__PROJECTPILOT_MERMAID_")) {
      processedLines.push(line);
      continue;
    }

    // If it's a Markdown table row, clean cells without disrupting pipe structure
    if (line.startsWith("|") && line.endsWith("|")) {
      line = line
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/\*\*\s*\*\*/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1") // Clean bold inside table cells
        .trim();
      processedLines.push(line);
      continue;
    }

    // A. Strip markdown heading hashes (##, ###, #, etc.)
    line = line.replace(/^#{1,6}\s*/, "");

    // B. Strip bold wrapping around full line (e.g. "**1.1 Background**" -> "1.1 Background")
    line = line.replace(/^\*\*(?:#{1,6}\s*)?([^*]+)\*\*$/, "$1");

    // C. Clean academic numbered headings (e.g., "1.1", "3.2.1", "Chapter Two", "Table 4.1", "Figure 3.1")
    if (
      /^(?:chapter\s+\w+|\d+(?:\.\d+)*\s+\S|table\s+\d+|figure\s+\d+|references|bibliography|appendix\b)/i.test(line)
    ) {
      // Remove any lingering asterisks and trailing colons from headings
      line = line.replace(/\*\*/g, "").replace(/\*/g, "").replace(/:$/, "").trim();
    } else {
      // D. Clean bold asterisks in regular text and bullet points:
      // e.g. "**Hypothesis One:**" -> "Hypothesis One:"
      // e.g. "- **Design:**" -> "- Design:"
      // e.g. "**statistically significant**" -> "statistically significant"
      // Remove empty bold signs first
      line = line.replace(/\*\*\s*\*\*/g, "");
      // Convert "**text**" to "text" so no raw asterisks show up in Word/draft
      line = line.replace(/\*\*([^*]+)\*\*/g, "$1");
      // Clean any dangling/unmatched double asterisks
      line = line.replace(/\*\*/g, "");
    }

    // Clean stray backticks from inline text (e.g. `variable` -> variable)
    line = line.replace(/`([^`]+)`/g, "$1");

    processedLines.push(line);
  }

  sanitized = processedLines.join("\n");

  // 6. Restore mermaid blocks
  sanitized = sanitized.replace(/__PROJECTPILOT_MERMAID_(\d+)__/g, (match, index) => {
    return mermaidBlocks[Number(index)] || "";
  });

  // 7. Normalize consecutive blank lines to standard paragraph breaks (max 2 newlines)
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n").trim();

  return sanitized;
}
