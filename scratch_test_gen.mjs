import fetch from "node-fetch";

async function testGeneration() {
  console.log("Testing full-blown chapter generation via /api/generate-chapter...");
  const payload = {
    mode: "generate",
    consent: true,
    project: {
      title: "Design and Implementation of an AI-Powered Healthcare Diagnostic System for Rural Clinics in Nigeria",
      institution: "Federal University of Technology, Akure",
      department: "Computer Science",
      degree: "B.Sc.",
      citationStyle: "APA"
    },
    chapter: {
      number: 1,
      title: "Chapter One: Introduction",
      sections: [
        "1.1 Background to the Study",
        "1.2 Statement of the Problem",
        "1.3 Aim and Objectives of the Study",
        "1.4 Research Questions",
        "1.5 Significance of the Study",
        "1.6 Scope and Delimitations",
        "1.7 Operational Definition of Terms"
      ],
      totalChapters: 5
    },
    projectType: "empirical",
    guideline: "Standard Nigerian university project format. Chapter 1 must include Background, Problem Statement, Objectives, Research Questions, Significance, Scope, and Definition of Terms. Thorough academic prose required.",
    sources: [
      {
        name: "WHO_Rural_Healthcare_Report.txt",
        content: "Primary healthcare centers in sub-Saharan Africa face severe physician shortages, with doctor-to-patient ratios averaging 1:5000 compared to the WHO recommended 1:600. Clinical decision support systems (CDSS) leveraging lightweight machine learning models can reduce diagnostic error rates by 42% in low-resource settings."
      }
    ],
    references: [],
    findings: ""
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
  console.log("SUCCESS!");
  console.log("Generated Word Count:", wordCount);
  console.log("Has Diagram:", Boolean(data.diagram));
  console.log("Diagram in content:", data.content.includes("```mermaid"));
  console.log("Has [PROJECT DETAIL NEEDED]:", data.content.includes("[PROJECT DETAIL NEEDED]"));
  console.log("Has [SOURCE NEEDED]:", data.content.includes("[SOURCE NEEDED]"));
  console.log("\n--- Preview first 600 chars ---");
  console.log(data.content.slice(0, 600));
  console.log("\n--- Preview last 400 chars ---");
  console.log(data.content.slice(-400));
}

testGeneration().catch(console.error);
