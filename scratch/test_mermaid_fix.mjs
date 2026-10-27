import { sanitizeOrConvertMermaid } from "../src/lib/diagram-utils.js";

const test1 = `
+---------------------------------------------------------------------------------------------------+
| METHODOLOGICAL FRAMEWORK STRUCTURE |
+---------------------------------------------------------------------------------------------------+
| [3.2 Research Design] --> Ex-Post Facto & Descriptive Survey Design |
| [3.3 Study Population] --> 12,450 SSS 2 & SSS 3 Students across 18 Public Schools in AMAC |
| [3.4 Sample & Sampling] --> Taro Yamane Formula (n = 387 -> 390) via Multi-Stage Stratification|
| [3.5 Instrumentation] --> CCAPQ Questionnaire + Pro-Forma Academic Achievement Records |
| [3.6 Validity & Reliability]--> Expert Face/Content Validity & Cronbach's Alpha (r = 0.84) |
| [3.7 Data Collection] --> Direct On-Site Field Administration with 2 Trained Assistants |
| [3.8 Data Analysis] --> Descriptive (Mean/SD) & Inferential (PPMC, t-test, Chi-Square) |
+---------------------------------------------------------------------------------------------------+
`;

const test2 = `
flowchart TD
  [3.2 Research Design] --> Ex-Post Facto & Descriptive Survey Design
  [3.3 Study Population] --> 12,450 Students
`;

const test3 = `
graph TD
  A[1.1 Background (Context)] --> B[1.2 Problem Statement (Gap)]
  B --> C[1.3 Research Objectives & Questions]
`;

console.log("=== Test 1 (ASCII box) ===");
console.log(sanitizeOrConvertMermaid(test1));

console.log("\n=== Test 2 (flowchart with bracket IDs) ===");
console.log(sanitizeOrConvertMermaid(test2));

console.log("\n=== Test 3 (graph with unquoted parentheses) ===");
console.log(sanitizeOrConvertMermaid(test3));
