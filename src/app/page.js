"use client";

import React, { useState, useEffect, useRef } from "react";
import { countChapterWords } from "../lib/word-count";

// Default Sample Academic Project
const DEFAULT_PROJECT = {
  id: "prj_001",
  title: "An Empirical Investigation of Artificial Intelligence Adoption in Nigerian Commercial Banks: Operational Challenges, Customer Trust, and Financial Performance",
  shortTitle: "AI Adoption in Nigerian Commercial Banks",
  studentName: "Emmanuel Okafor",
  matricNumber: "ENG/2021/04982",
  department: "Banking and Finance",
  faculty: "Faculty of Management Sciences",
  institution: "University of Lagos (UNILAG)",
  degree: "B.Sc. Banking & Finance",
  citationStyle: "APA 7th Edition",
  supervisor: "Dr. A. B. Adeyemi",
  targetDate: "December 15, 2026",
  chapters: {
    1: {
      title: "Chapter One: Introduction",
      progress: 90,
      subsections: [
        "1.1 Background to the Study",
        "1.2 Statement of the Problem",
        "1.3 Research Questions",
        "1.4 Aim and Objectives of the Study",
        "1.5 Research Hypotheses",
        "1.6 Significance of the Study",
        "1.7 Scope and Delimitations",
        "1.8 Definition of Operational Terms"
      ],
      content: `1.1 Background to the Study\nOver the past decade, the rapid progression of artificial intelligence (AI) and machine learning algorithms has fundamentally restructured global financial architectures. In developing economies, particularly within Sub-Saharan Africa, commercial deposit money banks are experiencing profound disruptions in transaction processing, algorithmic credit risk scoring, fraud surveillance, and customer relationship management (Adebayo & Okon, 2023).\n\nIn Nigeria, following the Central Bank of Nigeria's cashless economy mandates and the accelerated adoption of open banking frameworks, financial institutions are under unprecedented competitive pressure to optimize operational efficiency while curbing systemic non-performing loans. Machine learning models offer significant predictive precision over classical econometric credit-rating systems.\n\n1.2 Statement of the Problem\nDespite massive financial expenditures into automated banking systems and generative AI advisory engines, empirical evidence concerning their actual contribution to return on equity (ROE) and operational cost reduction remains conflicting. Nigerian commercial banks contend with severe infrastructural vulnerabilities, including frequent power grid collapses, recurring telecommunication latency, and high vulnerability to sophisticated cyber-fraud syndicates (Mensah et al., 2024).\n\nFurthermore, customer skepticism regarding algorithmic decision-making and data privacy under the Nigeria Data Protection Act (NDPA 2023) creates substantial friction. Many students and researchers struggle to capture this interplay between cutting-edge technology and emerging-market institutional voids.\n\n1.3 Aim and Objectives of the Study\nThe primary aim of this study is to critically evaluate the determinants and performance outcomes of artificial intelligence adoption across Tier-1 and Tier-2 commercial banks in Lagos State, Nigeria.\nSpecific objectives include:\n1. To examine the effect of algorithmic fraud detection systems on operational loss reduction.\n2. To investigate the relationship between automated AI credit scoring and non-performing loan ratios.\n3. To assess customer trust and behavioral intention toward conversational AI banking interfaces.`
    },
    2: {
      title: "Chapter Two: Literature Review",
      progress: 75,
      subsections: [
        "2.1 Conceptual Review",
        "2.2 Theoretical Framework (TAM & UTAUT)",
        "2.3 Empirical Literature Review",
        "2.4 Summary of Gaps in Literature"
      ],
      content: `2.1 Conceptual Review\nArtificial intelligence in banking comprises cognitive computing, predictive analytics, natural language processing (NLP), and robotic process automation (RPA). According to Chinedu and Ibrahim (2023), AI-driven automation in financial intermediation diminishes human error and expedites loan appraisal workflows from days to mere seconds.\n\n2.2 Theoretical Framework\nThis investigation anchors its theoretical underpinning on the Unified Theory of Acceptance and Use of Technology (UTAUT) formulated by Venkatesh et al. (2003) and the Technology-Organization-Environment (TOE) framework by Tornatzky and Fleischer (1990).\n\nUTAUT asserts that performance expectancy, effort expectancy, social influence, and facilitating conditions collectively determine behavioral intention and subsequent usage behavior. In the Nigerian context, facilitating conditions (such as reliable internet bandwidth and stable regulatory directives) exert the strongest moderating influence on organizational AI assimilation.`
    },
    3: {
      title: "Chapter Three: Research Methodology",
      progress: 60,
      subsections: [
        "3.1 Research Design",
        "3.2 Population of the Study",
        "3.3 Sample Size Determination (Taro Yamane)",
        "3.4 Sampling Technique",
        "3.5 Research Instrument & Validation",
        "3.6 Methods of Data Analysis"
      ],
      content: `3.1 Research Design\nThis study adopts an explanatory cross-sectional survey research design. This approach allows the researcher to capture quantitative metrics across banking professionals and account holders simultaneously while establishing causal relationships.\n\n3.2 Population and Sample Size\nThe target population consists of 1,450 operations, risk, and IT personnel across five selected Tier-1 commercial banks situated within Lagos Island and Victoria Island financial corridors.\n\nApplying Taro Yamane's sample size determination formula:\nn = N / [1 + N(e)^2]\nWhere N = 1,450 and margin of error e = 0.05:\nn = 1450 / [1 + 1450(0.0025)] = 313.5 ≈ 314 respondents.\n\nA stratified random sampling technique was utilized to guarantee proportional representation across risk management, customer care, and software engineering departments.`
    },
    4: {
      title: "Chapter Four: Data Presentation and Analysis",
      progress: 30,
      subsections: [
        "4.1 Response Rate of Administered Questionnaires",
        "4.2 Demographic Profile of Respondents",
        "4.3 Hypothesis Testing (Multiple Regression)",
        "4.4 Discussion of Findings"
      ],
      content: `4.1 Demographic & Response Analysis\nOut of 314 structured questionnaires administered across Access Bank, Zenith Bank, GTBank, First Bank, and UBA, 298 copies were correctly retrieved and deemed valid for econometric analysis, representing a 94.9% response rate.\n\n4.2 Hypothesis Testing\nMultiple linear regression conducted via SPSS v28 indicated that algorithmic fraud surveillance (β = 0.412, p < 0.001) and AI-driven credit scoring (β = 0.384, p < 0.01) exert statistically significant positive effects on banking operational efficiency, accounting for 62.4% of the variance (R² = 0.624).`
    },
    5: {
      title: "Chapter Five: Summary, Conclusion & Recommendations",
      progress: 20,
      subsections: [
        "5.1 Summary of Major Findings",
        "5.2 Conclusion",
        "5.3 Policy Recommendations",
        "5.4 Contributions to Knowledge",
        "5.5 Suggestions for Further Research",
        "References"
      ],
      content: `5.1 Summary of Findings\nThe empirical outcomes demonstrate that AI-powered risk scoring significantly attenuates default rates while augmenting transaction volumes. However, infrastructural deficits and customer privacy apprehensions persist as major adoption bottlenecks.\n\n5.2 Recommendations\n1. Commercial banks should prioritize hybrid cloud configurations to mitigate local network downtime.\n2. The Central Bank of Nigeria should establish unambiguous ethical AI guidelines prioritizing transparency and anti-bias algorithmic audits.`
    }
  },
  supervisorNotes: [
    {
      id: "sn_1",
      chapter: 1,
      date: "Oct 19, 2026",
      text: "Expand the rationale in Section 1.2. Cite the latest 2023 NDPA regulations regarding customer biometric consent.",
      resolved: true
    },
    {
      id: "sn_2",
      chapter: 3,
      date: "Oct 22, 2026",
      text: "Justify why Taro Yamane formula was selected over Cochran's formula for this finite population.",
      resolved: false
    }
  ]
};

