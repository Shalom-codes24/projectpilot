function rebuildAbstract(index) {
  if (!index || typeof index !== "object") return "";
  const words = [];
  for (const [word, positions] of Object.entries(index)) {
    if (Array.isArray(positions)) positions.forEach((position) => (words[position] = word));
  }
  return words.filter(Boolean).join(" ").slice(0, 1500);
}

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 3 || query.length > 200) {
    return Response.json({ error: "Enter a search of 3 to 200 characters." }, { status: 400 });
  }

  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", "10");
  url.searchParams.set("filter", "has_doi:true,type:article|book|book-chapter|dissertation");
  url.searchParams.set("select", "id,title,publication_year,doi,authorships,primary_location,abstract_inverted_index");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { Accept: "application/json" } });
    if (!response.ok) {
      return Response.json({ error: `The scholarly index returned status ${response.status}. Try again shortly.` }, { status: 502 });
    }
    const data = await response.json();
    const results = (data.results || [])
      .filter((work) => work.title && work.doi)
      .map((work) => ({
        id: work.id,
        title: String(work.title).slice(0, 300),
        year: work.publication_year || "",
        doi: String(work.doi).replace(/^https?:\/\/doi\.org\//i, ""),
        authors: (work.authorships || []).map((entry) => entry.author?.display_name).filter(Boolean).slice(0, 20),
        venue: work.primary_location?.source?.display_name || "",
        abstract: rebuildAbstract(work.abstract_inverted_index)
      }));
    return Response.json({ results });
  } catch {
    return Response.json({ error: "Could not reach the scholarly index. Check your connection and try again." }, { status: 502 });
  }
}
