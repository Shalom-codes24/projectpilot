function initials(given = "") {
  return given
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
}

function splitName(name = "") {
  const parts = name.trim().split(/\s+/);
  const family = parts.pop() || "";
  return { family, given: parts.join(" ") };
}

function authorList(authors, style) {
  const names = authors.map(splitName).filter((name) => name.family);
  if (names.length === 0) return "";
  const format = (name) => (style.startsWith("IEEE") ? `${initials(name.given)} ${name.family}`.trim() : `${name.family}, ${initials(name.given)}`.replace(/,\s*$/, ""));
  if (names.length === 1) return format(names[0]);
  const formatted = names.map(format);
  const last = formatted.pop();
  if (style.startsWith("APA") && formatted.length > 19) return `${formatted.slice(0, 19).join(", ")}, ... ${last}`;
  return `${formatted.join(", ")}${style.startsWith("IEEE") ? " and " : ", & "}${last}`;
}

export function formatReference(reference, style = "APA 7th Edition") {
  const authors = authorList(reference.authors || [], style) || reference.title;
  const year = reference.year || "n.d.";
  const link = reference.doi ? ` https://doi.org/${reference.doi}` : reference.url ? ` ${reference.url}` : "";
  const venue = reference.venue ? ` ${reference.venue}.` : "";
  if (style.startsWith("IEEE")) {
    return `${authors}, "${reference.title}," ${reference.venue ? `${reference.venue}, ` : ""}${year}.${link}`.trim();
  }
  if (style.startsWith("Harvard")) {
    return `${authors} (${year}) '${reference.title}',${venue}${link}`.trim();
  }
  if (style.startsWith("MLA")) {
    return `${authors}. "${reference.title}."${venue} ${year}.${link}`.replace(/\s+/g, " ").trim();
  }
  return `${authors} (${year}). ${reference.title}.${venue}${link}`.replace(/\.\./g, ".").trim();
}

export function sortedReferences(references = [], style = "APA 7th Edition") {
  const formatted = references.map((reference) => formatReference(reference, style));
  return style.startsWith("IEEE") ? formatted.map((text, index) => `[${index + 1}] ${text}`) : [...formatted].sort((a, b) => a.localeCompare(b));
}
