import { readDb, updateDb, newId } from "@/lib/db";
import { pdfToText } from "@/lib/pdf";
import { evaluateCv, AiError } from "@/lib/gemini";
import { resolveStorageKey } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req) {
  const key = await resolveStorageKey(req);
  const db = await readDb(key);
  const latestInterview = {};
  for (const i of db.interviews) {
    const prev = latestInterview[i.candidateId];
    if (!prev || prev.createdAt < i.createdAt) latestInterview[i.candidateId] = i;
  }
  const candidates = db.candidates
    .map((c) => ({
      id: c.id,
      fileName: c.fileName,
      source: c.source || "ai",
      extractedName: c.extractedName,
      cvScore: c.cvScore,
      summary: c.summary,
      createdAt: c.createdAt,
      interviewScore: latestInterview[c.id]?.interviewScore ?? null,
      // Lets the "add manually" form reuse the previous manual candidate's
      // criteria for this vacancy, instead of always resetting to the
      // generic defaults — so manually-scored candidates stay comparable to
      // each other, not each judged on a different homemade rubric.
      ...(c.source === "manual" && c.manualCriteria?.length
        ? { criteriaNames: c.manualCriteria.map((cr) => cr.name) }
        : {}),
    }))
    .sort((a, b) => b.cvScore - a.cvScore);
  return Response.json({
    candidates,
    hasVacancy: Boolean(db.vacancy),
    vacancy: db.vacancy ? { summary: summarizeVacancy(db.vacancy.description) } : null,
  });
}

// First meaningful line of the job description — with only one active
// vacancy at a time, the recruiter needs a reminder of which role these
// candidates were scored against without going back to the vacancy page.
function summarizeVacancy(description) {
  const firstLine = description.split("\n").map((l) => l.trim()).find(Boolean) || "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine;
}

// One PDF per request: the client uploads files in parallel and gets
// per-file progress and errors.
export async function POST(req) {
  const key = await resolveStorageKey(req);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return fail("no_file", 400);

  const fileName = file.name;
  if (!fileName.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return fail("not_pdf", 400);
  }

  const { vacancy } = await readDb(key);
  if (!vacancy) return fail("no_vacancy", 400);

  let cvText;
  try {
    cvText = await pdfToText(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error("PDF parse failed", fileName, err);
    return fail("pdf_unreadable", 422);
  }
  if (cvText.replace(/\s/g, "").length < 50) return fail("pdf_no_text", 422);

  let evaluation;
  try {
    evaluation = await evaluateCv({ cvText, vacancy: vacancy.description });
  } catch (err) {
    console.error("AI evaluation failed", fileName, err);
    const detail = err instanceof AiError ? err.message : "Unexpected error";
    return fail("ai_failed", 502, detail);
  }

  const candidate = {
    id: newId(),
    fileName,
    ...evaluation,
    createdAt: new Date().toISOString(),
  };
  await updateDb(key, (db) => {
    db.candidates.push(candidate);
  });
  return Response.json({ candidate });
}

// Bulk delete: { ids: [...] } removes just those, { all: true } clears
// every candidate (and their interviews) for the current user/guest.
export async function DELETE(req) {
  const key = await resolveStorageKey(req);
  const { ids, all } = await req.json().catch(() => ({}));
  if (!all && (!Array.isArray(ids) || ids.length === 0)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const deleted = await updateDb(key, (db) => {
    const toDelete = all ? new Set(db.candidates.map((c) => c.id)) : new Set(ids);
    const before = db.candidates.length;
    db.candidates = db.candidates.filter((c) => !toDelete.has(c.id));
    db.interviews = db.interviews.filter((i) => !toDelete.has(i.candidateId));
    return before - db.candidates.length;
  });
  return Response.json({ deleted });
}

function fail(code, status, detail) {
  return Response.json({ error: code, detail }, { status });
}
