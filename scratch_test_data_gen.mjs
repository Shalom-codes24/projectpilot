import fetch from "node-fetch";

async function testDataGeneration() {
  console.log("Testing Chapter 4 Data Analysis generation with empty student findings...");
  const payload = {
    mode: "generate",
    consent: true,
    project: {
      title: "Impact of Artificial Intelligence Diagnostic Tools on Clinical Decision-Making in Nigerian Teaching Hospitals",
      institution: "University of Ibadan",
      department: "Health Informatics & Public Health",
      degree: "B.Sc.",
      citationStyle: "APA"
    },
    chapter: {
      number: 4,
      title: "Chapter Four: Results and Data Analysis",
      sections: [
        "4.1 Response Rate and Demographic Characteristics of Respondents",
        "4.2 Presentation and Analysis of Research Questions",
        "4.3 Test of Research Hypotheses",
        "4.4 Discussion of Findings"
      ],
      totalChapters: 5
    },
    projectType: "empirical",
    guideline: "Standard university project format. Chapter 4 must present empirical findings, statistical tables, hypothesis tests, and discussion.",
    sources: [
      {
        name: "Study_Protocol.txt",
        content: "A cross-sectional survey was administered to clinicians and medical laboratory scientists across tertiary healthcare institutions."
      }
    ],
    references: [],
    findings: "" // Student left findings completely empty!
  };

  const res = await fetch("http://localhost:3000/api/generate-chapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Error from API:", res.status, data);
    return;
  }

  const wordCount = data.content.split(/\s+/).filter(Boolean).length;
  console.log("\n================ TEST RESULTS ================");
  console.log("Generated Word Count:", wordCount);
  console.log("Has Tables (| Column |):", data.content.includes("|") && data.content.includes("---"));
  console.log("Has [PROJECT DETAIL NEEDED]:", data.content.includes("[PROJECT DETAIL NEEDED]"));
  console.log("Has [SOURCE NEEDED]:", data.content.includes("[SOURCE NEEDED]"));
  console.log("Mentions Sample/Respondents (e.g. N = or respondents):", /respondents|sample\s+size|N\s*=|questionnaire/i.test(data.content));
  
  // Extract table snippets
  const tables = data.content.match(/\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+/g);
  console.log("Number of Data Tables Generated:", tables ? tables.length : 0);
  if (tables && tables.length > 0) {
    console.log("\n--- Sample Generated Data Table ---");
    console.log(tables[0]);
  }

  console.log("\n--- Sample Analysis Paragraph ---");
  const paragraphs = data.content.split(/\n{2,}/).filter(p => !p.startsWith("#") && !p.startsWith("|") && p.length > 150);
  if (paragraphs.length > 0) {
    console.log(paragraphs[0].slice(0, 400) + "...");
  }
}

testDataGeneration().catch(console.error);
