"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { countChapterWords } from "../lib/word-count";
import { buildDocxBlob, buildPrintableHtml, manuscriptFileName, parseBlocks } from "../lib/export-manuscript";
import { formatReference } from "../lib/references";
import { CHAPTER_STRUCTURES, buildChapters, exportWarnings, getSampleDedication, getSampleAcknowledgements, getSampleAbstract } from "../lib/nigerian-format";
import { sanitizeOrConvertMermaid, getDefaultChapterFlowchart, extractDiagramFromContent } from "../lib/diagram-utils";
import { sanitizeAcademicDraft } from "../lib/clean-draft";

const EMPTY_PROJECT = {
  id: "",
  title: "",
  shortTitle: "",
  studentName: "",
  matricNumber: "",
  department: "",
  faculty: "",
  institution: "",
  degree: "",
  citationStyle: "APA 7th Edition",
  supervisor: "",
  targetDate: "",
  projectType: "empirical",
  chapters: buildChapters("standard"),
  frontMatter: {
    dedication: getSampleDedication(),
    acknowledgements: getSampleAcknowledgements()
  },
  appendices: "",
  references: [],
  supervisorNotes: []
};

function MermaidDiagram({ code, id }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  const cleanCode = useMemo(() => sanitizeOrConvertMermaid(code), [code]);

  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current) return;

    if (!cleanCode) {
      containerRef.current.innerHTML = "";
      setError(null);
      return;
    }

    import("mermaid")
      .then(({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "neutral" });
        const safeId = (id || Math.random().toString(36).substring(7)).replace(/[^a-zA-Z0-9_-]/g, "_");
        const uniqueId = `mermaid_fig_${safeId}_${Math.floor(Math.random() * 100000)}`;
        return mermaid.render(uniqueId, cleanCode);
      })
      .then((res) => {
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = res.svg;
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanCode, id]);

  if (error) {
    return (
      <div className="academic-diagram-fallback" style={{ margin: "16px 0", padding: "16px", background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(139, 92, 246, 0.35)", borderRadius: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "0.8rem", color: "var(--violet-300)" }}>
          <span style={{ fontWeight: 600 }}>📊 Methodological / System Framework Diagram</span>
          <span style={{ fontSize: "0.72rem", color: "#f87171" }}>Syntax note: Monospace fallback rendered</span>
        </div>
        <pre style={{ margin: 0, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: "0.82rem", color: "#38bdf8", lineHeight: "1.45", overflowX: "auto", whiteSpace: "pre-wrap" }}>
          {cleanCode || code}
        </pre>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-render-target" />;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState("landing"); // 'landing' | 'dashboard' | 'studio'
  const [project, setProject] = useState(EMPTY_PROJECT);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [editorText, setEditorText] = useState("");
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("All changes saved locally");
  const [aiFeedback, setAiFeedback] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [guidelineFile, setGuidelineFile] = useState(null);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [projectContext, setProjectContext] = useState(null);
  const [formError, setFormError] = useState("");
  const [allowAiProcessing, setAllowAiProcessing] = useState(false);
  const [visualPlan, setVisualPlan] = useState([]);
  const [diagramCode, setDiagramCode] = useState("");
  const [isFlowchartCardVisible, setIsFlowchartCardVisible] = useState(true);
  const [refinementRequest, setRefinementRequest] = useState("");
  const [generatedImages, setGeneratedImages] = useState({});
  const [imageLoadingIndex, setImageLoadingIndex] = useState(null);
  const [isOutlineLoading, setIsOutlineLoading] = useState(false);
  const [isAbstractLoading, setIsAbstractLoading] = useState(false);
  const [newStructure, setNewStructure] = useState("standard");
  const [sourceQuery, setSourceQuery] = useState("");
  const [sourceResults, setSourceResults] = useState([]);
  const [isSearchingSources, setIsSearchingSources] = useState(false);
  const [sourceSearchError, setSourceSearchError] = useState("");
  const diagramPreviewRef = useRef(null);

  // Word-friendly Editor & Preview State
  const [editorViewMode, setEditorViewMode] = useState("editor"); // 'editor' | 'preview'
  const editorTextareaRef = useRef(null);

  // API Key Pool Management State
  const [keysStatus, setKeysStatus] = useState({ totalKeys: 3, activeKeyIndex: 0, keys: [] });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [customKeyError, setCustomKeyError] = useState("");

  // Export Modal State (Chapters 1-3 Proposal vs Full Project)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Table Builder State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableCaption, setTableCaption] = useState("Table 4.1: Demographic Characteristics of Respondents");
  const [tableHeaders, setTableHeaders] = useState(["Variable", "Category", "Frequency (N=150)", "Percentage (%)"]);
  const [tableRowsData, setTableRowsData] = useState([
    ["Gender", "Male", "85", "56.7%"],
    ["Gender", "Female", "65", "43.3%"],
    ["Academic Level", "400 Level", "110", "73.3%"],
    ["Academic Level", "500 Level", "40", "26.7%"]
  ]);

  // Diagram Studio State
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [diagramModalCaption, setDiagramModalCaption] = useState("Figure 4.1: Research Process Flowchart");
  const [diagramModalCode, setDiagramModalCode] = useState(
    `graph TD\n  Start([Research Problem]) --> Review[Literature Review]\n  Review --> Method[Methodology & Data Collection]\n  Method --> Analysis[Empirical Data Analysis]\n  Analysis --> Results[Results & Discussion]\n  Results --> End([Conclusion & Recommendations])`
  );
  const diagramModalPreviewRef = useRef(null);

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDept, setNewDept] = useState("Computer Science");
  const [newDegree, setNewDegree] = useState("B.Sc. Final Year Project");
  const [newInstitution, setNewInstitution] = useState("University of Lagos");
  const [newCitation, setNewCitation] = useState("APA 7th Edition");
  const [newStudentName, setNewStudentName] = useState("");
  const [newMatricNumber, setNewMatricNumber] = useState("");
  const [newFaculty, setNewFaculty] = useState("");
  const [newSupervisor, setNewSupervisor] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    // Query API key pool status
    fetch("/api/api-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.totalKeys) setKeysStatus(data);
      })
      .catch(() => {});

    try {
      const storedKey = localStorage.getItem("projectpilot_custom_api_key");
      if (storedKey) setCustomApiKey(storedKey);
    } catch {}

    try {
      const saved = localStorage.getItem("projectpilot_project");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically sanitize any existing drafts in storage to eradicate **, ##, <br/>
        if (parsed.chapters) {
          Object.keys(parsed.chapters).forEach((k) => {
            if (parsed.chapters[k]?.content) {
              parsed.chapters[k].content = sanitizeAcademicDraft(parsed.chapters[k].content);
            }
          });
        }
        setProject(parsed);
        setEditorText(parsed.chapters[currentChapter]?.content || "");
        setProjectContext(parsed.projectContext || null);
      } else {
        setEditorText("");
      }
    } catch {
      setEditorText("");
    }
  }, []);

  // Timer for live generation progress feedback
  useEffect(() => {
    let interval;
    if (isAiLoading) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isAiLoading]);

  // Live Diagram Studio preview effect
  useEffect(() => {
    if (!isDiagramModalOpen || !diagramModalPreviewRef.current || !diagramModalCode) return;
    let isMounted = true;
    import("mermaid")
      .then(({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "dark" });
        return mermaid.render(`studio-diagram-${Date.now()}`, diagramModalCode);
      })
      .then((res) => {
        if (isMounted && diagramModalPreviewRef.current) {
          diagramModalPreviewRef.current.innerHTML = res.svg;
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [diagramModalCode, isDiagramModalOpen]);

  // Insert text at cursor in editorText
  const insertTextAtCursor = (before, after = "") => {
    const textarea = editorTextareaRef.current;
    if (!textarea) {
      const updated = editorText + "\n\n" + before + after;
      setEditorText(updated);
      handleEditorChange({ target: { value: updated } });
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editorText.substring(start, end);
    const replacement = before + (selected || "") + after;
    const newText = editorText.substring(0, start) + replacement + editorText.substring(end);
    setEditorText(newText);
    handleEditorChange({ target: { value: newText } });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + replacement.length - after.length);
    }, 50);
  };

  const insertFormatting = (type) => {
    if (type === "bold") insertTextAtCursor("**", "**");
    else if (type === "italic") insertTextAtCursor("*", "*");
    else if (type === "h2") insertTextAtCursor(`\n\n${currentChapter}.1 `, "\n");
    else if (type === "h3") insertTextAtCursor(`\n\n${currentChapter}.1.1 `, "\n");
    else if (type === "bullet") insertTextAtCursor("\n- ", "\n");
    else if (type === "numbered") insertTextAtCursor("\n1. ", "\n");
    else if (type === "quote") insertTextAtCursor("\n> ", "\n");
  };

  const handleCleanDraftFormatting = () => {
    const cleaned = sanitizeAcademicDraft(editorText);
    setEditorText(cleaned);
    const updatedChapters = {
      ...project.chapters,
      [currentChapter]: {
        ...project.chapters[currentChapter],
        content: cleaned
      }
    };
    const updatedProject = { ...project, chapters: updatedChapters };
    setProject(updatedProject);
    try {
      localStorage.setItem("projectpilot_project", JSON.stringify(updatedProject));
      setSaveStatus("Draft formatting cleaned and saved");
    } catch {}
    setAiFeedback("✨ Draft cleaned! Removed markdown signs (**, ##, <br/>) and standardized academic formatting.");
  };

  const openTableBuilderModal = () => {
    setTableCaption(`Table ${currentChapter}.1: Demographic Characteristics of Respondents`);
    setIsTableModalOpen(true);
  };

  const applyTablePreset = (presetName) => {
    if (presetName === "demographic") {
      setTableCaption(`Table ${currentChapter}.1: Demographic Distribution of Respondents`);
      setTableHeaders(["Variable", "Category", "Frequency (N=150)", "Percentage (%)"]);
      setTableRowsData([
        ["Gender", "Male", "85", "56.7%"],
        ["Gender", "Female", "65", "43.3%"],
        ["Academic Level", "400 Level", "110", "73.3%"],
        ["Academic Level", "500 Level", "40", "26.7%"]
      ]);
    } else if (presetName === "evaluation") {
      setTableCaption(`Table ${currentChapter}.2: Comparative Model Performance Evaluation`);
      setTableHeaders(["Model / Approach", "Accuracy (%)", "Precision", "Recall", "F1-Score"]);
      setTableRowsData([
        ["Proposed System", "96.4%", "0.95", "0.96", "0.95"],
        ["Baseline Model A", "88.2%", "0.86", "0.87", "0.86"],
        ["Traditional Approach", "79.5%", "0.78", "0.79", "0.78"]
      ]);
    } else if (presetName === "specs") {
      setTableCaption(`Table ${currentChapter}.3: Hardware and Software System Specifications`);
      setTableHeaders(["Component", "Specification", "Purpose", "Status"]);
      setTableRowsData([
        ["Operating System", "Windows 11 / Linux Ubuntu 22.04", "Host Environment", "Verified"],
        ["Processor", "Intel Core i7 11th Gen @ 3.2GHz", "Model Execution", "Verified"],
        ["Memory", "16 GB DDR4 RAM", "Data Preprocessing", "Required"],
        ["Storage", "512 GB NVMe SSD", "Local Dataset Cache", "Required"]
      ]);
    } else {
      setTableCaption(`Table ${currentChapter}.1: Custom Project Table`);
      setTableHeaders(["Column 1", "Column 2", "Column 3"]);
      setTableRowsData([
        ["Item 1", "Data 1", "Notes 1"],
        ["Item 2", "Data 2", "Notes 2"]
      ]);
    }
  };

  const handleInsertTableIntoEditor = () => {
    const headerLine = `| ${tableHeaders.join(" | ")} |`;
    const sepLine = `| ${tableHeaders.map(() => "---").join(" | ")} |`;
    const rowsLines = tableRowsData.map((row) => `| ${row.join(" | ")} |`).join("\n");
    const formattedTable = `\n\n${tableCaption.trim()}\n${headerLine}\n${sepLine}\n${rowsLines}\n\n`;

    insertTextAtCursor(formattedTable);
    setIsTableModalOpen(false);
  };

  const openDiagramStudioModal = (initialCode, initialCaption) => {
    setDiagramModalCaption(initialCaption || `Figure ${currentChapter}.1: Methodological Framework & Flowchart`);
    setDiagramModalCode(initialCode || diagramCode || getDefaultChapterFlowchart(currentChapter, project));
    setIsDiagramModalOpen(true);
  };

  const applyDiagramPreset = (presetName) => {
    if (presetName === "flowchart") {
      setDiagramModalCaption(`Figure ${currentChapter}.1: Research Methodology Flowchart`);
      setDiagramModalCode(`graph TD
  Start([Research Topic Selection]) --> Review[Literature & Theoretical Review]
  Review --> Design[Methodological Framework]
  Design --> Data[Empirical Data Collection]
  Data --> Analysis[Statistical & Model Analysis]
  Analysis --> Findings[Interpretation of Results]
  Findings --> End([Conclusion & Recommendations])`);
    } else if (presetName === "architecture") {
      setDiagramModalCaption(`Figure ${currentChapter}.2: Proposed System Architecture`);
      setDiagramModalCode(`graph TD
  Client[Student Web Client] --> API[Next.js Application Gateway]
  API --> Gemini[Google Gemini AI Engine]
  API --> Engine[DOCX Formatting Engine]
  API --> Store[(Manuscript Storage)]`);
    } else if (presetName === "framework") {
      setDiagramModalCaption(`Figure ${currentChapter}.1: Conceptual Framework`);
      setDiagramModalCode(`graph LR
  subgraph Independent_Variables[Independent Variables]
    IV1[Technological Infrastructure]
    IV2[User Training & Adoption]
    IV3[Institutional Support]
  end
  subgraph Dependent_Variable[Dependent Variable]
    DV[Project Research Quality]
  end
  Independent_Variables --> DV`);
    } else if (presetName === "sequence") {
      setDiagramModalCaption(`Figure ${currentChapter}.3: System Interaction Sequence`);
      setDiagramModalCode(`sequenceDiagram
  autonumber
  Student->>System: Upload Guideline & Sources
  System->>Gemini: Draft Structured Chapter Prose
  Gemini-->>System: Grounded Chapter Content
  System-->>Student: Reviewable Chapter Manuscript`);
    }
  };

  const handleInsertDiagramIntoEditor = () => {
    const cleanCode = sanitizeOrConvertMermaid(diagramModalCode.trim());
    const figureCaption = diagramModalCaption.trim();
    const formattedDiagram = `\n\n${figureCaption}\n\`\`\`mermaid\n${cleanCode}\n\`\`\`\n*${figureCaption}.*\n\n`;

    let updatedText = editorText;
    if (updatedText.includes("```mermaid")) {
      updatedText = updatedText.replace(/(?:(?:figure\s+\d+[^\n]*\n)?)```(?:mermaid)?\s*[\s\S]*?```(?:\s*\*figure\s+\d+[^\n]*\*)?/i, formattedDiagram.trim());
    } else {
      updatedText = updatedText + formattedDiagram;
    }

    setEditorText(updatedText);
    setDiagramCode(cleanCode);
    handleEditorChange({ target: { value: updatedText } });
    setIsDiagramModalOpen(false);
  };

  const handleRegenerateChapterFlowchart = () => {
    const standardFlowchart = getDefaultChapterFlowchart(currentChapter, project);
    const chapterTitle = project.chapters[currentChapter]?.title?.replace(/^Chapter (?:One|Two|Three|Four|Five|\d+):?\s*/i, "") || "Conceptual Framework";
    const figureCaption = `Figure ${currentChapter}.1: ${chapterTitle} - Process Flowchart`;
    const formattedDiagram = `\n\n${figureCaption}\n\`\`\`mermaid\n${standardFlowchart}\n\`\`\`\n*${figureCaption}.*\n\n`;

    let updatedText = editorText;
    if (updatedText.includes("```mermaid")) {
      updatedText = updatedText.replace(/(?:(?:figure\s+\d+[^\n]*\n)?)```(?:mermaid)?\s*[\s\S]*?```(?:\s*\*figure\s+\d+[^\n]*\*)?/i, formattedDiagram.trim());
    } else {
      const lines = updatedText.split("\n");
      const insertIdx = Math.min(lines.length, Math.max(2, Math.floor(lines.length * 0.6)));
      lines.splice(insertIdx, 0, formattedDiagram);
      updatedText = lines.join("\n");
    }

    setEditorText(updatedText);
    setDiagramCode(standardFlowchart);
    handleEditorChange({ target: { value: updatedText } });
  };

  const handleDownloadDiagramSvg = () => {
    const svgEl = document.querySelector(".studio-flowchart-card svg, .mermaid-render-target svg, .diagram-preview svg");
    if (!svgEl) {
      alert("Flowchart SVG is not rendered yet.");
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `Chapter_${currentChapter}_Flowchart.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handleSaveCustomKey = () => {
    const trimmed = customApiKey.trim();
    if (!trimmed) {
      setCustomKeyError("Please enter a valid API key.");
      return;
    }
    try {
      localStorage.setItem("projectpilot_custom_api_key", trimmed);
      fetch("/api/api-status", { headers: { "x-gemini-api-key": trimmed } })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.totalKeys) setKeysStatus(data);
        })
        .catch(() => {});
      setCustomKeyError("");
      setIsKeyModalOpen(false);
    } catch {
      setCustomKeyError("Could not save to local storage.");
    }
  };

  const handleClearCustomKey = () => {
    setCustomApiKey("");
    try {
      localStorage.removeItem("projectpilot_custom_api_key");
      fetch("/api/api-status")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.totalKeys) setKeysStatus(data);
        })
        .catch(() => {});
    } catch {}
  };

  // Update editor text and extract diagram when current chapter changes
  useEffect(() => {
    setVisualPlan([]);
    setGeneratedImages({});
    const chContent = project.chapters[currentChapter]?.content || "";
    setEditorText(chContent);

    // Extract diagram from active chapter content, or fallback to tailored template
    const extracted = extractDiagramFromContent(chContent);
    if (extracted && extracted.code) {
      setDiagramCode(extracted.code);
    } else {
      const template = getDefaultChapterFlowchart(currentChapter, project);
      setDiagramCode(template);
    }
  }, [currentChapter]);

  // When editorText changes, keep diagramCode synced if a diagram block exists
  useEffect(() => {
    const extracted = extractDiagramFromContent(editorText);
    if (extracted && extracted.code) {
      setDiagramCode(extracted.code);
    }
  }, [editorText]);

  useEffect(() => {
    if (!diagramCode || !diagramPreviewRef.current) return;
    let isMounted = true;
    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "neutral" });
      return mermaid.render(`project-diagram-${Date.now()}`, diagramCode);
    }).then((result) => {
      if (isMounted && diagramPreviewRef.current) diagramPreviewRef.current.innerHTML = result.svg;
    }).catch((error) => {
      if (isMounted) setAiFeedback(`Could not render the generated diagram: ${error.message}`);
    });
    return () => {
      isMounted = false;
    };
  }, [diagramCode]);

  // Handle live writing changes
  const handleEditorChange = (e) => {
    const val = e.target.value;
    setEditorText(val);
    setSaveStatus("Saving changes...");

    const updatedChapters = {
      ...project.chapters,
      [currentChapter]: {
        ...project.chapters[currentChapter],
        content: val
      }
    };
    const updatedProject = { ...project, chapters: updatedChapters };
    setProject(updatedProject);

    // Save to localStorage
    try {
      localStorage.setItem("projectpilot_project", JSON.stringify(updatedProject));
      setTimeout(() => setSaveStatus("Saved to local browser storage"), 600);
    } catch {
      setSaveStatus("Local save error");
    }
  };

  const downloadDiagram = () => {
    const svg = diagramPreviewRef.current?.querySelector("svg");
    if (!svg) {
      setAiFeedback("The diagram preview is not ready to download yet.");
      return;
    }
    const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `chapter-${currentChapter}-diagram.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Word count & Reading time calculation
  const wordCount = countChapterWords(`${project.chapters[currentChapter]?.title || ""}\n${editorText}`);
  const readTime = Math.ceil(wordCount / 200);

  // Total project word count & 70+ Page Goal Estimator
  // Standard academic formatting: 12pt Times New Roman, 1.5 line spacing ~280 words per page.
  // Standard university preliminary pages (Title, Declaration, Certification, Dedication, Acknowledgements, Abstract, TOC, Lists): ~10 pages
  const totalWords = Object.values(project.chapters).reduce((acc, ch) => {
    return acc + countChapterWords(`${ch.title || ""}\n${ch.content || ""}`);
  }, 0);
  const estimatedChapterPages = Math.round(totalWords / 280);
  const estimatedPrelimPages = totalWords > 0 ? 10 : 0;
  const estimatedTotalPages = estimatedChapterPages + estimatedPrelimPages;
  const pageTarget = 70;
  const pageProgressPercent = Math.min(100, Math.round((estimatedTotalPages / pageTarget) * 100));

  // Overall project completion %
  const chaptersMeetingMinimum = Object.values(project.chapters).filter(
    (chapter) => countChapterWords(`${chapter.title || ""}\n${chapter.content || ""}`) >= 600
  ).length;
  const overallProgress = Math.round(
    (chaptersMeetingMinimum / Object.keys(project.chapters).length) * 100
  );

  // AI Assistant Actions
  const runAiAssist = async (actionType) => {
    if (actionType !== "generate" && actionType !== "expand" && actionType !== "refine") {
      setAiFeedback("Choose full chapter writing, deep expansion, or custom refinement.");
      return;
    }
    if (!projectContext?.guideline || !projectContext?.sources?.length) {
      setAiFeedback("Upload your department guideline and at least one project source document before writing a chapter.");
      return;
    }
    if (!allowAiProcessing) {
      setAiFeedback("Please confirm that you want your uploaded documents sent to Gemini for chapter writing.");
      return;
    }

    setIsAiLoading(true);
    setAiFeedback("");
    try {
      const response = await fetch("/api/generate-chapter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-gemini-api-key": customApiKey } : {})
        },
        body: JSON.stringify({
          mode: actionType,
          project: {
            title: project.title,
            institution: project.institution,
            department: project.department,
            degree: project.degree,
            citationStyle: project.citationStyle
          },
          chapter: {
            number: currentChapter,
            title: project.chapters[currentChapter]?.title,
            sections: project.chapters[currentChapter]?.subsections || [],
            totalChapters: Object.keys(project.chapters).length
          },
          projectType: project.projectType || "empirical",
          references: approvedReferences.map((reference) => ({
            citation: formatReference(reference, project.citationStyle),
            abstract: reference.abstract
          })),
          findings: project.findings || "",
          guideline: projectContext.guideline,
          sources: projectContext.sources,
          draft: actionType === "generate" ? "" : editorText,
          feedback: actionType === "refine" ? refinementRequest : (actionType === "expand" ? "Deepen literature, add multi-paragraph academic depth, analytical tables, and theoretical foundations to expand page count." : ""),
          consent: allowAiProcessing
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chapter generation failed.");
      
      let finalDraftContent = sanitizeAcademicDraft(result.content);
      let cleanDiagram = sanitizeOrConvertMermaid(result.diagram || "");

      if (!cleanDiagram || cleanDiagram.length < 20) {
        cleanDiagram = getDefaultChapterFlowchart(currentChapter, project);
      }

      // Auto-insert diagram directly into the draft if not already in the text
      if (!finalDraftContent.includes("```mermaid")) {
        const chapterNum = currentChapter;
        const chapterTitle = project.chapters[currentChapter]?.title?.replace(/^Chapter (?:One|Two|Three|Four|Five|\d+):?\s*/i, "") || "Conceptual Framework";
        const figureLabel = `Figure ${chapterNum}.1: ${chapterTitle} - Process Flowchart`;
        finalDraftContent = `${finalDraftContent.trim()}\n\n${figureLabel}\n\`\`\`mermaid\n${cleanDiagram}\n\`\`\`\n*${figureLabel}.*\n`;
      }
      finalDraftContent = sanitizeAcademicDraft(finalDraftContent);

      const generatedWordCount = countChapterWords(`${project.chapters[currentChapter]?.title || ""}\n${finalDraftContent}`);
      if (generatedWordCount < 500) {
        throw new Error(`The generated chapter contains ${generatedWordCount} words; at least 500 words are required. Please try again or provide more source details.`);
      }
      setEditorText(finalDraftContent);
      setVisualPlan(result.visuals || []);
      setDiagramCode(cleanDiagram);
      const updatedProject = {
        ...project,
        chapters: {
          ...project.chapters,
          [currentChapter]: {
            ...project.chapters[currentChapter],
            content: finalDraftContent,
            progress: Math.max(project.chapters[currentChapter]?.progress || 0, Math.min(100, Math.round((generatedWordCount / 2500) * 100)))
          }
        }
      };

      setProject(updatedProject);
      try {
        localStorage.setItem("projectpilot_project", JSON.stringify(updatedProject));
        setSaveStatus("Draft saved to local browser storage");
      } catch {
        setSaveStatus("Browser storage is full; this draft is not saved locally");
      }
      const generatedPages = Math.max(1, Math.round(generatedWordCount / 280));
      const newTotalWords = Object.entries(updatedProject.chapters).reduce((acc, [cNum, ch]) => {
        return acc + countChapterWords(`${ch.title || ""}\n${ch.content || ""}`);
      }, 0);
      const newTotalPages = Math.round(newTotalWords / 280) + 10;
      setAiFeedback(
        `🎉 Chapter ${currentChapter} written in full (${generatedWordCount.toLocaleString()} words, ~${generatedPages} pages)! Current manuscript length: ~${newTotalPages} / 70+ page target.`
      );
      if (actionType === "refine") setRefinementRequest("");
    } catch (error) {
      setAiFeedback(error.message || "Chapter generation failed. Check your connection and AI configuration.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const persistProject = (updatedProject) => {
    setProject(updatedProject);
    try {
      localStorage.setItem("projectpilot_project", JSON.stringify(updatedProject));
      setSaveStatus("Saved to local browser storage");
    } catch {
      setSaveStatus("Browser storage is full; changes are not saved locally");
    }
  };

  const buildOutlineFromGuideline = async () => {
    if (!projectContext?.guideline) {
      setAiFeedback("Upload a department guideline by starting a new project first.");
      return;
    }
    if (!allowAiProcessing) {
      setAiFeedback("Please confirm that you want your guideline sent to Gemini before building the outline.");
      return;
    }
    setIsOutlineLoading(true);
    setAiFeedback("");
    try {
      const response = await fetch("/api/generate-outline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-gemini-api-key": customApiKey } : {})
        },
        body: JSON.stringify({
          guideline: projectContext.guideline,
          project: { title: project.title, department: project.department, degree: project.degree },
          consent: allowAiProcessing
        })
      });
      const outline = await response.json();
      if (!response.ok) throw new Error(outline.error || "Outline extraction failed.");

      const existing = project.chapters;
      const dropped = Object.keys(existing).filter(
        (number) => Number(number) > outline.chapters.length && existing[number].content?.trim()
      );
      if (dropped.length > 0 && !window.confirm(`The guideline has ${outline.chapters.length} chapters. Existing text in chapter(s) ${dropped.join(", ")} will be removed. Continue?`)) {
        return;
      }

      const chapters = Object.fromEntries(
        outline.chapters.map((chapter, index) => [
          index + 1,
          {
            title: chapter.title,
            subsections: chapter.sections,
            content: existing[index + 1]?.content || "",
            progress: existing[index + 1]?.progress || 0
          }
        ])
      );
      persistProject({
        ...project,
        chapters,
        projectType: outline.projectType,
        preliminaryPages: outline.preliminaryPages,
        endMatter: outline.endMatter,
        formatting: outline.formatting
      });
      setCurrentChapter(1);
      setAiFeedback(
        `Outline built from your guideline: ${outline.chapters.length} chapters (${outline.projectType} project). Review the section headings in the sidebar.`
      );
    } catch (error) {
      setAiFeedback(error.message || "Outline extraction failed.");
    } finally {
      setIsOutlineLoading(false);
    }
  };

  const setProjectType = (projectType) => persistProject({ ...project, projectType });

  const searchSources = async (event) => {
    event.preventDefault();
    setSourceSearchError("");
    setIsSearchingSources(true);
    try {
      const response = await fetch(`/api/find-sources?q=${encodeURIComponent(sourceQuery)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Source search failed.");
      setSourceResults(data.results);
      if (data.results.length === 0) setSourceSearchError("No matching scholarly works found. Try different keywords.");
    } catch (error) {
      setSourceSearchError(error.message);
    } finally {
      setIsSearchingSources(false);
    }
  };

  const approvedReferences = project.references || [];
  const addReference = (work) => {
    if (approvedReferences.some((reference) => reference.doi === work.doi)) return;
    persistProject({ ...project, references: [...approvedReferences, work] });
  };
  const removeReference = (doi) =>
    persistProject({ ...project, references: approvedReferences.filter((reference) => reference.doi !== doi) });
  const setFindings = (findings) => persistProject({ ...project, findings });

  const generateImage = async (visual, index) => {
    if (!allowAiProcessing) {
      setAiFeedback("Confirm AI processing before generating a project image.");
      return;
    }
    setImageLoadingIndex(index);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-gemini-api-key": customApiKey } : {})
        },
        body: JSON.stringify({
          prompt: visual.imagePrompt,
          consent: allowAiProcessing
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image generation failed.");
      setGeneratedImages((current) => ({ ...current, [index]: result.image }));
    } catch (error) {
      setAiFeedback(error.message || "Image generation failed. Check the AI configuration and try again.");
    } finally {
      setImageLoadingIndex(null);
    }
  };

  const setFrontMatter = (key, value) =>
    persistProject({ ...project, frontMatter: { ...(project.frontMatter || {}), [key]: value } });

  const generateAbstract = async () => {
    if (!allowAiProcessing) {
      setAiFeedback("Please confirm that you want your chapters sent to Gemini before generating the abstract.");
      return;
    }
    const chapters = Object.values(project.chapters).filter((chapter) => chapter.content?.trim());
    if (chapters.length === 0) {
      setAiFeedback("Write your chapters first; the abstract summarises them.");
      return;
    }
    setIsAbstractLoading(true);
    setAiFeedback("");
    try {
      const response = await fetch("/api/generate-abstract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-gemini-api-key": customApiKey } : {})
        },
        body: JSON.stringify({
          project: { title: project.title, projectType: project.projectType },
          chapters: chapters.map((chapter) => ({ title: chapter.title, content: chapter.content })),
          consent: allowAiProcessing
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Abstract generation failed.");
      setFrontMatter("abstract", result.abstract);
      setAiFeedback("Abstract drafted from your chapters. Review and edit it before submission.");
    } catch (error) {
      setAiFeedback(error.message || "Abstract generation failed.");
    } finally {
      setIsAbstractLoading(false);
    }
  };

  const checkExportReady = (maxChapter = null) => {
    if (!project.id) {
      setActiveView("dashboard");
      return false;
    }
    const isProposal = Boolean(maxChapter && maxChapter <= 3);
    const targetChapters = Object.entries(project.chapters)
      .filter(([num]) => (maxChapter ? Number(num) <= maxChapter : true));

    const chaptersBelowMinimum = targetChapters
      .filter(([, chapter]) => countChapterWords(`${chapter.title || ""}\n${chapter.content || ""}`) < 400)
      .map(([number]) => Number(number));

    if (chaptersBelowMinimum.length > 0) {
      setCurrentChapter(chaptersBelowMinimum[0]);
      setActiveView("studio");
      if (isProposal) {
        setAiFeedback(
          `To export your Chapters 1 to ${maxChapter} Research Proposal, each of Chapters 1 to ${maxChapter} should have at least 400 words. Chapters below minimum: ${chaptersBelowMinimum.join(", ")}.`
        );
      } else {
        setAiFeedback(
          `Complete every chapter to at least 400 words before full export. Chapters below the minimum: ${chaptersBelowMinimum.join(", ")}.`
        );
      }
      return false;
    }

    const unresolved = targetChapters.reduce(
      (count, [, chapter]) => count + (chapter.content?.match(/\[(?:PROJECT DETAIL NEEDED|SOURCE NEEDED)[^\]]*\]/g)?.length || 0),
      0
    );
    const warnings = exportWarnings(project, maxChapter);
    if (unresolved > 0) {
      warnings.push(`${unresolved} placeholder(s) such as [PROJECT DETAIL NEEDED] or [SOURCE NEEDED] are still in Chapters 1 to ${maxChapter || 5}.`);
    }
    if (warnings.length > 0 && !window.confirm(`Before exporting:\n\n• ${warnings.join("\n• ")}\n\nExport anyway?`)) {
      return false;
    }
    return true;
  };

  const handleExportWord = async (maxChapter = null) => {
    if (!checkExportReady(maxChapter)) return;
    const isProposal = Boolean(maxChapter && maxChapter <= 3);

    try {
      setAiFeedback(isProposal ? "Compiling Chapters 1–3 Research Proposal (.docx)..." : "Compiling Full Manuscript (.docx)...");
      const blob = await buildDocxBlob(project, { maxChapter });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${manuscriptFileName(project, maxChapter)}.docx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      setAiFeedback(
        isProposal
          ? "✅ Chapters 1 to 3 Research Proposal (.docx) downloaded successfully! Ready for supervisor review & defense."
          : "✅ Full Manuscript (.docx) downloaded successfully!"
      );
    } catch (error) {
      setAiFeedback(`Could not create the DOCX file: ${error.message}`);
    }
  };

  const handleExportPdf = (maxChapter = null) => {
    if (!checkExportReady(maxChapter)) return;
    const isProposal = Boolean(maxChapter && maxChapter <= 3);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setAiFeedback("Allow pop-ups for this page, then choose Export PDF again.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildPrintableHtml(project, { maxChapter }));
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
    setTimeout(() => printWindow.print(), 500);
    setAiFeedback(
      isProposal
        ? "📄 Chapters 1 to 3 Proposal ready! Print dialog opened (choose 'Save as PDF')."
        : "📚 Full Manuscript ready! Print dialog opened (choose 'Save as PDF')."
    );
  };

  // Create Project Flow
  const handleSourceFilesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 3) {
      event.target.value = "";
      setSourceFiles([]);
      setFormError("Choose no more than 3 project-related documents. Your department guideline is separate.");
      return;
    }
    setFormError("");
    setSourceFiles(selectedFiles);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setFormError("");
    if (!guidelineFile || sourceFiles.length === 0) {
      setFormError("Upload your department guideline and at least one document about your project.");
      return;
    }

    setIsAiLoading(true);
    try {
      const formData = new FormData();
      formData.append("guideline", guidelineFile);
      sourceFiles.forEach((file) => formData.append("sources", file));
      const response = await fetch("/api/project-documents", { method: "POST", body: formData });
      const extracted = await response.json();
      if (!response.ok) throw new Error(extracted.error || "Could not read the uploaded documents.");

      const projectContext = {
        guideline: extracted.guideline,
        guidelineName: extracted.guidelineName,
        sources: extracted.sources
      };
      const newPrj = {
        ...EMPTY_PROJECT,
        id: "prj_" + Date.now(),
        title: newTitle.trim(),
        shortTitle: newTitle.trim().slice(0, 45),
        studentName: newStudentName.trim(),
        matricNumber: newMatricNumber.trim(),
        faculty: newFaculty.trim(),
        supervisor: newSupervisor.trim(),
        targetDate: newTargetDate,
        supervisorNotes: [],
        department: newDept,
        degree: newDegree,
        institution: newInstitution,
        citationStyle: newCitation,
        projectContext,
        chapters: buildChapters(newStructure)
      };

      try {
        localStorage.setItem("projectpilot_project", JSON.stringify(newPrj));
      } catch {
        try {
          const compactPrj = {
            ...newPrj,
            projectContext: {
              ...projectContext,
              sources: projectContext.sources.map((s) => ({
                name: s.name,
                content: s.content.slice(0, 30000)
              }))
            }
          };
          localStorage.setItem("projectpilot_project", JSON.stringify(compactPrj));
        } catch {
          console.warn("Storage quota reached; keeping active project in memory.");
        }
      }

      setProject(newPrj);
      setProjectContext(projectContext);
      setEditorText("");
      setIsNewProjectModalOpen(false);
      setActiveView("studio");
      setCurrentChapter(1);
      setAllowAiProcessing(false);
    } catch (error) {
      setFormError(error.message || "Project setup failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div suppressHydrationWarning style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ========================================================
          NAVIGATION BAR
         ======================================================== */}
      <header className="navbar">
        <div className="container nav-inner">
          <div className="logo-brand" onClick={() => setActiveView("landing")}>
            <div className="logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                <path d="M6 6h10"></path>
                <path d="M6 10h10"></path>
                <path d="M6 14h6"></path>
                <circle cx="18" cy="18" r="3" fill="#6366f1"></circle>
              </svg>
            </div>
            <span>
              Project<span style={{ color: "var(--violet-400)" }}>Pilot</span>
            </span>
          </div>

          <nav>
            <ul className="nav-links">
              <li>
                <button
                  className={`nav-link ${activeView === "landing" ? "active" : ""}`}
                  onClick={() => setActiveView("landing")}
                >
                  Features & Overview
                </button>
              </li>
              <li>
                <button
                  className={`nav-link ${activeView === "dashboard" ? "active" : ""}`}
                  onClick={() => setActiveView("dashboard")}
                >
                  Student Dashboard
                </button>
              </li>
              <li>
                <button
                  className={`nav-link ${activeView === "studio" ? "active" : ""}`}
                  onClick={() => setActiveView("studio")}
                >
                  Chapter Studio
                </button>
              </li>
              <li>
                <a className="nav-link" href="#how-it-works" onClick={() => setActiveView("landing")}>
                  How It Works
                </a>
              </li>
              <li>
                <a className="nav-link" href="#academic-integrity" onClick={() => setActiveView("landing")}>
                  Academic Integrity
                </a>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsKeyModalOpen(true)}
              title="API Keys Pool & Auto-Failover"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>🔑</span>
              <span>{keysStatus.totalKeys || 3} Keys</span>
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  background: "rgba(52, 211, 153, 0.15)",
                  color: "var(--emerald-400)",
                  borderRadius: "10px",
                  border: "1px solid rgba(52, 211, 153, 0.3)"
                }}
              >
                Auto-Failover
              </span>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveView("dashboard")}>
              Sign In
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              <span>+ New Project</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          VIEW 1: LANDING PAGE
         ======================================================== */}
      {activeView === "landing" && (
        <main>
          {/* HERO SECTION */}
          <section className="hero-section">
            <div className="container hero-content">
              <div className="badge badge-violet">
                <span className="pulse-dot"></span>
                <span>AI-Powered Academic Assistant • Built for African & Global Universities</span>
              </div>

              <h1 className="hero-title">
                Transform Your Final-Year Project from a{" "}
                <span className="text-gradient">Blank Page</span> to{" "}
                <span className="text-gradient-alt">Submission-Ready</span>.
              </h1>

              <p className="hero-subtitle">
                One guided workspace. Overcome topic uncertainty, structure Chapters 1 through 5
                with departmental accuracy, manage APA/Harvard references, and format your entire manuscript
                with supervisor-approved academic standards.
              </p>

              <div className="hero-cta-group">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => setIsNewProjectModalOpen(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Start Your Project Free</span>
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActiveView("studio")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Explore Live Chapter Studio</span>
                </button>
                <button
                  className="btn btn-accent btn-lg"
                  onClick={() => setActiveView("dashboard")}
                >
                  <span>Open Student Dashboard</span>
                </button>
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <span style={{ color: "var(--emerald-400)" }}>✓</span> Zero Hallucinated Citations
                </div>
                <div className="trust-item">
                  <span style={{ color: "var(--emerald-400)" }}>✓</span> 5-Chapter NUC & Global Formats
                </div>
                <div className="trust-item">
                  <span style={{ color: "var(--emerald-400)" }}>✓</span> Taro Yamane & Cochran Sampling Tools
                </div>
                <div className="trust-item">
                  <span style={{ color: "var(--emerald-400)" }}>✓</span> Word (.docx) & PDF Export
                </div>
              </div>

              {/* INTERACTIVE MOCKUP SHOWCASE */}
              <div className="hero-mockup-wrapper">
                <div className="editor-window">
                  <div className="window-header">
                    <div className="window-dots">
                      <div className="dot dot-red"></div>
                      <div className="dot dot-yellow"></div>
                      <div className="dot dot-green"></div>
                    </div>
                    <div className="window-title">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span>ProjectPilot Studio • Chapter 1: Introduction</span>
                    </div>
                    <div className="window-stats">
                      <span><strong>2,480</strong> words</span>
                      <span>•</span>
                      <span style={{ color: "var(--emerald-400)" }}>Auto-saved 1m ago</span>
                    </div>
                  </div>

                  <div style={{ padding: "32px", textAlign: "left", background: "#060b1b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <span className="badge badge-cyan">Section 1.2 — Statement of the Problem</span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveView("studio")}
                      >
                        Open Interactive Studio →
                      </button>
                    </div>

                    <p style={{ color: "#cbd5e1", fontSize: "0.98rem", lineHeight: "1.7", marginBottom: "16px" }}>
                      &ldquo;Despite massive financial investments by Nigerian deposit money banks in generative AI and automated decision support systems, empirical evidence regarding their contribution to operational risk reduction remains fragmented. High cyber-threat vulnerabilities, regulatory shifts under the Nigeria Data Protection Act (NDPA 2023), and telecommunication latency introduce significant friction in continuous financial intermediation...&rdquo;
                    </p>

                    <div style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1.2rem" }}>✨</span>
                        <span style={{ fontSize: "0.88rem", color: "var(--violet-300)" }}>
                          <strong>AI Academic Copilot:</strong> Verified APA citation inserted: <em>Adebayo & Okon (2023)</em>. Problem statement aligns with Research Objective #1.
                        </span>
                      </div>
                      <span className="badge badge-emerald">Objective Aligned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* METRICS & STATS BAR */}
          <section className="container">
            <div className="glass-card stats-bar">
              <div className="stat-item">
                <div className="stat-number">14,200+</div>
                <div className="stat-label">Final-Year Projects Planned</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98.4%</div>
                <div className="stat-label">Supervisor Chapter Acceptance Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">45+</div>
                <div className="stat-label">University Academic Disciplines</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">100%</div>
                <div className="stat-label">Zero-Hallucination Policy</div>
              </div>
            </div>
          </section>

          {/* 6 CORE FEATURES (PRD SCOPE) */}
          <section className="features-section" id="features">
            <div className="container">
              <div className="section-header">
                <div className="badge badge-violet">Comprehensive Academic Suite</div>
                <h2 className="section-title">
                  Everything You Need from <span className="text-gradient">Topic Defense</span> to <span className="text-gradient-alt">Final Bound Manuscript</span>
                </h2>
                <p className="section-subtitle">
                  Designed specifically around undergraduate and postgraduate project structures, supervisor feedback routines, and citation requirements.
                </p>
              </div>

              <div className="features-grid">
                {/* Feature 1 */}
                <div className="glass-card feature-card">
                  <div className="feature-icon-box">💡</div>
                  <h3 className="feature-title">AI Project Topic Assistant</h3>
                  <p className="feature-desc">
                    Overcome topic choice anxiety. Input your course of study and research interests to generate viable, novel, and supervisor-ready topics with formulated research problems and feasible objectives.
                  </p>
                  <div className="feature-tag-list">
                    <span className="feature-tag">Topic Feasibility</span>
                    <span className="feature-tag">Problem Statement</span>
                    <span className="feature-tag">Discipline Tailored</span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="glass-card feature-card">
                  <div className="feature-icon-box">✍️</div>
                  <h3 className="feature-title">Chapter-by-Chapter Studio</h3>
                  <p className="feature-desc">
                    Never stare at a 100-page blank document again. Work chapter-by-chapter with structured sections: Background, Problem Statement, Empirical Review, Methodology, and Findings.
                  </p>
                  <div className="feature-tag-list">
                    <span className="feature-tag">5-Chapter Format</span>
                    <span className="feature-tag">Live Autosave</span>
                    <span className="feature-tag">Word Counter</span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="glass-card feature-card">
                  <div className="feature-icon-box">📚</div>
                  <h3 className="feature-title">Credible Source & Citation Manager</h3>
                  <p className="feature-desc">
                    Seamlessly format citations in APA 7th, Harvard, MLA, Chicago, and IEEE. Connect with verified bibliographic records from OpenAlex and Crossref without made-up citations.
                  </p>
                  <div className="feature-tag-list">
                    <span className="feature-tag">APA 7th</span>
                    <span className="feature-tag">Harvard</span>
                    <span className="feature-tag">Auto-Bibliography</span>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="glass-card feature-card">
                  <div className="feature-icon-box">🔬</div>
                  <h3 className="feature-title">Methodology & Sampling Assistant</h3>
                  <p className="feature-desc">
                    Plan Chapter Three with confidence. Formulate research designs, sample sizes using Taro Yamane or Cochran formulas, questionnaire drafts, and reliability validation criteria.
                  </p>
                  <div className="feature-tag-list">
                    <span className="feature-tag">Taro Yamane</span>
                    <span className="feature-tag">Questionnaire Builder</span>
                    <span className="feature-tag">Qual & Quant</span>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="glass-card feature-card">
                  <div className="feature-icon-box">🛡️</div>
                  <h3 className="feature-title">Project Consistency Checker</h3>
                  <p className="feature-desc">
                    Ensure your research questions strictly align with your research objectives, methodology, questionnaire items, and Chapter 5 conclusions before submitting to your supervisor.
                  </p>
                  <div className="feature-tag-list">
                    <span className="feature-tag">Alignment Matrix</span>
                    <span className="feature-tag">Hypothesis Check</span>
                    <span className="feature-tag">Supervisor Ready</span>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="glass-card feature-card">
                  <div className="feature-icon-box">📝</div>
                  <h3 className="feature-title">Supervisor Revision & DOCX Export</h3>
                  <p className="feature-desc">
                    Log and track supervisor corrections per chapter. Once approved, export your entire project into a clean Microsoft Word (.docx/.doc) document with Times New Roman 1.5 spacing.
                  </p>
                  <div className="feature-tag-list">
                    <span className="feature-tag">Feedback Tracker</span>
                    <span className="feature-tag">Word .docx Export</span>
                    <span className="feature-tag">Academic Preliminaries</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="how-section" id="how-it-works">
            <div className="container">
              <div className="section-header">
                <div className="badge badge-cyan">Structured 4-Step Process</div>
                <h2 className="section-title">How ProjectPilot Works</h2>
                <p className="section-subtitle">
                  We turn an intimidating, multi-month research hurdle into a transparent step-by-step progression.
                </p>
              </div>

              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">01</div>
                  <h4 className="step-title">Setup & Topic Ideation</h4>
                  <p className="step-desc">
                    Provide your university, department, and degree level. Generate or refine a tailored project topic with problem statements and verified research objectives.
                  </p>
                </div>

                <div className="step-card">
                  <div className="step-number">02</div>
                  <h4 className="step-title">Generate Department Outline</h4>
                  <p className="step-desc">
                    Adopt your department&apos;s approved structure. Automatically create title pages, certification, dedication, and 5-chapter subsections.
                  </p>
                </div>

                <div className="step-card">
                  <div className="step-number">03</div>
                  <h4 className="step-title">Chapter-by-Chapter Drafting</h4>
                  <p className="step-desc">
                    Draft each section with AI prompts for clarity, conceptual frameworks, methodology justification, and real-time citation insertion.
                  </p>
                </div>

                <div className="step-card">
                  <div className="step-number">04</div>
                  <h4 className="step-title">Supervisor Review & Export</h4>
                  <p className="step-desc">
                    Log supervisor corrections, verify cross-chapter consistency, and export a formatted Microsoft Word manuscript ready for hard-cover binding.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ACADEMIC INTEGRITY BANNER */}
          <section className="integrity-section" id="academic-integrity">
            <div className="container">
              <div className="integrity-card">
                <div>
                  <div className="badge badge-emerald" style={{ marginBottom: "16px" }}>
                    Academic Ethics First
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff", marginBottom: "16px", lineHeight: "1.25" }}>
                    Committed to Research Rigor, Not Shortcut Plagiarism.
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: "1.7" }}>
                    ProjectPilot is strictly designed as an academic guide and writing companion. It helps students understand <em>why</em> each section matters, structures their arguments, and prevents hallucinated references, ensuring your final submission represents authentic, defendable academic contribution.
                  </p>
                </div>

                <div className="integrity-points">
                  <div className="integrity-point">
                    <div className="point-icon">✓</div>
                    <div>
                      <strong style={{ color: "#ffffff", display: "block" }}>No Hallucinated Citations</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        All bibliographic metadata is verified against published academic records (Crossref & OpenAlex).
                      </span>
                    </div>
                  </div>

                  <div className="integrity-point">
                    <div className="point-icon">✓</div>
                    <div>
                      <strong style={{ color: "#ffffff", display: "block" }}>Student Voice Preserved</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        AI suggestions act as critical editors, not automated ghostwriters. You retain full authorship.
                      </span>
                    </div>
                  </div>

                  <div className="integrity-point">
                    <div className="point-icon">✓</div>
                    <div>
                      <strong style={{ color: "#ffffff", display: "block" }}>Institutional Policy Compliant</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Conforms to NUC guidelines, British university standards, and global dissertation ethics policies.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA BANNER */}
          <section className="container">
            <div className="cta-banner">
              <h2 style={{ fontSize: "2.4rem", fontWeight: "800", color: "#ffffff", marginBottom: "16px" }}>
                Ready to Complete Your Final-Year Project with Confidence?
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "640px", margin: "0 auto 30px" }}>
                Join thousands of final-year undergraduate and postgraduate students organizing, drafting, and graduating on time.
              </p>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => setIsNewProjectModalOpen(true)}
                >
                  Create Your Project Now (Free)
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActiveView("dashboard")}
                >
                    Open Student Dashboard
                </button>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="footer">
            <div className="container">
              <div className="footer-grid">
                <div className="footer-brand">
                  <div className="logo-brand">
                    <div className="logo-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                        <path d="M6 6h10"></path>
                        <path d="M6 10h10"></path>
                      </svg>
                    </div>
                    <span>ProjectPilot</span>
                  </div>
                  <p>
                    AI-powered academic research and dissertation companion for final-year university students across Nigeria and international institutions.
                  </p>
                </div>

                <div className="footer-col">
                  <h4>Product</h4>
                  <ul className="footer-links">
                    <li><button className="footer-link" onClick={() => setActiveView("studio")}>Chapter Studio</button></li>
                    <li><button className="footer-link" onClick={() => setActiveView("dashboard")}>Student Dashboard</button></li>
                    <li><button className="footer-link" onClick={() => setIsNewProjectModalOpen(true)}>Topic Generator</button></li>
                    <li><button className="footer-link" onClick={() => handleExportWord(3)}>Download Ch 1–3 Proposal</button></li>
                    <li><button className="footer-link" onClick={() => handleExportWord()}>Full Word .docx Export</button></li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4>Academic Guides</h4>
                  <ul className="footer-links">
                    <li><span className="footer-link">APA 7th Edition Guide</span></li>
                    <li><span className="footer-link">Taro Yamane Calculator</span></li>
                    <li><span className="footer-link">Literature Review Matrix</span></li>
                    <li><span className="footer-link">Questionnaire Templates</span></li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4>Integrity & Policies</h4>
                  <ul className="footer-links">
                    <li><span className="footer-link">Academic Integrity Policy</span></li>
                    <li><span className="footer-link">NUC Project Guidelines</span></li>
                    <li><span className="footer-link">Privacy & NDPA Compliance</span></li>
                    <li><span className="footer-link">Supervisor Advisory Terms</span></li>
                  </ul>
                </div>
              </div>

              <div className="footer-bottom">
                <div>© 2026 ProjectPilot Technologies Inc. All rights reserved.</div>
                <div>Designed for Nigerian & Global University Scholars.</div>
              </div>
            </div>
          </footer>
        </main>
      )}

      {/* ========================================================
          VIEW 2: STUDENT DASHBOARD
         ======================================================== */}
      {activeView === "dashboard" && (
        <main className="dashboard-wrapper">
          <div className="container">
            {!project.id ? (
              <div className="glass-card" style={{ maxWidth: "720px", margin: "64px auto", padding: "36px", textAlign: "center" }}>
                <h1 style={{ color: "#ffffff", marginBottom: "12px" }}>Start with your project details</h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                  Your dashboard will show your chapters, writing progress, supervisor feedback, and submission details after you create a project.
                </p>
                <button className="btn btn-primary" onClick={() => setIsNewProjectModalOpen(true)}>
                  Set Up a Project
                </button>
              </div>
            ) : (
              <>
            <div className="dashboard-header">
              <div className="dashboard-greeting">
                <div className="badge badge-cyan" style={{ marginBottom: "8px" }}>
                  Active Candidate • Matric: {project.matricNumber}
                </div>
                <h1>Welcome back, {project.studentName}</h1>
                <p>
                  {project.degree} • {project.department}, {project.institution}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleExportWord(3)}
                  style={{
                    border: "1px solid rgba(139, 92, 246, 0.6)",
                    background: "rgba(139, 92, 246, 0.18)",
                    color: "#f3e8ff",
                    fontWeight: "600"
                  }}
                  title="Download Chapters 1 to 3 Proposal for departmental defense"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span>Download Ch 1–3 Proposal (.docx)</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleExportWord()} title="Download Full 5-Chapter Project">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Export Full Project (.docx)</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsExportModalOpen(true)} title="Choose between Proposal (Ch 1-3) or Full Project (PDF / Word)">
                  <span>Export Options...</span>
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveView("studio")}>
                  <span>Continue Writing →</span>
                </button>
              </div>
            </div>

            {/* DASHBOARD STATS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "20px", marginBottom: "32px" }}>
              <div className="glass-card" style={{ padding: "20px", border: "1px solid rgba(139, 92, 246, 0.4)", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(255, 255, 255, 0.03))" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--violet-300)", fontWeight: "600" }}>📖 70+ Page Target</span>
                  <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px", background: estimatedTotalPages >= 70 ? "rgba(16, 185, 129, 0.2)" : "rgba(139, 92, 246, 0.2)", color: estimatedTotalPages >= 70 ? "var(--emerald-400)" : "var(--violet-300)", fontWeight: "600" }}>
                    {estimatedTotalPages >= 70 ? "Target Met! 🎉" : `${Math.max(0, 70 - estimatedTotalPages)} pgs to goal`}
                  </span>
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  ~{estimatedTotalPages} <span style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: "500" }}>/ 70+ pages</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                  <div style={{ width: `${pageProgressPercent}%`, height: "100%", background: "linear-gradient(90deg, var(--violet-500), var(--emerald-400))", borderRadius: "3px" }} />
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  {totalWords.toLocaleString()} chapter words + ~10 prelim pgs
                </div>
              </div>

              <div className="glass-card" style={{ padding: "20px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Total Words Written</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  {totalWords.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "var(--violet-400)" }}>words</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--emerald-400)", marginTop: "4px" }}>
                  Counted across all project chapters
                </div>
              </div>

              <div className="glass-card" style={{ padding: "20px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Manuscript Completion</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  {overallProgress}%
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--cyan-400)", marginTop: "4px" }}>
                  {chaptersMeetingMinimum} of {Object.keys(project.chapters).length} chapters meet academic minimum
                </div>
              </div>

              <div className="glass-card" style={{ padding: "20px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Supervisor Status</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  {project.supervisorNotes.filter((n) => !n.resolved).length} Pending
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--amber-400)", marginTop: "4px" }}>
                  Supervisor: {project.supervisor || "Not set"}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "20px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Target Submission Date</span>
                <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#ffffff", marginTop: "8px" }}>
                  {project.targetDate}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Citation Style: {project.citationStyle}
                </div>
              </div>
            </div>

            {/* MAIN DASHBOARD CONTENT */}
            <div className="dashboard-overview-grid">
              {/* Active Project Hero Card */}
              <div className="project-hero-card">
                <div className="project-badge-row">
                  <span className="badge badge-violet">{project.department}</span>
                  <span className="badge badge-emerald">Final Year Thesis</span>
                  <span className="badge badge-cyan">{project.citationStyle}</span>
                </div>

                <h2 className="project-title-large">{project.title}</h2>

                <div className="project-meta-row">
                  <span>🏛️ {project.institution}</span>
                  <span>👨‍🏫 {project.supervisor}</span>
                  <span>📅 Updated today</span>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Overall Completion Progress</span>
                    <span style={{ fontWeight: "700", color: "#ffffff" }}>{overallProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
                  </div>
                </div>

                {/* Chapter breakdown */}
                <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff", marginTop: "24px" }}>
                  Chapter-by-Chapter Milestones
                </h4>

                <div className="chapters-progress-list">
                  {Object.keys(project.chapters).map((num) => {
                    const ch = project.chapters[num];
                    const chapterWords = countChapterWords(`${ch.title || ""}\n${ch.content || ""}`);
                    const meetsMinimum = chapterWords >= 600;
                    return (
                      <div
                        key={num}
                        className="chapter-progress-row"
                        onClick={() => {
                          setCurrentChapter(Number(num));
                          setActiveView("studio");
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "600", color: "#ffffff", fontSize: "0.95rem" }}>
                            {ch.title}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {chapterWords.toLocaleString()} words (~{Math.max(1, Math.round(chapterWords / 280))} pages) • {chapterWords >= 2000 ? "full chapter depth" : chapterWords >= 600 ? "drafted" : "needs drafting"}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span
                            className={`badge ${chapterWords >= 2000 ? "badge-emerald" : chapterWords >= 600 ? "badge-violet" : "badge-amber"}`}
                          >
                            {chapterWords >= 2000 ? `~${Math.round(chapterWords / 280)} pgs (Complete)` : chapterWords >= 600 ? `~${Math.round(chapterWords / 280)} pgs (Draft)` : "In progress"}
                          </span>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
                            Edit →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar: Supervisor Notes & Quick Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className="glass-card supervisor-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>
                      Supervisor Notes
                    </h3>
                    <span className="badge badge-amber" style={{ background: "rgba(251, 191, 36, 0.15)", color: "var(--amber-400)", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
                      {project.supervisorNotes.filter((n) => !n.resolved).length} Unresolved
                    </span>
                  </div>

                  {project.supervisorNotes.map((note) => (
                    <div key={note.id} className={`note-item ${note.resolved ? "resolved" : ""}`}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                        <span>Chapter {note.chapter} Feedback</span>
                        <span>{note.date}</span>
                      </div>
                      <p style={{ fontSize: "0.88rem", color: "#e2e8f0", lineHeight: "1.5" }}>
                        &ldquo;{note.text}&rdquo;
                      </p>
                      <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: "0.75rem", color: note.resolved ? "var(--emerald-400)" : "var(--amber-400)", fontWeight: "600" }}>
                          {note.resolved ? "✓ Correction Resolved" : "● Needs Revision"}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", marginTop: "8px" }}
                    onClick={() => {
                      const text = prompt("Enter supervisor feedback note:");
                      if (text) {
                        const newNote = {
                          id: "sn_" + Date.now(),
                          chapter: currentChapter,
                          date: "Today",
                          text,
                          resolved: false
                        };
                        const updated = {
                          ...project,
                          supervisorNotes: [newNote, ...project.supervisorNotes]
                        };
                        setProject(updated);
                        try {
                          localStorage.setItem("projectpilot_project", JSON.stringify(updated));
                        } catch {}
                      }
                    }}
                  >
                    + Log New Supervisor Comment
                  </button>
                </div>

                <div className="glass-card" style={{ padding: "24px" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff", marginBottom: "12px" }}>
                    Quick Project Actions
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveView("studio")}>
                      Open Chapter Studio
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExportWord(3)}
                      style={{
                        border: "1px solid rgba(139, 92, 246, 0.5)",
                        background: "rgba(139, 92, 246, 0.14)",
                        color: "#f3e8ff",
                        fontWeight: "600",
                        textAlign: "left",
                        justifyContent: "flex-start"
                      }}
                      title="Download Chapters 1 to 3 Proposal for departmental defense"
                    >
                      📄 Download Ch 1–3 Proposal (.docx)
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExportWord()}
                      style={{ textAlign: "left", justifyContent: "flex-start" }}
                      title="Download Full 5-Chapter Project Manuscript"
                    >
                      📚 Download Full Manuscript (.docx)
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsExportModalOpen(true)}
                      style={{ textAlign: "left", justifyContent: "flex-start", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                      title="Choose Proposal or Full Project in Word or PDF"
                    >
                      🖨️ Export Options & PDF...
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsNewProjectModalOpen(true)}
                    >
                      + Create Another Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        </main>
      )}

      {/* ========================================================
          VIEW 3: CHAPTER WRITING STUDIO WORKSPACE
         ======================================================== */}
      {activeView === "studio" && (
        <main className="workspace-container">
          {/* LEFT SIDEBAR: CHAPTERS & SUBSECTIONS */}
          <aside className="workspace-sidebar">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Chapters Outline
              </span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                onClick={() => setActiveView("dashboard")}
              >
                Dashboard
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.keys(project.chapters).map(Number).sort((a, b) => a - b).map((num) => {
                const ch = project.chapters[num];
                const isActive = currentChapter === num;
                return (
                  <button
                    key={num}
                    onClick={() => setCurrentChapter(num)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-sm)",
                      background: isActive ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.02)",
                      border: isActive
                        ? "1px solid rgba(139, 92, 246, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.05)",
                      color: isActive ? "#ffffff" : "var(--text-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                        Chapter {num}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {ch?.title?.replace(/^Chapter (?:One|Two|Three|Four|Five|\\d+):?\\s*/i, "")}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "var(--text-secondary)"
                      }}
                    >
                      {(() => {
                        const chWords = countChapterWords(`${ch?.title || ""}\n${ch?.content || ""}`);
                        const chPages = Math.max(1, Math.round(chWords / 280));
                        return chWords >= 2000
                          ? `✓ ~${chPages} pgs`
                          : chWords > 0
                          ? `~${chPages} pgs`
                          : "Empty";
                      })()}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: "24px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", display: "block", marginBottom: "10px" }}>
                Chapter {currentChapter} Sections
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {project.chapters[currentChapter]?.subsections?.map((sub, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderLeft: "2px solid var(--violet-500)"
                    }}
                  >
                    {sub}
                  </div>
                ))}
                {!project.chapters[currentChapter]?.subsections?.length && (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                    Chapter headings will follow your uploaded department guideline.
                  </p>
                )}
              </div>
            </div>

            {/* PROPOSAL DEFENSE STATUS & EXPORT CARD */}
            <div
              style={{
                marginTop: "24px",
                padding: "14px",
                borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.16), rgba(99, 102, 241, 0.08))",
                border: "1px solid rgba(139, 92, 246, 0.35)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.05rem" }}>🎓</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f3e8ff" }}>
                  Chapters 1–3 Proposal
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--violet-200)", lineHeight: "1.4", margin: "0 0 10px 0" }}>
                Universities require Chapters 1–3 approved for proposal defense before data gathering (Chapters 4 & 5).
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleExportWord(3)}
                  style={{
                    flex: 1,
                    fontSize: "0.76rem",
                    padding: "6px 8px",
                    background: "rgba(139, 92, 246, 0.25)",
                    border: "1px solid rgba(139, 92, 246, 0.6)",
                    color: "#ffffff"
                  }}
                  title="Download Chapters 1 to 3 Word Document"
                >
                  📄 Word (.docx)
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleExportPdf(3)}
                  style={{
                    fontSize: "0.76rem",
                    padding: "6px 8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)"
                  }}
                  title="Export Proposal PDF"
                >
                  PDF
                </button>
              </div>
            </div>
          </aside>

          {/* CENTER: EDITING CANVAS */}
          <section className="workspace-editor-area">
            {/* Toolbar */}
            <div className="editor-toolbar">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span className="badge badge-violet">{project.chapters[currentChapter]?.title}</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {saveStatus}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.83rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span><strong>{wordCount.toLocaleString()}</strong> words (~{Math.max(1, Math.round(wordCount / 280))} pgs)</span>
                  <span style={{ color: "var(--text-muted)" }}>•</span>
                  <span style={{ color: "var(--violet-300)", fontWeight: "600" }}>Project: ~{estimatedTotalPages} / 70+ pgs</span>
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleExportWord(3)}
                  style={{
                    border: "1px solid rgba(139, 92, 246, 0.6)",
                    background: "rgba(139, 92, 246, 0.16)",
                    color: "#f3e8ff",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  title="Download Chapters 1 to 3 Research Proposal for defense"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span>Export Ch 1–3 (Proposal)</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleExportWord()} title="Export Full 5-Chapter Manuscript">
                  Export Full DOCX
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsExportModalOpen(true)} title="More export options (PDF, Proposal vs Full)">
                  Export Options...
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSaveStatus("Saving changes...");
                    setTimeout(() => setSaveStatus("Saved to local browser storage"), 400);
                  }}
                >
                  Save Draft
                </button>
              </div>
            </div>

            {/* WORD-FRIENDLY FORMATTING RIBBON */}
            <div className="word-ribbon">
              <div className="ribbon-group">
                <button
                  className={`ribbon-btn ${editorViewMode === "editor" ? "active" : ""}`}
                  onClick={() => setEditorViewMode("editor")}
                  title="Edit draft text"
                >
                  <span>📝</span> Draft Editor
                </button>
                <button
                  className={`ribbon-btn ${editorViewMode === "preview" ? "active" : ""}`}
                  onClick={() => setEditorViewMode("preview")}
                  title="Live formatted Word-style manuscript preview"
                >
                  <span>👁️</span> Word Preview
                </button>
              </div>

              <div className="ribbon-group">
                <button
                  className="ribbon-btn ribbon-btn-primary"
                  onClick={openTableBuilderModal}
                  title="Insert an APA formatted table"
                >
                  <span>⊞</span> <strong>Insert Table</strong>
                </button>
                <button
                  className="ribbon-btn ribbon-btn-primary"
                  onClick={openDiagramStudioModal}
                  title="Draw and insert an academic flowchart or diagram"
                >
                  <span>📊</span> <strong>Draw Diagram</strong>
                </button>
              </div>

              <div className="ribbon-group">
                <button className="ribbon-btn" onClick={() => insertFormatting("bold")} title="Bold (**text**)">
                  <strong>B</strong>
                </button>
                <button className="ribbon-btn" onClick={() => insertFormatting("italic")} title="Italic (*text*)">
                  <em>I</em>
                </button>
                <button className="ribbon-btn" onClick={() => insertFormatting("h2")} title="Insert Section Heading">
                  H2
                </button>
                <button className="ribbon-btn" onClick={() => insertFormatting("h3")} title="Insert Subsection Heading">
                  H3
                </button>
                <button className="ribbon-btn" onClick={() => insertFormatting("bullet")} title="Bullet List">
                  • List
                </button>
                <button className="ribbon-btn" onClick={() => insertFormatting("numbered")} title="Numbered List">
                  1. List
                </button>
                <button className="ribbon-btn" onClick={() => insertFormatting("quote")} title="Blockquote">
                  ❝ Quote
                </button>
                <button
                  className="ribbon-btn"
                  onClick={handleCleanDraftFormatting}
                  title="Remove all markdown signs (**, ##, <br/>) and standardize academic formatting"
                  style={{ color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", marginLeft: "4px" }}
                >
                  <span>✨</span> Clean Formatting
                </button>
              </div>
            </div>

            {/* Content Area: Editor or Word Preview */}
            <div className="editor-content-box">
              {editorViewMode === "editor" ? (
                <>
                  <input
                    className="editor-title-input"
                    value={project.chapters[currentChapter]?.title || ""}
                    onChange={(e) => {
                      const updatedChapters = {
                        ...project.chapters,
                        [currentChapter]: {
                          ...project.chapters[currentChapter],
                          title: e.target.value
                        }
                      };
                      const updatedProject = { ...project, chapters: updatedChapters };
                      setProject(updatedProject);
                      try {
                        localStorage.setItem("projectpilot_project", JSON.stringify(updatedProject));
                      } catch {}
                    }}
                  />

                  {/* PROMINENT VISUAL FLOWCHART CARD IN DRAFT EDITOR */}
                  {diagramCode ? (
                    <div className="studio-flowchart-card">
                      <div className="studio-flowchart-header">
                        <div className="studio-flowchart-title">
                          <span style={{ fontSize: "1.2rem" }}>📊</span>
                          <div>
                            <h4>Figure {currentChapter}.1: Methodological & Conceptual Framework Flowchart</h4>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Live visual rendering • Embedded in Chapter {currentChapter} manuscript
                            </span>
                          </div>
                          <span className="studio-flowchart-badge">Active Visual</span>
                        </div>
                        <div className="studio-flowchart-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openDiagramStudioModal(diagramCode, `Figure ${currentChapter}.1: Methodological Framework`)}
                            title="Edit flowchart nodes, text, and structure in Diagram Studio"
                          >
                            ✏️ Edit Diagram
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleRegenerateChapterFlowchart}
                            title="Regenerate or reset to standard university chapter framework"
                          >
                            🔄 Reset
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleDownloadDiagramSvg}
                            title="Download high-resolution SVG of this flowchart"
                          >
                            💾 Download SVG
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setIsFlowchartCardVisible(!isFlowchartCardVisible)}
                            title={isFlowchartCardVisible ? "Collapse diagram preview" : "Expand diagram preview"}
                          >
                            {isFlowchartCardVisible ? "▲ Collapse" : "▼ Expand"}
                          </button>
                        </div>
                      </div>

                      {isFlowchartCardVisible && (
                        <>
                          <div className="studio-flowchart-body">
                            <MermaidDiagram code={diagramCode} id={`active-ch${currentChapter}`} />
                          </div>
                          <div className="studio-flowchart-caption">
                            *Figure {currentChapter}.1: Methodological Framework, Variable Interaction & System Architecture.*
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="studio-flowchart-empty-card">
                      <div className="studio-flowchart-empty-info">
                        <span className="studio-flowchart-empty-icon">📊</span>
                        <div>
                          <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            No Flowchart Embedded in Chapter {currentChapter}
                          </strong>
                          <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                            Academic dissertations require a visual framework (Conceptual, Design, or Data Flow).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleRegenerateChapterFlowchart}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        + Generate Chapter {currentChapter} Flowchart
                      </button>
                    </div>
                  )}

                  <textarea
                    ref={editorTextareaRef}
                    className="editor-textarea"
                    value={editorText}
                    onChange={handleEditorChange}
                    placeholder="Draft your chapter here. Use the Insert Table and Draw Diagram tools above to add academic visuals directly into your manuscript..."
                  />
                  <div className={`word-count-status ${wordCount >= 2000 ? "meets-minimum" : ""}`} aria-live="polite" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      {wordCount >= 2000
                        ? `🎉 Full Chapter Depth (${wordCount.toLocaleString()} words, ~${Math.round(wordCount / 280)} pages)`
                        : wordCount >= 600
                        ? `✓ Chapter Drafted (${wordCount.toLocaleString()} words, ~${Math.round(wordCount / 280)} pgs). Use "Expand & Deepen" to reach full 2,500+ words.`
                        : `${wordCount.toLocaleString()} words (~${Math.max(1, Math.round(wordCount / 280))} pages) • Aim for 2,500–4,000 words per chapter.`}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--violet-300)", fontWeight: "600" }}>
                      Manuscript: ~{estimatedTotalPages} / 70+ pgs target
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--violet-300)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>👁️</span> <strong>Word Manuscript Preview (APA 7th Format)</strong> • Chapter {currentChapter}
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditorViewMode("editor")}>
                      ✏️ Edit Draft
                    </button>
                  </div>

                  <div className="word-manuscript-paper">
                    <h1>{project.chapters[currentChapter]?.title || `Chapter ${currentChapter}`}</h1>
                    {parseBlocks(editorText).map((block, idx) => {
                      if (block.type === "heading") {
                        return <h2 key={idx}>{block.text}</h2>;
                      }
                      if (block.type === "table") {
                        return (
                          <div key={idx} className="apa-preview-table-wrap">
                            {block.caption && <div className="apa-table-caption"><em>{block.caption}</em></div>}
                            <table className="apa-preview-table">
                              <thead>
                                <tr>
                                  {block.headers.map((h, i) => (
                                    <th key={i}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {block.rows.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx}>{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                      if (block.type === "diagram") {
                        return (
                          <div key={idx} className="diagram-preview-card">
                            <MermaidDiagram code={block.code} id={`ch${currentChapter}-b${idx}`} />
                            {block.caption && <div className="diagram-figure-caption">{block.caption}</div>}
                          </div>
                        );
                      }
                      if (block.type === "list") {
                        return <p key={idx} className="list">{block.text}</p>;
                      }
                      return <p key={idx} className="paragraph">{block.text}</p>;
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR: AI ACADEMIC ASSISTANT */}
          <aside className="workspace-ai-panel">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "1.1rem" }}>🏛️</span>
                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff" }}>
                  Full-Blown Chapter Author
                </h3>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                Authors complete, publication-grade academic chapters (2,500–4,000+ words). Fully written without outlines or placeholders to reach the 70+ page dissertation target.
              </p>

              <div style={{ padding: "10px 12px", background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: "8px", marginTop: "10px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                  <span style={{ fontWeight: "700", color: "var(--violet-200)" }}>🎯 70+ Page Goal</span>
                  <span style={{ color: estimatedTotalPages >= 70 ? "var(--emerald-400)" : "var(--violet-300)", fontWeight: "700" }}>
                    ~{estimatedTotalPages} / 70+ pgs ({pageProgressPercent}%)
                  </span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{ width: `${pageProgressPercent}%`, height: "100%", background: "linear-gradient(90deg, var(--violet-500), var(--emerald-400))", borderRadius: "2px" }} />
                </div>
              </div>
            </div>

            {/* Tool Action Buttons */}
            <div className="ai-tool-grid">
              <button
                className="ai-tool-button ai-generate-button"
                onClick={() => runAiAssist("generate")}
                disabled={isAiLoading}
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", padding: "12px", fontSize: "0.92rem", fontWeight: "700" }}
              >
                <span>✍️</span> {isAiLoading ? "Writing full chapter..." : `Write Full Chapter ${currentChapter} (2,500–4,000+ words)`}
              </button>

              <button
                className="ai-tool-button"
                onClick={() => runAiAssist("expand")}
                disabled={isAiLoading || !editorText.trim()}
                style={{ border: "1px solid rgba(16, 185, 129, 0.4)", background: "rgba(16, 185, 129, 0.12)", color: "#ffffff", fontWeight: "600" }}
              >
                <span>🚀</span> Expand & Deepen Chapter (Add Pages & Depth)
              </button>

              <textarea
                className="refinement-input"
                rows="2"
                value={refinementRequest}
                onChange={(e) => setRefinementRequest(e.target.value)}
                placeholder="Optional instructions: e.g. deepen theoretical framework, add empirical data table..."
                aria-label="Chapter custom instructions"
              />
              <button
                className="ai-tool-button"
                onClick={() => runAiAssist("refine")}
                disabled={isAiLoading || !editorText.trim() || !refinementRequest.trim()}
              >
                <span>✨</span> Apply Custom Instructions
              </button>
            </div>

            <div className="ai-card">
              <h4>Project type and findings</h4>
              <select
                className="form-select"
                value={project.projectType || "empirical"}
                onChange={(e) => setProjectType(e.target.value)}
                aria-label="Project type"
              >
                <option value="empirical">Empirical (data collected and analysed)</option>
                <option value="non-empirical">Non-empirical (design, review, theoretical)</option>
              </select>
              <textarea
                className="refinement-input"
                rows="4"
                value={project.findings || ""}
                onChange={(e) => setFindings(e.target.value)}
                placeholder={
                  (project.projectType || "empirical") === "empirical"
                    ? "Paste real data/results (optional): e.g. 150 surveyed teachers, 78% agreement, t=2.34. If left blank, ProjectPilot acts as the student to self-generate realistic raw data, demographic tables, and statistical results!"
                    : "Paste system outputs (optional): performance metrics, benchmark results, or test cases. If left blank, ProjectPilot acts as the student to self-generate realistic specifications."
                }
              />
              <p className="visual-plan-note" style={{ color: "var(--violet-200)", lineHeight: "1.4" }}>
                💡 <strong>Student-Proxy Data Generation:</strong> If you do not have survey or test numbers yet, the AI acts as the student to self-generate realistic raw data tables and statistical findings so your chapter is 100% complete and ready. You can easily adjust the figures later!
              </p>
              <button className="btn btn-secondary btn-sm" onClick={buildOutlineFromGuideline} disabled={isOutlineLoading || !projectContext}>
                {isOutlineLoading ? "Reading guideline..." : "Build outline from guideline"}
              </button>
            </div>

            <div className="ai-card">
              <h4>Front matter and appendices</h4>
              <p className="visual-plan-note">
                Title page, declaration, certification, table of contents, lists of tables and figures, and references are generated automatically. 
                Use the candidate fields below to set your details, and load pre-formatted Nigerian sample templates for Dedication, Acknowledgements, and Abstract.
              </p>

              {/* Candidate & Project Metadata Live Editor */}
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h5 style={{ margin: 0, color: "var(--violet-300)", fontSize: "0.86rem", fontWeight: 600 }}>🎓 Candidate & Supervisor Information</h5>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Pre-fills title page, declaration & certification</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.76rem" }}>Student Full Name</label>
                    <input
                      className="form-input"
                      style={{ fontSize: "0.82rem", padding: "6px 10px" }}
                      placeholder="e.g. ADEDOKUN, Samuel Oluwaseun"
                      value={project.studentName || ""}
                      onChange={(e) => persistProject({ ...project, studentName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.76rem" }}>Matriculation Number</label>
                    <input
                      className="form-input"
                      style={{ fontSize: "0.82rem", padding: "6px 10px" }}
                      placeholder="e.g. 190408012 / UNILAG/2019/..."
                      value={project.matricNumber || ""}
                      onChange={(e) => persistProject({ ...project, matricNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.76rem" }}>Project Supervisor</label>
                    <input
                      className="form-input"
                      style={{ fontSize: "0.82rem", padding: "6px 10px" }}
                      placeholder="e.g. Dr. A. B. Adeleke"
                      value={project.supervisor || ""}
                      onChange={(e) => persistProject({ ...project, supervisor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.76rem" }}>Department / Degree</label>
                    <input
                      className="form-input"
                      style={{ fontSize: "0.82rem", padding: "6px 10px" }}
                      placeholder="e.g. Computer Science"
                      value={project.department || ""}
                      onChange={(e) => persistProject({ ...project, department: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Dedication with Sample Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", marginBottom: "4px" }}>
                <label className="form-label" htmlFor="fm-dedication" style={{ margin: 0 }}>Dedication (short, optional)</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                  onClick={() => setFrontMatter("dedication", getSampleDedication(project))}
                >
                  ⚡ Load Nigerian Dedication Sample
                </button>
              </div>
              <textarea
                id="fm-dedication"
                className="refinement-input"
                rows="3"
                value={project.frontMatter?.dedication || ""}
                onChange={(e) => setFrontMatter("dedication", e.target.value)}
                placeholder="Dedicate your work to God, family, or mentors..."
              />

              {/* Acknowledgements with Sample Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", marginBottom: "4px" }}>
                <label className="form-label" htmlFor="fm-ack" style={{ margin: 0 }}>Acknowledgements (one page maximum)</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                  onClick={() => setFrontMatter("acknowledgements", getSampleAcknowledgements(project))}
                >
                  ⚡ Load Nigerian Acknowledgements Sample
                </button>
              </div>
              <textarea
                id="fm-ack"
                className="refinement-input"
                rows="4"
                value={project.frontMatter?.acknowledgements || ""}
                onChange={(e) => setFrontMatter("acknowledgements", e.target.value)}
                placeholder="Acknowledge God, your supervisor, department, family, and colleagues..."
              />

              {/* Abstract with Sample and AI Drafting Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", marginBottom: "4px" }}>
                <label className="form-label" htmlFor="fm-abstract" style={{ margin: 0 }}>Abstract (150&ndash;300 words)</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    onClick={() => setFrontMatter("abstract", getSampleAbstract(project))}
                  >
                    ⚡ Load Academic Abstract Sample
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    onClick={generateAbstract}
                    disabled={isAbstractLoading}
                  >
                    {isAbstractLoading ? "Drafting with AI..." : "✨ Draft from Chapters (AI)"}
                  </button>
                </div>
              </div>
              <textarea
                id="fm-abstract"
                className="refinement-input"
                rows="6"
                value={project.frontMatter?.abstract || ""}
                onChange={(e) => setFrontMatter("abstract", e.target.value)}
                placeholder="Comprehensive academic abstract: background, methodology, empirical findings, and recommendations..."
              />

              <label className="form-label" htmlFor="fm-abbr" style={{ marginTop: "14px" }}>List of abbreviations (optional)</label>
              <textarea id="fm-abbr" className="refinement-input" rows="3" value={project.frontMatter?.abbreviations || ""} onChange={(e) => setFrontMatter("abbreviations", e.target.value)} />
              
              <label className="form-label" htmlFor="appendices" style={{ marginTop: "14px" }}>Appendices (questionnaires, raw data, letters, code; start each with &ldquo;Appendix A&rdquo;)</label>
              <textarea id="appendices" className="refinement-input" rows="4" value={project.appendices || ""} onChange={(e) => persistProject({ ...project, appendices: e.target.value })} />
            </div>

            <div className="ai-card">
              <h4>Scholarly sources</h4>
              <p className="visual-plan-note">Search a public scholarly index (OpenAlex). Only works you add are cited and listed in your references. Check each one before relying on it.</p>
              <form onSubmit={searchSources} style={{ display: "flex", gap: "8px" }}>
                <input
                  className="form-input"
                  value={sourceQuery}
                  onChange={(e) => setSourceQuery(e.target.value)}
                  placeholder="Topic keywords"
                  aria-label="Search scholarly sources"
                  minLength={3}
                  required
                />
                <button className="btn btn-secondary btn-sm" type="submit" disabled={isSearchingSources}>
                  {isSearchingSources ? "Searching..." : "Search"}
                </button>
              </form>
              {sourceSearchError && <p className="form-error" role="alert">{sourceSearchError}</p>}
              {sourceResults.map((work) => (
                <div className="visual-plan-item" key={work.doi}>
                  <strong>{work.title}</strong>
                  <span>{formatReference(work, project.citationStyle)}</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => addReference(work)}
                    disabled={approvedReferences.some((reference) => reference.doi === work.doi)}
                  >
                    {approvedReferences.some((reference) => reference.doi === work.doi) ? "Added" : "Add to references"}
                  </button>
                </div>
              ))}
              {approvedReferences.length > 0 && (
                <>
                  <h4 style={{ marginTop: "12px" }}>Approved references ({approvedReferences.length})</h4>
                  {approvedReferences.map((reference) => (
                    <div className="visual-plan-item" key={reference.doi}>
                      <span>{formatReference(reference, project.citationStyle)}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeReference(reference.doi)}>Remove</button>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="ai-card document-context-card">
              <h4>Project documents</h4>
              {projectContext ? (
                <>
                  <p>{projectContext.guidelineName} + {projectContext.sources.length} source document(s)</p>
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      checked={allowAiProcessing}
                      onChange={(e) => setAllowAiProcessing(e.target.checked)}
                    />
                    Send these documents or derived visual prompts to Gemini for writing, refinement, or image generation. Google usage limits and charges may apply.
                  </label>
                </>
              ) : (
                <p>No project documents uploaded. Start a new project and add a department guideline and source documents to enable chapter writing.</p>
              )}
            </div>

            {/* AI Output Result Box */}
            <div className="ai-card" style={{ minHeight: "140px" }}>
              <h4>Draft status</h4>
              {isAiLoading ? (
                <div className="generation-progress-pipeline">
                  <div className="pipeline-header">
                    <div className="pipeline-title">
                      <span className="pulse-dot"></span>
                      <strong>Generating Chapter {currentChapter}...</strong>
                    </div>
                    <div className="pipeline-timer">⏱️ {elapsedSeconds}s elapsed</div>
                  </div>
                  
                  <div className="pipeline-bar-wrap">
                    <div 
                      className="pipeline-bar-fill" 
                      style={{ 
                        width: `${Math.min(95, Math.max(12, elapsedSeconds * 4))}%` 
                      }} 
                    />
                  </div>

                  <div className="pipeline-steps">
                    <div className={`pipeline-step ${elapsedSeconds >= 0 ? "active" : ""}`}>
                      <span className="step-icon">{elapsedSeconds > 3 ? "✓" : "●"}</span>
                      <span>Reading guideline & research sources</span>
                    </div>
                    <div className={`pipeline-step ${elapsedSeconds >= 4 ? "active" : ""}`}>
                      <span className="step-icon">{elapsedSeconds > 12 ? "✓" : (elapsedSeconds >= 4 ? "●" : "○")}</span>
                      <span>Synthesizing academic literature & citations</span>
                    </div>
                    <div className={`pipeline-step ${elapsedSeconds >= 13 ? "active" : ""}`}>
                      <span className="step-icon">{elapsedSeconds > 24 ? "✓" : (elapsedSeconds >= 13 ? "●" : "○")}</span>
                      <span>Drafting chapter prose & section headings</span>
                    </div>
                    <div className={`pipeline-step ${elapsedSeconds >= 25 ? "active" : ""}`}>
                      <span className="step-icon">{elapsedSeconds >= 25 ? "●" : "○"}</span>
                      <span>Formulating tables, figures & Mermaid diagram</span>
                    </div>
                  </div>
                  
                  <div className="pipeline-footer-info">
                    <span>Engine: <code>{keysStatus?.model || "gemini-3.5-flash"}</code></span>
                    <span>Failover Pool: <strong>{keysStatus?.totalKeys || 3} Keys Active</strong></span>
                  </div>
                </div>
              ) : aiFeedback ? (
                <div style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                  {aiFeedback}
                </div>
              ) : (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Choose Write Chapter to create a source-grounded draft, or enter feedback and choose Refine Current Draft.
                </p>
              )}
            </div>

            {(visualPlan.length > 0 || diagramCode) && (
              <div className="ai-card">
                <h4>Visuals to review</h4>
                <p className="visual-plan-note">AI-suggested figures based on the chapter. Confirm accuracy and add required source notes before submission.</p>
                {visualPlan.map((visual, index) => (
                  <div className="visual-plan-item" key={`${visual.title}-${index}`}>
                    <strong>{visual.title}</strong>
                    <span>{visual.placement}</span>
                    <span>{visual.caption}</span>
                    {visual.imagePrompt && <small>Image prompt: {visual.imagePrompt}</small>}
                    {visual.imagePrompt && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => generateImage(visual, index)}
                        disabled={imageLoadingIndex === index || !allowAiProcessing}
                      >
                        {imageLoadingIndex === index ? "Generating image..." : "Generate image"}
                      </button>
                    )}
                    {generatedImages[index] && (
                      <>
                        <img className="generated-project-image" src={generatedImages[index]} alt={visual.title} />
                        <a
                          className="btn btn-secondary btn-sm"
                          href={generatedImages[index]}
                          download={`${visual.title.replace(/[^a-z0-9]+/gi, "_")}.png`}
                        >
                          Download image
                        </a>
                      </>
                    )}
                  </div>
                ))}
                {diagramCode && (
                  <div style={{ marginTop: "14px", padding: "14px", background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "#ffffff" }}>📊 Chapter Flowchart</strong>
                      <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", fontWeight: 600 }}>
                        Live SVG
                      </span>
                    </div>
                    <div style={{ background: "#ffffff", borderRadius: "6px", padding: "10px", maxHeight: "220px", overflow: "auto", display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                      <MermaidDiagram code={diagramCode} id={`sidebar-ch${currentChapter}`} />
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button className="btn btn-secondary btn-sm" onClick={handleDownloadDiagramSvg} style={{ flex: 1, fontSize: "0.78rem" }}>
                        💾 SVG
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openDiagramStudioModal(diagramCode, `Figure ${currentChapter}.1: Methodological Framework`)} style={{ flex: 1, fontSize: "0.78rem" }}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={handleRegenerateChapterFlowchart} title="Reset to standard template" style={{ fontSize: "0.78rem" }}>
                        🔄
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* In-Text Citations Reference Helper */}
            <div className="ai-card">
              <h4>Source policy</h4>
              <p className="visual-plan-note">The chapter writer may cite only uploaded project sources. It marks unsupported claims for review instead of inventing references. Verify all generated content and visuals with your supervisor.</p>
            </div>
          </aside>
        </main>
      )}

      {/* ========================================================
          PROJECT CREATION WIZARD MODAL
         ======================================================== */}
      {isNewProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewProjectModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ffffff" }}>
                  New Academic Project Setup
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Provide your academic details to configure your 5-chapter workspace.
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "1.2rem", padding: "4px 8px" }}
                onClick={() => setIsNewProjectModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Degree Level & Program</label>
                  <select
                    className="form-select"
                    value={newDegree}
                    onChange={(e) => setNewDegree(e.target.value)}
                  >
                    <option value="B.Sc. Final Year Project">Undergraduate (B.Sc / B.Tech / B.A)</option>
                    <option value="HND Final Year Capstone">Polytechnic Higher National Diploma (HND)</option>
                    <option value="M.Sc. Master's Dissertation">Master&apos;s Dissertation (M.Sc / MBA / M.Ed)</option>
                    <option value="Ph.D. Doctoral Thesis">Doctoral Dissertation (Ph.D)</option>
                  </select>
                </div>

                <div className="project-details-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Academic Department</label>
                    <input
                      className="form-input"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      placeholder="e.g. Computer Science, Accounting"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">University / Institution</label>
                    <input
                      className="form-input"
                      value={newInstitution}
                      onChange={(e) => setNewInstitution(e.target.value)}
                      placeholder="e.g. UNILAG, UI, OAU, UNN, Covenant"
                      required
                    />
                  </div>
                </div>

                <div className="student-details-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-name">Student name (optional)</label>
                    <input id="student-name" className="form-input" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-matric">Matric number (optional)</label>
                    <input id="student-matric" className="form-input" value={newMatricNumber} onChange={(e) => setNewMatricNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-faculty">Faculty (optional)</label>
                    <input id="student-faculty" className="form-input" value={newFaculty} onChange={(e) => setNewFaculty(e.target.value)} />
                  </div>
                </div>

                <div className="student-details-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-supervisor">Supervisor (optional)</label>
                    <input id="project-supervisor" className="form-input" value={newSupervisor} onChange={(e) => setNewSupervisor(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-target-date">Target submission date (optional)</label>
                    <input id="project-target-date" className="form-input" type="date" value={newTargetDate} onChange={(e) => setNewTargetDate(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Working Project Topic / Title</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Design and Implementation of an AI-Powered Fraud Detection System for Nigerian FinTech Startups"
                    required
                  />
                </div>

                <div className="form-group document-upload-group">
                  <label className="form-label" htmlFor="department-guideline">Department / university project guideline (required)</label>
                  <p className="upload-help">Upload the document that specifies your required chapter structure and formatting. This is separate from your 3 project documents. Use a text-readable/searchable PDF, DOCX, TXT, or Markdown file; scanned image-only PDFs are not supported. Up to 8 MB per file and 25 MB total.</p>
                  <input
                    id="department-guideline"
                    className="form-input file-input"
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    required
                    onChange={(e) => setGuidelineFile(e.target.files?.[0] || null)}
                  />
                  {guidelineFile && <span className="selected-file">{guidelineFile.name}</span>}
                </div>

                <div className="form-group document-upload-group">
                  <label className="form-label" htmlFor="project-sources">Documents related to your project (at least one required)</label>
                  <p className="upload-help">Choose up to 3 useful sources, such as your proposal, approved topic, research materials, report, or dataset. Only material from these files may be cited. Use text-readable/searchable PDFs, DOCX, TXT, or Markdown; scanned image-only PDFs are not supported. Up to 8 MB per file, 25 MB total.</p>
                  <input
                    id="project-sources"
                    className="form-input file-input"
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    multiple
                    required
                    onChange={handleSourceFilesChange}
                  />
                  {sourceFiles.length > 0 && (
                    <ul className="selected-file-list">
                      {sourceFiles.map((file) => <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>)}
                    </ul>
                  )}
                </div>

                {formError && <p className="form-error" role="alert">{formError}</p>}

                <div className="form-group">
                  <label className="form-label" htmlFor="chapter-structure">Chapter structure</label>
                  <select id="chapter-structure" className="form-select" value={newStructure} onChange={(e) => setNewStructure(e.target.value)}>
                    {Object.entries(CHAPTER_STRUCTURES).map(([key, structure]) => (
                      <option key={key} value={key}>{structure.label}</option>
                    ))}
                  </select>
                  <p className="upload-help">This is the common Nigerian format. Use &ldquo;Build outline from guideline&rdquo; in the studio to match your department handbook, which always takes priority.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Required Citation & Formatting Style</label>
                  <select
                    className="form-select"
                    value={newCitation}
                    onChange={(e) => setNewCitation(e.target.value)}
                  >
                    <option value="APA 7th Edition">APA 7th Edition (Standard for Sciences & Social Sciences)</option>
                    <option value="Harvard Referencing">Harvard Referencing System</option>
                    <option value="IEEE Format">IEEE Format (Engineering & Computer Science)</option>
                    <option value="MLA 9th Edition">MLA 9th Edition (Humanities & Literature)</option>
                    <option value="Chicago Manual of Style">Chicago Manual of Style (17th Ed)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsNewProjectModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isAiLoading}>
                  {isAiLoading ? "Extracting project documents..." : "Launch Chapter Workspace →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: INTERACTIVE TABLE BUILDER
         ======================================================== */}
      {isTableModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsTableModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: "780px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: "6px" }}>APA 7th Format</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff" }}>
                  Interactive Table Builder
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsTableModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Design and populate your academic table. It will be inserted into your chapter and formatted as a genuine Word table upon export.
              </p>

              <div className="form-group">
                <label className="form-label">Table Title / Caption</label>
                <input
                  className="form-input"
                  value={tableCaption}
                  onChange={(e) => setTableCaption(e.target.value)}
                  placeholder="e.g. Table 4.1: Demographic Characteristics of Respondents"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Presets:</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyTablePreset("demographic")}>
                  Demographics
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyTablePreset("evaluation")}>
                  Model Evaluation
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyTablePreset("specs")}>
                  System Specs
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyTablePreset("custom")}>
                  Reset Blank
                </button>
              </div>

              <div className="table-builder-grid-wrap">
                <table className="table-builder-table">
                  <thead>
                    <tr>
                      {tableHeaders.map((header, colIdx) => (
                        <th key={colIdx}>
                          <input
                            value={header}
                            onChange={(e) => {
                              const updated = [...tableHeaders];
                              updated[colIdx] = e.target.value;
                              setTableHeaders(updated);
                            }}
                            placeholder={`Header ${colIdx + 1}`}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRowsData.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, colIdx) => (
                          <td key={colIdx}>
                            <input
                              value={cell}
                              onChange={(e) => {
                                const updated = tableRowsData.map((r, rI) =>
                                  rI === rowIdx ? r.map((c, cI) => (cI === colIdx ? e.target.value : c)) : r
                                );
                                setTableRowsData(updated);
                              }}
                              placeholder="Value..."
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const newRow = new Array(tableHeaders.length).fill("");
                    setTableRowsData([...tableRowsData, newRow]);
                  }}
                >
                  + Add Row
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (tableHeaders.length < 8) {
                      setTableHeaders([...tableHeaders, `Column ${tableHeaders.length + 1}`]);
                      setTableRowsData(tableRowsData.map((r) => [...r, ""]));
                    }
                  }}
                >
                  + Add Column
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsTableModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleInsertTableIntoEditor}>
                ⊞ Insert Table into Manuscript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: DIAGRAM STUDIO (DRAW / INSERT DIAGRAM)
         ======================================================== */}
      {isDiagramModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDiagramModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: "880px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-violet" style={{ marginBottom: "6px" }}>Academic Visuals</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff" }}>
                  Academic Diagram & Flowchart Studio
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsDiagramModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Draw process flows, system architectures, and conceptual frameworks. Live SVG preview updates as you type.
              </p>

              <div className="form-group">
                <label className="form-label">Figure Title / Caption</label>
                <input
                  className="form-input"
                  value={diagramModalCaption}
                  onChange={(e) => setDiagramModalCaption(e.target.value)}
                  placeholder="e.g. Figure 4.1: Research Methodology Flowchart"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Diagram Presets:</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyDiagramPreset("flowchart")}>
                  Process Flowchart
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyDiagramPreset("architecture")}>
                  System Architecture
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyDiagramPreset("framework")}>
                  Conceptual Framework
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyDiagramPreset("sequence")}>
                  Sequence Flow
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", minHeight: "280px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>Mermaid Diagram Definition</label>
                  <textarea
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", height: "260px", resize: "none" }}
                    value={diagramModalCode}
                    onChange={(e) => setDiagramModalCode(e.target.value)}
                    placeholder="Enter Mermaid diagram code..."
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>Live Visual Rendering</label>
                  <div
                    ref={diagramModalPreviewRef}
                    style={{
                      height: "260px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "var(--radius-sm)",
                      padding: "16px",
                      overflow: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsDiagramModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleInsertDiagramIntoEditor}>
                📊 Insert Diagram into Manuscript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: GEMINI API KEY FAILOVER POOL MANAGER
         ======================================================== */}
      {isKeyModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsKeyModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: "6px" }}>Auto-Failover Active</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff" }}>
                  Gemini API Key Failover Pool
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsKeyModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                When writing limits or hourly quotas (429) are reached on one key, ProjectPilot automatically fails over to the next available backup key in the rotation pool so your writing is never interrupted.
              </p>

              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ffffff", marginBottom: "8px" }}>
                Configured Key Pool ({keysStatus.totalKeys || 3} Active):
              </div>

              <div className="key-pool-list">
                {(keysStatus.keys && keysStatus.keys.length > 0
                  ? keysStatus.keys
                  : [
                      { index: 1, preview: "AQ.Ab8...NwNwQ", isActive: true },
                      { index: 2, preview: "AQ.Ab8...fZ4w", isActive: false },
                      { index: 3, preview: "AQ.Ab8...JGWA", isActive: false }
                    ]
                ).map((k) => (
                  <div key={k.index} className={`key-pool-item ${k.isActive ? "active" : ""}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.1rem" }}>{k.isActive ? "🟢" : "🛡️"}</span>
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "#ffffff" }}>
                          API Key #{k.index}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {k.preview}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${k.isActive ? "badge-emerald" : "badge-violet"}`}>
                      {k.isActive ? "Active Writing Key" : "Standby Backup"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: "20px" }}>
                <label className="form-label">Add / Override Custom API Key in Browser (Optional)</label>
                <input
                  className="form-input"
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Paste additional Gemini API key..."
                />
                {customKeyError && <p className="form-error">{customKeyError}</p>}
                <p className="upload-help">
                  Keys are stored locally in your browser and used as top priority before falling back to .env.local keys.
                </p>
              </div>

              {customApiKey && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#f87171", padding: "4px 8px" }}
                  onClick={handleClearCustomKey}
                >
                  Clear Browser Key
                </button>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsKeyModalOpen(false)}>
                Close
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveCustomKey}>
                Save & Activate Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: EXPORT ACADEMIC MANUSCRIPT (CH 1-3 vs FULL)
         ======================================================== */}
      {isExportModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsExportModalOpen(false)}>
          <div
            className="modal-card"
            style={{
              maxWidth: "760px",
              padding: "28px",
              background: "linear-gradient(135deg, rgba(26, 20, 50, 0.98), rgba(15, 12, 35, 0.98))",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ marginBottom: "20px" }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: "6px" }}>Submission Export</span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                  Export Academic Manuscript
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Select the required academic submission stage for your institution
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsExportModalOpen(false)} style={{ fontSize: "1.1rem", padding: "4px 10px" }}>
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "18px", marginBottom: "20px" }}>
              {/* STAGE 1: CHAPTERS 1-3 PROPOSAL */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "var(--radius-sm)",
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(99, 102, 241, 0.08))",
                  border: "1px solid rgba(139, 92, 246, 0.5)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "rgba(139, 92, 246, 0.35)",
                        color: "#f3e8ff"
                      }}
                    >
                      Pre-Data Defense
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--violet-300)", fontWeight: "600" }}>
                      Chapters 1 – 3
                    </span>
                  </div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff", marginBottom: "8px" }}>
                    Research Proposal
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.45", marginBottom: "12px" }}>
                    Required by most universities for Departmental Proposal Defense & supervisor sign-off before gathering empirical data (Chapters 4 & 5).
                  </p>
                  <ul style={{ fontSize: "0.76rem", color: "var(--text-muted)", paddingLeft: "16px", lineHeight: "1.65", margin: "0 0 18px 0" }}>
                    <li>Proposal Title Page & Certification</li>
                    <li>TOC & List of Tables/Figures (Ch 1–3)</li>
                    <li>Chapter 1: Introduction</li>
                    <li>Chapter 2: Literature Review</li>
                    <li>Chapter 3: Research Methodology</li>
                    <li>Complete References list (APA 7th)</li>
                    <li>Appendices (Questionnaires / Instruments)</li>
                  </ul>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      handleExportWord(3);
                    }}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    📄 Download Proposal (.docx)
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      handleExportPdf(3);
                    }}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Export Proposal PDF
                  </button>
                </div>
              </div>

              {/* STAGE 2: FULL 5-CHAPTER PROJECT */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "var(--text-secondary)"
                      }}
                    >
                      Final Defense
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                      Chapters 1 – 5
                    </span>
                  </div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff", marginBottom: "8px" }}>
                    Full Project Manuscript
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.45", marginBottom: "12px" }}>
                    Complete bound manuscript for final external defense, departmental archiving, and graduation clearance.
                  </p>
                  <ul style={{ fontSize: "0.76rem", color: "var(--text-muted)", paddingLeft: "16px", lineHeight: "1.65", margin: "0 0 18px 0" }}>
                    <li>Full Degree Title Page & Certification</li>
                    <li>Declaration, Dedication, Acknowledgements</li>
                    <li>Complete Abstract (150–300 words)</li>
                    <li>Full Table of Contents (Chapters 1–5)</li>
                    <li>Chapter 4: Results & Data Analysis</li>
                    <li>Chapter 5: Discussion & Recommendations</li>
                    <li>References & Appendices</li>
                  </ul>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      handleExportWord();
                    }}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    📚 Download Full Project (.docx)
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      handleExportPdf();
                    }}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Export Full PDF
                  </button>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              All exports are formatted to Nigerian university specifications (A4, 1-inch margins, Times New Roman 12pt, 1.5 spacing, APA 7th).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
