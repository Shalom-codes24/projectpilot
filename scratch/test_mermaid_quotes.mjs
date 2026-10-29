async function testMermaidRender() {
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "neutral" });

  const invalidCode = `graph TD
  A[1.1 Background (Context)] --> B[1.2 Problem Statement (Gap)]
  B --> C[1.3 Research Objectives & Questions]`;

  try {
    await mermaid.render("test-invalid", invalidCode);
    console.log("Invalid code rendered (unexpected)");
  } catch (err) {
    console.log("Confirmed: Invalid code FAILS with error:", err.message.slice(0, 100));
  }

  const validCode = `graph TD
  A["1.1 Background (Context)"] --> B["1.2 Problem Statement (Gap)"]
  B --> C["1.3 Research Objectives & Questions"]`;

  try {
    const res = await mermaid.render("test-valid", validCode);
    console.log("Confirmed: Valid quoted code RENDERS cleanly! SVG length:", res.svg.length);
  } catch (err) {
    console.log("Valid code failed:", err.message);
  }
}

testMermaidRender();
