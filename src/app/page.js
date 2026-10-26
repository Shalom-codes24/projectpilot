"use client";

import React, { useState, useEffect, useRef } from "react";
import { countChapterWords } from "../lib/word-count";
import { buildDocxBlob, buildPrintableHtml, manuscriptFileName } from "../lib/export-manuscript";
import { formatReference } from "../lib/references";
import { CHAPTER_STRUCTURES, buildChapters, exportWarnings } from "../lib/nigerian-format";

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
  frontMatter: {},
  appendices: "",
  references: [],
  supervisorNotes: []
};

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
  const [guidelineFile, setGuidelineFile] = useState(null);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [projectContext, setProjectContext] = useState(null);
  const [formError, setFormError] = useState("");
  const [allowAiProcessing, setAllowAiProcessing] = useState(false);
  const [visualPlan, setVisualPlan] = useState([]);
  const [diagramCode, setDiagramCode] = useState("");
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
    try {
      const saved = localStorage.getItem("projectpilot_project");
      if (saved) {
        const parsed = JSON.parse(saved);
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

  // Update editor text when current chapter changes
  useEffect(() => {
    if (project.chapters[currentChapter]) {
      setEditorText(project.chapters[currentChapter].content);
    }
  }, [currentChapter, project]);

  useEffect(() => {
    setVisualPlan([]);
    setDiagramCode("");
    setGeneratedImages({});
  }, [currentChapter]);

  useEffect(() => {
    if (!diagramCode || !diagramPreviewRef.current) return;
    let isMounted = true;
    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "dark" });
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

  // Total project word count
  const totalWords = Object.values(project.chapters).reduce((acc, ch) => {
    return acc + countChapterWords(`${ch.title || ""}\n${ch.content || ""}`);
  }, 0);

  // Overall project completion %
  const chaptersMeetingMinimum = Object.values(project.chapters).filter(
    (chapter) => countChapterWords(`${chapter.title || ""}\n${chapter.content || ""}`) >= 600
  ).length;
  const overallProgress = Math.round(
    (chaptersMeetingMinimum / Object.keys(project.chapters).length) * 100
  );

  // AI Assistant Actions
  const runAiAssist = async (actionType) => {
    if (actionType !== "generate" && actionType !== "refine") {
      setAiFeedback("Choose chapter writing or draft refinement.");
      return;
    }
    if (!projectContext?.guideline || !projectContext?.sources?.length) {
      setAiFeedback("Upload your department guideline and at least one project source document before generating a chapter.");
      return;
    }
    if (!allowAiProcessing) {
      setAiFeedback("Please confirm that you want your uploaded documents sent to Gemini for chapter writing or refinement.");
      return;
    }

    setIsAiLoading(true);
    setAiFeedback("");
    try {
      const response = await fetch("/api/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          draft: actionType === "refine" ? editorText : "",
          feedback: actionType === "refine" ? refinementRequest : "",
          consent: allowAiProcessing
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chapter generation failed.");
      const generatedWordCount = countChapterWords(`${project.chapters[currentChapter]?.title || ""}\n${result.content}`);
      if (generatedWordCount < 600) {
        throw new Error(`The generated draft contains ${generatedWordCount} words; at least 600 are required. Please try again.`);
      }
      setEditorText(result.content);
      setVisualPlan(result.visuals || []);
      setDiagramCode(result.diagram || "");
      const updatedProject = {
        ...project,
        chapters: {
          ...project.chapters,
          [currentChapter]: {
            ...project.chapters[currentChapter],
            content: result.content,
            progress: Math.max(project.chapters[currentChapter]?.progress || 0, 25)
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
      setAiFeedback(`Draft created with ${generatedWordCount.toLocaleString()} words. Review and edit it before submission. Citations are limited to your uploaded sources.`);
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

  const checkExportReady = () => {
    if (!project.id) {
      setActiveView("dashboard");
      return false;
    }
    const chaptersBelowMinimum = Object.entries(project.chapters)
      .filter(([, chapter]) => countChapterWords(`${chapter.title || ""}\n${chapter.content || ""}`) < 600)
      .map(([number]) => Number(number));
    if (chaptersBelowMinimum.length > 0) {
      setCurrentChapter(chaptersBelowMinimum[0]);
      setActiveView("studio");
      setAiFeedback(
        `Complete every chapter to at least 600 words before export. Chapters below the minimum: ${chaptersBelowMinimum.join(", ")}.`
      );
      return false;
    }
    const unresolved = Object.values(project.chapters).reduce(
      (count, chapter) => count + (chapter.content?.match(/\[(?:PROJECT DETAIL NEEDED|SOURCE NEEDED)[^\]]*\]/g)?.length || 0),
      0
    );
    const warnings = exportWarnings(project);
    if (unresolved > 0) {
      warnings.push(`${unresolved} placeholder(s) such as [PROJECT DETAIL NEEDED] or [SOURCE NEEDED] are still in your text.`);
    }
    if (warnings.length > 0 && !window.confirm(`Before exporting:\n\n• ${warnings.join("\n• ")}\n\nExport anyway?`)) {
      return false;
    }
    return true;
  };

  const handleExportWord = async () => {
    if (!checkExportReady()) return;

    try {
      const blob = await buildDocxBlob(project);
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${manuscriptFileName(project)}.docx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      setAiFeedback(`Could not create the DOCX file: ${error.message}`);
    }
  };

  const handleExportPdf = () => {
    if (!checkExportReady()) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setAiFeedback("Allow pop-ups for this page, then choose Export PDF again.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildPrintableHtml(project));
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
    setTimeout(() => printWindow.print(), 500);
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
                    <li><button className="footer-link" onClick={handleExportWord}>Word .docx Export</button></li>
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

              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <button className="btn btn-secondary btn-sm" onClick={handleExportWord}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Export Full Project (.docx)</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}>
                  <span>Export PDF</span>
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveView("studio")}>
                  <span>Continue Writing →</span>
                </button>
              </div>
            </div>

            {/* DASHBOARD STATS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
              <div className="glass-card" style={{ padding: "20px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Total Words Written</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  {totalWords.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "var(--violet-400)" }}>words</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--emerald-400)", marginTop: "4px" }}>
                  Counted across your saved chapters
                </div>
              </div>

              <div className="glass-card" style={{ padding: "20px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Manuscript Completion</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  {overallProgress}%
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--cyan-400)", marginTop: "4px" }}>
                  {chaptersMeetingMinimum} of {Object.keys(project.chapters).length} chapters meet the 600-word minimum
                </div>
              </div>

              <div className="glass-card" style={{ padding: "20px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Supervisor Status</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  {project.supervisorNotes.filter((n) => !n.resolved).length} Pending
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--amber-400)", marginTop: "4px" }}>
                  Supervisor: {project.supervisor}
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
                            {chapterWords.toLocaleString()} words • {meetsMinimum ? "minimum met" : "below 600-word minimum"}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span
                            className={`badge ${meetsMinimum ? "badge-emerald" : "badge-violet"}`}
                          >
                            {meetsMinimum ? "Ready for review" : "In progress"}
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
                    <button className="btn btn-secondary btn-sm" onClick={handleExportWord}>
                      Download Word Manuscript (.docx)
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}>
                      Export PDF
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
                        fontSize: "0.75rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "var(--text-secondary)"
                      }}
                    >
                      {countChapterWords(`${ch?.title || ""}\n${ch?.content || ""}`) >= 600 ? "✓ 600+" : `${countChapterWords(`${ch?.title || ""}\n${ch?.content || ""}`)}/600`}
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
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <strong>{wordCount.toLocaleString()}</strong> / 600 minimum • ~{readTime} min read
                </span>
                <button className="btn btn-secondary btn-sm" onClick={handleExportWord}>
                  Export DOCX
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}>
                  Export PDF
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

            {/* Editable Content Box */}
            <div className="editor-content-box">
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

              <textarea
                className="editor-textarea"
                value={editorText}
                onChange={handleEditorChange}
                placeholder="Generate a chapter from your uploaded project documents, then review and refine the draft here..."
              />
              <div className={`word-count-status ${wordCount >= 600 ? "meets-minimum" : ""}`} aria-live="polite">
                {wordCount >= 600
                  ? `✓ Minimum met (${wordCount.toLocaleString()} words, excluding the reference list)`
                  : `${(600 - wordCount).toLocaleString()} more words needed to reach the 600-word minimum`}
              </div>
            </div>
          </section>

          {/* RIGHT SIDEBAR: AI ACADEMIC ASSISTANT */}
          <aside className="workspace-ai-panel">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "1.1rem" }}>🤖</span>
                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff" }}>
                  AI Academic Copilot
                </h3>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Draft chapters from your project documents, then review and refine the work.
              </p>
            </div>

            {/* Tool Action Buttons */}
            <div className="ai-tool-grid">
              <button className="ai-tool-button ai-generate-button" onClick={() => runAiAssist("generate")} disabled={isAiLoading}>
                <span>✍️</span> {isAiLoading ? "Writing chapter..." : `Write Chapter ${currentChapter} (600+ words)`}
              </button>
              <textarea
                className="refinement-input"
                rows="3"
                value={refinementRequest}
                onChange={(e) => setRefinementRequest(e.target.value)}
                placeholder="How should the AI revise this draft? e.g. clarify the research gap"
                aria-label="Chapter refinement instructions"
              />
              <button className="ai-tool-button" onClick={() => runAiAssist("refine")} disabled={isAiLoading || !editorText.trim()}>
                <span>🔁</span> Refine Current Draft
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
                rows="5"
                value={project.findings || ""}
                onChange={(e) => setFindings(e.target.value)}
                placeholder={
                  (project.projectType || "empirical") === "empirical"
                    ? "Paste your real results: analysed tables, statistics, interview themes. Results chapters use only this text."
                    : "Paste your real outputs: design decisions, system description, argument, or review conclusions."
                }
              />
              <p className="visual-plan-note">The writer will not invent results. Anything missing here is marked for you to supply.</p>
              <button className="btn btn-secondary btn-sm" onClick={buildOutlineFromGuideline} disabled={isOutlineLoading || !projectContext}>
                {isOutlineLoading ? "Reading guideline..." : "Build outline from guideline"}
              </button>
            </div>

            <div className="ai-card">
              <h4>Front matter and appendices</h4>
              <p className="visual-plan-note">Title page, declaration, certification, table of contents, lists of tables and figures (from &ldquo;Table 4.1 ...&rdquo; captions), and references are built automatically. Write the pages below in your own words; they appear in the export only when filled in.</p>
              <label className="form-label" htmlFor="fm-dedication">Dedication (short, optional)</label>
              <textarea id="fm-dedication" className="refinement-input" rows="2" value={project.frontMatter?.dedication || ""} onChange={(e) => setFrontMatter("dedication", e.target.value)} />
              <label className="form-label" htmlFor="fm-ack">Acknowledgements (one page maximum)</label>
              <textarea id="fm-ack" className="refinement-input" rows="4" value={project.frontMatter?.acknowledgements || ""} onChange={(e) => setFrontMatter("acknowledgements", e.target.value)} />
              <label className="form-label" htmlFor="fm-abstract">Abstract (150&ndash;300 words; write it last)</label>
              <textarea id="fm-abstract" className="refinement-input" rows="6" value={project.frontMatter?.abstract || ""} onChange={(e) => setFrontMatter("abstract", e.target.value)} />
              <button className="btn btn-secondary btn-sm" onClick={generateAbstract} disabled={isAbstractLoading}>
                {isAbstractLoading ? "Drafting abstract..." : "Draft abstract from my chapters"}
              </button>
              <label className="form-label" htmlFor="fm-abbr">List of abbreviations (optional)</label>
              <textarea id="fm-abbr" className="refinement-input" rows="3" value={project.frontMatter?.abbreviations || ""} onChange={(e) => setFrontMatter("abbreviations", e.target.value)} />
              <label className="form-label" htmlFor="appendices">Appendices (questionnaires, raw data, letters, code; start each with &ldquo;Appendix A&rdquo;)</label>
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--violet-300)", fontSize: "0.88rem" }}>
                  <span className="pulse-dot"></span>
                  <span>Writing chapter and checking the 600-word minimum...</span>
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
                  <details className="diagram-details">
                    <summary>View project diagram source</summary>
                    <div className="diagram-preview" ref={diagramPreviewRef} />
                    <button className="btn btn-secondary btn-sm" onClick={downloadDiagram}>
                      Download diagram (SVG)
                    </button>
                    <pre>{diagramCode}</pre>
                    <p>Mermaid diagram source; verify the flow and labels against your project before use.</p>
                  </details>
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
    </div>
  );
}
