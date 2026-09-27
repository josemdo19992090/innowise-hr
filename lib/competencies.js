// Interview checklist items are free text — written by the AI per candidate,
// or typed by the recruiter — so the same skill shows up as "SQL", "Знание
// SQL" and "Опыт работы с SQL". Comparing raw strings fragments the
// "weakest competencies" stat into useless groups of one, which is the whole
// point of that page. So names are reduced to their significant words and
// grouped by how much those overlap.
//
// This handles the common case (the same skill wrapped in different filler
// words), not true synonyms: "Лидерство в команде" and "Управление
// командой" stay apart, because merging on a single shared word would also
// merge "Английский язык" with "Русский язык". The UI shows which wordings
// were merged so the recruiter can see what the number is built from.

const STOPWORDS = new Set([
  // Russian filler that wraps a skill name
  "опыт", "опыта", "опыте", "работа", "работы", "работе", "работать", "знание", "знания", "знаний",
  "уровень", "уровня", "владение", "владения", "навык", "навыки", "навыков", "практический",
  "практическое", "практика", "понимание", "глубина", "подход", "подходы", "использование",
  "применение", "умение", "умения", "общий", "общие", "для", "при", "как", "что", "это", "или",
  // English equivalents
  "experience", "knowledge", "level", "skill", "skills", "understanding", "practical", "depth",
  "approach", "approaches", "working", "work", "usage", "using", "use", "ability", "general",
  "the", "and", "with", "for", "of", "in", "on", "to",
]);

const RU_SUFFIXES = [
  "ованием", "ования", "ованию", "ование", "ениями", "ения", "ению", "ение", "ений", "ами", "ями",
  "ыми", "ими", "ему", "ому", "ов", "ев", "ей", "ий", "ый", "ой", "ая", "ое", "ые", "ие", "их",
  "ых", "им", "ым", "ах", "ях", "ам", "ям", "ом", "ем", "ью", "ия", "ию",
  "а", "я", "ы", "и", "у", "ю", "е", "о", "й", "ь",
];

// Crude on purpose: enough to fold "тестирование"/"тестированию" together
// without a real morphology library. Suffix stripping alone is inconsistent
// across a word's forms (one form matches a long suffix, another doesn't),
// so Cyrillic stems are also cut to a common prefix — blunt, but it makes
// every form of a word land on the same key, which is all the grouping needs.
const RU_STEM_LENGTH = 6;

function stem(token) {
  if (/[а-я]/.test(token)) {
    let stemmed = token;
    for (const suffix of RU_SUFFIXES) {
      if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
        stemmed = token.slice(0, -suffix.length);
        break;
      }
    }
    return stemmed.slice(0, RU_STEM_LENGTH);
  }
  if (token.length > 6 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

export function tokenize(name) {
  const normalized = name
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const significant = words.filter((w) => w.length > 2 && !STOPWORDS.has(w)).map(stem);
  // A name made only of filler ("Опыт работы") keeps its words rather than
  // collapsing to an empty signature that would swallow every other one.
  return new Set(significant.length ? significant : words.map(stem));
}

function containment(a, b) {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared === 0 ? 0 : shared / Math.min(a.size, b.size);
}

const MERGE_THRESHOLD = 0.6;

export function groupCompetencies(entries) {
  // Exact same significant words → same bucket, before any fuzzy work.
  const buckets = new Map();
  for (const entry of entries) {
    const name = String(entry.name || "").trim();
    if (!name) continue;
    const tokens = tokenize(name);
    const signature = [...tokens].sort().join(" ");
    let bucket = buckets.get(signature);
    if (!bucket) {
      bucket = { tokens, scores: [], names: new Map() };
      buckets.set(signature, bucket);
    }
    bucket.scores.push(entry.score);
    bucket.names.set(name, (bucket.names.get(name) || 0) + 1);
  }

  // Biggest buckets become cluster anchors, so the most-used wording wins
  // the label and rarer phrasings attach to it.
  const ordered = [...buckets.values()].sort(
    (a, b) => b.scores.length - a.scores.length || a.tokens.size - b.tokens.size
  );

  const clusters = [];
  for (const bucket of ordered) {
    const target = clusters.find((c) => containment(c.tokens, bucket.tokens) >= MERGE_THRESHOLD);
    if (target) {
      target.scores.push(...bucket.scores);
      for (const [name, count] of bucket.names) target.names.set(name, (target.names.get(name) || 0) + count);
    } else {
      clusters.push({ tokens: bucket.tokens, scores: [...bucket.scores], names: new Map(bucket.names) });
    }
  }

  return clusters.map((cluster) => {
    const variants = [...cluster.names.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
      .map(([name]) => name);
    return {
      name: variants[0],
      variants,
      count: cluster.scores.length,
      average: cluster.scores.reduce((sum, s) => sum + s, 0) / cluster.scores.length,
    };
  });
}
