export function countChapterWords(text = "") {
  const chapterText = text.split(/^\s*(?:\d+(?:\.\d+)*[.)]?\s*)?(?:references|bibliography|reference list|list of references)\s*:?\s*$/im)[0];
  return chapterText.trim().split(/\s+/).filter(Boolean).length;
}
