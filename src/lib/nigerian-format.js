export const DEFAULT_FORMATTING = {
  font: "Times New Roman",
  fontSizePt: "12",
  lineSpacing: "1.5",
  margins: "1 inch",
  citationStyle: ""
};

const STANDARD_CHAPTERS = [
  {
    title: "Chapter One: Introduction",
    sections: [
      "1.1 Background of the Study",
      "1.2 Statement of the Problem",
      "1.3 Aim and Objectives",
      "1.4 Research Questions / Hypotheses",
      "1.5 Significance of the Study",
      "1.6 Scope and Limitations",
      "1.7 Definition of Terms"
    ]
  },
  {
    title: "Chapter Two: Literature Review",
    sections: [
      "2.1 Conceptual Framework",
      "2.2 Theoretical Framework",
      "2.3 Review of Related Studies",
      "2.4 Summary and Research Gap"
    ]
  },
  {
    title: "Chapter Three: Research Methodology",
    sections: [
      "3.1 Research Design",
      "3.2 Population of the Study",
      "3.3 Sample and Sampling Technique",
      "3.4 Instrument for Data Collection",
      "3.5 Validity and Reliability",
      "3.6 Procedure for Data Collection",
      "3.7 Method of Data Analysis"
    ]
  },
  {
    title: "Chapter Four: Results / Data Analysis",
    sections: [
      "4.1 Presentation of Data",
      "4.2 Statistical Analysis",
      "4.3 Interpretation of Findings"
    ]
  },
  {
    title: "Chapter Five: Summary, Conclusion and Recommendations",
    sections: [
      "5.1 Summary of Findings",
      "5.2 Conclusion",
      "5.3 Recommendations",
      "5.4 Suggestions for Further Research"
    ]
  }
];

// Six-chapter variant used by some engineering and computer science departments.
const ENGINEERING_CHAPTERS = [
  STANDARD_CHAPTERS[0],
  STANDARD_CHAPTERS[1],
  STANDARD_CHAPTERS[2],
  {
    title: "Chapter Four: System Design and Implementation",
    sections: ["4.1 System Analysis", "4.2 System Design", "4.3 System Implementation"]
  },
  {
    title: "Chapter Five: Testing, Results and Discussion",
    sections: ["5.1 System Testing", "5.2 Results", "5.3 Discussion"]
  },
  {
    title: "Chapter Six: Conclusion and Recommendations",
    sections: ["6.1 Summary", "6.2 Conclusion", "6.3 Recommendations", "6.4 Suggestions for Further Research"]
  }
];

export const CHAPTER_STRUCTURES = {
  standard: { label: "Standard five chapters", chapters: STANDARD_CHAPTERS },
  engineering: { label: "Six chapters (engineering / computer science)", chapters: ENGINEERING_CHAPTERS }
};

export function buildChapters(structure = "standard") {
  const template = (CHAPTER_STRUCTURES[structure] || CHAPTER_STRUCTURES.standard).chapters;
  return Object.fromEntries(
    template.map((chapter, index) => [
      index + 1,
      { title: chapter.title, subsections: [...chapter.sections], content: "", progress: 0 }
    ])
  );
}

// Approved Nigerian order. `author` pages hold the student's own words and are never invented.
export const PRELIMINARY_PAGES = [
  { key: "declaration", label: "Declaration", match: ["declaration"], kind: "standard" },
  { key: "certification", label: "Certification", match: ["certification", "certificate"], kind: "standard" },
  { key: "dedication", label: "Dedication", match: ["dedication"], kind: "author" },
  { key: "acknowledgements", label: "Acknowledgements", match: ["acknowledg"], kind: "author" },
  { key: "abstract", label: "Abstract", match: ["abstract"], kind: "author" },
  { key: "contents", label: "Table of Contents", match: ["contents"], kind: "generated" },
  { key: "tables", label: "List of Tables", match: ["tables"], kind: "generated" },
  { key: "figures", label: "List of Figures", match: ["figures"], kind: "generated" },
  { key: "abbreviations", label: "List of Abbreviations", match: ["abbreviation"], kind: "author" }
];

const AWARDS = [
  [/^b\.?\s?sc/i, "Bachelor of Science (B.Sc.)"],
  [/^b\.?\s?(?:tech|eng)/i, "Bachelor of Technology/Engineering"],
  [/^hnd/i, "Higher National Diploma (HND)"],
  [/^m\.?\s?sc/i, "Master of Science (M.Sc.)"],
  [/^ph\.?\s?d/i, "Doctor of Philosophy (Ph.D.)"]
];

export function awardName(degree = "") {
  const match = AWARDS.find(([pattern]) => pattern.test(degree.trim()));
  return match ? match[1] : degree;
}

export function formatMonthYear(value = "") {
  const parsed = /^(\d{4})-(\d{2})/.exec(value);
  if (!parsed) return value;
  const month = new Date(Date.UTC(Number(parsed[1]), Number(parsed[2]) - 1, 1)).toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
  return `${month}, ${parsed[1]}`;
}

