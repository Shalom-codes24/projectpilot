/**
 * Academic Diagram Utilities
 * Sanitizes Mermaid code, fixes node syntax errors, and provides guaranteed
 * standard university flowchart templates for dissertations.
 */

export function getDefaultChapterFlowchart(chapterNumber = 1, project = {}) {
  const chNum = Number(chapterNumber) || 1;
  const projectTitle = project.shortTitle || project.title || "Dissertation Study";
  const dept = project.department || "Academic Department";

  if (chNum === 1) {
    return `flowchart TD
    IV["Independent Variables<br/>(Core Conceptual Factors & Metrics)"]
    MOD["Moderating Context<br/>(Institutional Environment & Departmental Setting)"]
    PROC["Operational Mechanisms<br/>(Interventions & Empirical Implementations)"]
    DV["Dependent Variables<br/>(Target Outcomes, Efficacy & Performance Benchmarks)"]

    IV --> MOD
    MOD --> PROC
    PROC --> DV`;
  }

  if (chNum === 2) {
    return `flowchart TD
    TH["Theoretical Framework<br/>(Underlying Classical & Contemporary Theories)"]
    CONC["Conceptual Structure<br/>(Thematic Classifications & Construct Definitions)"]
    EMP["Empirical Literature Review<br/>(Nigerian & Global Contextual Studies)"]
    GAP["Identified Research Gap<br/>(Methodological, Geographical & Scope Omissions)"]
    SYNTH["Conceptual Synthesis<br/>(Proposed Research Direction & Hypotheses)"]

    TH --> CONC
    CONC --> EMP
    EMP --> GAP
    GAP --> SYNTH`;
  }

  if (chNum === 3) {
    return `flowchart TD
    DES["3.1 Research Design<br/>(Ex-Post Facto & Descriptive Survey Design)"]
    POP["3.2 Study Population<br/>(Defined Target Population across Study Locations)"]
    SAMP["3.3 Sample & Sampling Technique<br/>(Taro Yamane Formula & Stratified Multi-Stage Sampling)"]
    INST["3.4 Instrumentation<br/>(Structured Research Instrument & Data Collection Scales)"]
    VAL["3.5 Validity & Reliability<br/>(Expert Face/Content Validation & Cronbach's Alpha Test)"]
    PROC["3.6 Administration Procedure<br/>(Direct Field Administration & Data Gathering)"]
    ANAL["3.7 Data Analysis Procedure<br/>(Descriptive Mean/SD & Inferential Hypotheses Testing)"]

    DES --> POP
    POP --> SAMP
    SAMP --> INST
    INST --> VAL
    VAL --> PROC
    PROC --> ANAL`;
  }

  if (chNum === 4) {
    return `flowchart TD
    RAW["Empirical Data Ingestion<br/>(Field Survey Responses & Instrument Screening)"]
    DEMO["Demographic Distribution<br/>(Frequency Counts & Percentage Analysis)"]
    RQ["Research Questions Evaluation<br/>(Mean Scores, Standard Deviation & Decision Benchmarks)"]
    HYP["Hypotheses Testing<br/>(Inferential Test Statistics & Significance p-values)"]
    DISC["Discussion of Findings<br/>(Triangulation with Prior Empirical Studies)"]

    RAW --> DEMO
    DEMO --> RQ
    RQ --> HYP
    HYP --> DISC`;
  }

  // Chapter 5 & default
  return `flowchart TD
    SUM["Summary of Empirical Findings<br/>(Consolidation of Chapter 4 Outcomes)"]
    CONC["Scholarly Conclusions<br/>(Theoretical & Methodological Takeaways)"]
    REC["Strategic Recommendations<br/>(Policy Frameworks & Institutional Guidance)"]
    ROAD["Implementation Roadmap<br/>(Actionable Steps & Operational Milestones)"]
    FUT["Suggestions for Further Research<br/>(Unexplored Dimensions & Longitudinal Horizons)"]

    SUM --> CONC
    CONC --> REC
    REC --> ROAD
    ROAD --> FUT`;
}

/**
 * Sanitizes any raw diagram string:
 * - Converts ASCII boxes (+----+ | Step |) to flowchart TD
 * - Fixes unquoted node brackets with parentheses A[Title (extra)] -> A["Title (extra)"]
 * - Fixes raw bracket identifiers [3.2 Step] -> step_n["3.2 Step"]
 * - Guarantees valid Mermaid syntax
 */
export function sanitizeOrConvertMermaid(rawCode) {
  if (!rawCode || typeof rawCode !== "string") return "";
  let trimmed = rawCode.trim();

  // Strip wrapping markdown code fences if present
  trimmed = trimmed.replace(/^```(?:mermaid)?/i, "").replace(/```$/, "").trim();

  // Check if it's an ASCII box art diagram (contains +---+ or lots of |)
  const isAsciiBox = /^[+\-_=]{3,}/m.test(trimmed) || (trimmed.includes("+--") && trimmed.includes("|"));

  if (!isAsciiBox && /^\s*(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|mindmap|timeline)\b/i.test(trimmed)) {
    // Already has a Mermaid header: sanitize node definitions within it
    const lines = trimmed.split(/\r?\n/);
    const sanitizedLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Keep header line as is
      if (i === 0 && /^\s*(?:flowchart|graph|sequenceDiagram|classDiagram)\b/i.test(line)) {
        sanitizedLines.push(line);
        continue;
      }

      // Fix lines with brackets as node identifiers: e.g. "[3.2 Design] --> [3.3 Population]" or "[3.2 Design] --> Outcome"
      if (/^\s*\[([^\]]+)\]\s*--?>/.test(line)) {
        line = line.replace(/^\s*\[([^\]]+)\]\s*--?>\s*(?:\[([^\]]+)\]|(.+))$/, (m, left, rightInBrackets, rightPlain) => {
          const right = (rightInBrackets || rightPlain || "").trim();
          return `    node_${i}_a["${left.replace(/"/g, "'")}"] --> node_${i}_b["${right.replace(/"/g, "'")}"]`;
        });
      }

      // Fix unquoted node labels: e.g. "A[1.1 Background (Context)]" -> 'A["1.1 Background (Context)"]'
      line = line.replace(/([a-zA-Z0-9_]+)\[([^"\]]+)\]/g, (m, id, label) => {
        return `${id}["${label.replace(/"/g, "'")}"]`;
      });

      // Fix unquoted rounded node labels: e.g. "A(1.1 Background)" -> 'A("1.1 Background")'
      line = line.replace(/([a-zA-Z0-9_]+)\(([^"\)]+)\)/g, (m, id, label) => {
        return `${id}("${label.replace(/"/g, "'")}")`;
      });

      sanitizedLines.push(line);
    }

    return sanitizedLines.join("\n");
  }

  // Split ASCII lines either by newlines OR by '|' if it was rendered on a single line
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

  if (cleanSteps.length === 0) {
    return getDefaultChapterFlowchart(3);
  }

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

/**
 * Extracts Mermaid diagram code and caption from a markdown string.
 */
export function extractDiagramFromContent(content = "") {
  if (typeof content !== "string" || !content) return null;

  const match = content.match(/(?:(figure\s+\d+[^:\n]*[:.\-–][^\n]*)\n\s*)?```(?:mermaid)?\s*([\s\S]*?)```/i);
  if (match) {
    return {
      caption: (match[1] || "").trim(),
      code: sanitizeOrConvertMermaid(match[2].trim())
    };
  }

  return null;
}
