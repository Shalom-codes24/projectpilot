/**
 * Utility functions for validating, cleaning, and converting diagram code.
 * Ensures Mermaid diagrams render cleanly without "No diagram type detected" errors.
 */

export function sanitizeOrConvertMermaid(rawCode) {
  if (!rawCode || typeof rawCode !== "string") return "";
  const trimmed = rawCode.trim();

  // If already a valid Mermaid diagram declaration, return as is
  if (
    /^\s*(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|mindmap|timeline)\b/i.test(
      trimmed
    )
  ) {
    return trimmed;
  }

  // Split either by newlines OR by '|' if it was rendered on a single line
  let rawLines = [];
  if (trimmed.includes("\n")) {
    rawLines = trimmed.split(/\r?\n/);
  } else {
    rawLines = trimmed.split(/\|+/);
  }

  const cleanSteps = rawLines
    .map((l) => l.trim())
    .filter((l) => l && !/^[+=\-_|]{3,}$/.test(l)) // strip dividers like +------+ or ======
    .map((l) => l.replace(/^\|/, "").replace(/\|$/, "").trim())
    .filter((l) => l && !/^[+=\-_]{3,}$/.test(l) && l.length > 1);

  if (cleanSteps.length === 0) return trimmed;

  const nodes = [];
  const edges = [];

  cleanSteps.forEach((step, idx) => {
    // If line has an arrow like "[3.2 Research Design] --> Ex-Post Facto"
    if (step.includes("-->") || step.includes("->")) {
      const parts = step.split(/\s*--?>\s*/);
      const left = parts[0].replace(/[\[\]]/g, "").trim();
      const right = parts.slice(1).join(" -> ").replace(/[\[\]]/g, "").trim();
      const nodeId = `step_${idx + 1}`;
      const label = right ? `<b>${left}</b><br/>${right}` : left;
      nodes.push(`    ${nodeId}["${label.replace(/"/g, "'")}"]`);
    } else {
      const cleanText = step.replace(/[\[\]"]/g, "").trim();
      const nodeId = `step_${idx + 1}`;
      nodes.push(`    ${nodeId}["${cleanText}"]`);
    }

    if (idx > 0) {
      edges.push(`    step_${idx} --> step_${idx + 1}`);
    }
  });

  return `flowchart TD\n${nodes.join("\n")}\n\n${edges.join("\n")}`;
}