const SMALL_WORDS = new Set(["a", "an", "the", "of", "and", "in", "on", "for", "to", "with", "by", "at", "or", "from", "as"]);

export function toTitleCase(text) {
  return text
    .split(" ")
    .map((word, index) => {
      if (!word || /[A-Z]/.test(word.slice(1))) return word;
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

const CAPTION_PATTERN = /^\s*(Table|Figure)\s+\d+(?:\.\d+)*\s*[:.\-–]?\s+\S.{0,150}$/i;

export function collectCaptions(chapters) {
  const tables = [];
  const figures = [];
  for (const chapter of Object.values(chapters)) {
    for (const line of (chapter.content || "").split("\n")) {
      if (!CAPTION_PATTERN.test(line) || /[,;]$/.test(line.trim())) continue;
      (/^\s*table/i.test(line) ? tables : figures).push(line.trim());
    }
  }
  return { tables, figures };
}

export function requiredPages(project) {
  const listed = (project.preliminaryPages || []).map((name) => name.toLowerCase());
  const { tables, figures } = collectCaptions(project.chapters || {});
  const frontMatter = project.frontMatter || {};
  return PRELIMINARY_PAGES.filter((page) => {
    const inGuideline = listed.some((name) => page.match.some((word) => name.includes(word)));
    if (page.key === "tables") return tables.length > 0;
    if (page.key === "figures") return figures.length > 0;
    if (page.kind === "author") return Boolean(frontMatter[page.key]?.trim());
    if (listed.length > 0) return inGuideline;
    return true;
  });
}

export function exportWarnings(project) {
  const warnings = [];
  const listed = (project.preliminaryPages || []).map((name) => name.toLowerCase());
  const abstractRequired = listed.length === 0 || listed.some((name) => name.includes("abstract"));
  if (abstractRequired && !project.frontMatter?.abstract?.trim()) {
    warnings.push("The abstract is missing (150–300 words; write it last).");
  }
  const titleWords = (project.title || "").trim().split(/\s+/).filter(Boolean).length;
  if (titleWords > 23) warnings.push(`The title has ${titleWords} words; 20–23 is recommended.`);
  if (!project.supervisor) warnings.push("No supervisor is set for the certification page.");
  if (!project.studentName || !project.matricNumber) warnings.push("The student name or matric number is missing from the title page.");
  const abstractWords = (project.frontMatter?.abstract || "").trim().split(/\s+/).filter(Boolean).length;
  if (abstractWords > 0 && (abstractWords < 150 || abstractWords > 300)) {
    warnings.push(`The abstract has ${abstractWords} words; 150–300 is expected.`);
  }
  return warnings;
}

export function getSampleDedication(project = {}) {
  return `This project is dedicated to the Almighty God, the fountain of all wisdom, knowledge, and understanding, whose grace, mercy, and divine protection sustained me throughout the duration of this academic programme.\n\nIt is also affectionately dedicated to my beloved parents and family members, whose unconditional love, continuous prayers, moral guidance, and selfless sacrifices laid the solid foundation for my academic accomplishments.`;
}

export function getSampleAcknowledgements(project = {}) {
  const supervisor = project.supervisor || "[Supervisor's Name]";
  const dept = project.department || "Computer Science";
  const institution = project.institution || "the University";
  return `First and foremost, I offer my profound adoration to the Almighty God for His divine grace, strength, and guidance in bringing this project to a successful completion.\n\nI express my heartfelt gratitude to my project supervisor, ${supervisor}, for the scholarly guidance, meticulous reviews, valuable critiques, and inspiring mentorship provided throughout the course of this research.\n\nMy sincere appreciation goes to the Head of Department and the esteemed academic and administrative staff of the Department of ${dept}, ${institution}, for imparting knowledge and maintaining high academic standards.\n\nI am deeply indebted to my loving parents, siblings, and family for their enduring support, prayers, and sacrifices. Finally, I appreciate my friends, colleagues, and coursemates for their camaraderie, constructive discussions, and solidarity throughout this academic journey.`;
}

export function getSampleAbstract(project = {}) {
  const title = project.title || "this study";
  const dept = project.department || "the respective field";
  return `This study examines the conceptual, methodological, and empirical dimensions of ${title} in the context of contemporary developments within Nigeria. The research addresses critical operational challenges, evaluating systemic efficacy and proposing sustainable optimization mechanisms.\n\nEmploying an empirical investigative design, relevant data were gathered through structured instruments and analyzed in conformity with standard departmental guidelines. Descriptive and inferential evaluations were conducted to establish relationships between key variables and validate operational assumptions.\n\nThe findings reveal that targeted structural interventions significantly enhance operational efficiency, while identifying key infrastructural and institutional constraints that impede optimal performance. The empirical outcomes underscore the necessity of adopting structured frameworks to resolve prevailing bottlenecks.\n\nConsequently, the study recommends strategic policy improvements, enhanced stakeholder training, and continuous monitoring frameworks to foster sustainable performance and practical adoption across ${dept} and related institutions.`;
}