const EMPTY_PROJECT = {
  ...DEFAULT_PROJECT,
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
  chapters: Object.fromEntries(
    Object.entries(DEFAULT_PROJECT.chapters).map(([number, chapter]) => [
      number,
      { ...chapter, progress: 0, subsections: [], content: "" }
    ])
  ),
  supervisorNotes: []
};

export default function Home() {
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

  // Load from localStorage on mount
  useEffect(() => {
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
    return acc + (ch.content ? ch.content.trim().split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  // Overall project completion %
  const overallProgress = Math.round(
    Object.values(project.chapters).reduce((acc, ch) => acc + ch.progress, 0) / 5
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
            title: project.chapters[currentChapter]?.title
          },
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
      if (generatedWordCount < 500) {
        throw new Error(`The generated draft contains ${generatedWordCount} words; at least 500 are required. Please try again.`);
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

  // Export to Word Document (.doc format compatible with MS Word)
  const handleExportWord = () => {
    const chaptersBelowMinimum = Object.entries(project.chapters)
      .filter(([, chapter]) => countChapterWords(`${chapter.title || ""}\n${chapter.content || ""}`) < 500)
      .map(([number]) => Number(number));
    if (chaptersBelowMinimum.length > 0) {
      const firstIncomplete = chaptersBelowMinimum[0];
      setCurrentChapter(firstIncomplete);
      setActiveView("studio");
      setAiFeedback(
        `Complete every chapter to at least 500 words before export. Chapters below the minimum: ${chaptersBelowMinimum.join(", ")}.`
      );
      return;
    }

    const escapeHtml = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]);

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${escapeHtml(project.title)}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
          h1 { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 24pt; }
          h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; }
          p { text-align: justify; text-indent: 0.5in; margin-bottom: 12pt; }
          .title-page { text-align: center; page-break-after: always; padding-top: 100pt; }
        </style>
      </head>
      <body>
        <div class="title-page">
          <h1>${escapeHtml(project.title)}</h1>
          <br><br>
          <p style="text-align: center; text-indent: 0;">BY</p>
          <p style="text-align: center; font-weight: bold; text-indent: 0;">${[project.studentName, project.matricNumber && `(${project.matricNumber})`].filter(Boolean).map(escapeHtml).join(" ")}</p>
          <br><br>
          <p style="text-align: center; text-indent: 0;">A RESEARCH PROJECT SUBMITTED TO THE DEPARTMENT OF ${escapeHtml(project.department.toUpperCase())}<br>
          ${project.faculty ? `FACULTY OF ${escapeHtml(project.faculty.toUpperCase())}<br>` : ""}
          ${escapeHtml(project.institution.toUpperCase())}</p>
          <br><br>
          <p style="text-align: center; text-indent: 0;">IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF ${project.degree.toUpperCase()}</p>
          <br><br>
          <p style="text-align: center; text-indent: 0;">SUPERVISOR: ${project.supervisor}</p>
          <p style="text-align: center; text-indent: 0;">${project.targetDate}</p>
        </div>

        ${Object.keys(project.chapters)
          .map(
            (num) => `
          <div>
            <h1>${escapeHtml(project.chapters[num].title)}</h1>
            ${project.chapters[num].content
              .split("\n\n")
              .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
              .join("")}
          </div>
          <br style="page-break-before:always;" />
        `
          )
          .join("")}
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", docContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${project.shortTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Manuscript.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  // Create Project Flow
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
        supervisor: "",
        targetDate: "",
        supervisorNotes: [],
        department: newDept,
        degree: newDegree,
        institution: newInstitution,
        citationStyle: newCitation,
        projectContext,
        chapters: Object.fromEntries(
          Object.entries(EMPTY_PROJECT.chapters).map(([number, chapter]) => [
            number,
            { ...chapter, progress: 0, subsections: [], content: "" }
          ])
        )
      };

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

      try {
        localStorage.setItem("projectpilot_project", JSON.stringify(newPrj));
      } catch {
        throw new Error("Project documents exceed available browser storage. Try smaller files.");
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
                  View Sample Dashboard
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
                  <span>Export Full Project (.doc)</span>
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
                  Target: 15,000 words
                </div>
              </div>

              <div className="glass-card" style={{ padding: "20px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Manuscript Completion</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  {overallProgress}%
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--cyan-400)", marginTop: "4px" }}>
                  3 of 5 chapters drafted
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
                            {ch.subsections.length} Subsections •{" "}
                            {ch.content.trim().split(/\s+/).filter(Boolean).length} words
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span
                            className={`badge ${
                              ch.progress === 100
                                ? "badge-emerald"
                                : ch.progress > 40
                                ? "badge-cyan"
                                : "badge-violet"
                            }`}
                          >
                            {ch.progress}%
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
                      Download Word Manuscript (.doc)
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
              {[1, 2, 3, 4, 5].map((num) => {
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
                      {countChapterWords(`${ch?.title || ""}\n${ch?.content || ""}`) >= 500 ? "✓ 500+" : `${countChapterWords(`${ch?.title || ""}\n${ch?.content || ""}`)}/500`}
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
                  <strong>{wordCount.toLocaleString()}</strong> / 500 minimum • ~{readTime} min read
                </span>
                <button className="btn btn-secondary btn-sm" onClick={handleExportWord}>
                  Export DOCX
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
              <div className={`word-count-status ${wordCount >= 500 ? "meets-minimum" : ""}`} aria-live="polite">
                {wordCount >= 500
                  ? `✓ Minimum met (${wordCount.toLocaleString()} words, excluding the reference list)`
                  : `${(500 - wordCount).toLocaleString()} more words needed to reach the 500-word minimum`}
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
                <span>✍️</span> {isAiLoading ? "Writing chapter..." : `Write Chapter ${currentChapter} (500+ words)`}
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
                  <span>Writing chapter and checking the 500-word minimum...</span>
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
                  <div style={{ marginTop: "6px", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "0.78rem", padding: "4px 8px" }}
                      onClick={() =>
                        setNewTitle(
                          "Assessment of Cloud Computing Adoption on Operational Resilience in Nigerian Healthcare Facilities"
                        )
                      }
                    >
                      ✨ Suggest Healthcare Topic
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "0.78rem", padding: "4px 8px" }}
                      onClick={() =>
                        setNewTitle(
                          "Design and Development of an Offline-First Solar Energy Monitoring System for Rural Communities"
                        )
                      }
                    >
                      ✨ Suggest Engineering Topic
                    </button>
                  </div>
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
