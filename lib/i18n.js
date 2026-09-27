"use client";

import { createContext, useContext, useEffect, useState } from "react";

const dict = {
  ru: {
    appName: "Innowise HR",
    tagline: "Оценка кандидатов с помощью ИИ",
    navVacancy: "Вакансия",
    navCandidates: "Кандидаты",
    navStats: "Статистика",
    loading: "Загрузка…",
    back: "← Все кандидаты",

    vacancyTitle: "Активная вакансия",
    vacancyHint: "Вставьте описание вакансии. Все новые резюме будут оцениваться относительно него. Одновременно активна только одна вакансия — сохранение заменит текущую.",
    vacancyPlaceholder: "Например: Ищем бухгалтера с опытом работы от 3 лет, знание 1С, МСФО…",
    vacancySave: "Сохранить как активную",
    vacancySaving: "Сохранение…",
    vacancySaved: "Вакансия сохранена",
    vacancyUpdated: "Обновлено",
    vacancyNext: "Перейти к загрузке резюме →",
    vacancyEmpty: "Описание вакансии не может быть пустым",

    candTitle: "Кандидаты",
    candUploadTitle: "Загрузить резюме",
    candUploadHint: "Выберите один или несколько PDF-файлов. ИИ извлечёт имя, оценит соответствие вакансии и подготовит чек-лист для собеседования.",
    candChoose: "Выбрать PDF",
    candDrop: "или перетащите файлы сюда",
    candNoVacancy: "Сначала задайте активную вакансию.",
    candGoVacancy: "Задать вакансию",
    candProcessing: "Анализ…",
    candQueued: "В очереди",
    candDone: "Готово",
    candEmpty: "Пока нет кандидатов. Загрузите первые резюме.",
    colName: "Кандидат",
    colScore: "Оценка резюме",
    colSummary: "Кратко",
    colInterview: "Собеседование",
    disclaimer: "Оценка ИИ — это ориентир для рекрутера, а не решение. Окончательное решение принимает человек.",

    detailScore: "Оценка резюме",
    detailSummary: "Резюме оценки",
    detailStrengths: "Сильные стороны",
    detailWeaknesses: "Что уточнить / пробелы",
    detailFile: "Файл",
    notFound: "Кандидат не найден",
    checklistTitle: "Чек-лист собеседования",
    checklistHint: "Компетенции, предложенные ИИ для этого кандидата. Отредактируйте, удалите или добавьте свои. Оцените каждую: 1 — не знает, 5 — владеет отлично.",
    itemNamePlaceholder: "Название компетенции",
    notesPlaceholder: "Заметки (необязательно)",
    addItem: "+ Добавить пункт",
    removeItem: "Удалить",
    scoreLabels: ["Не знает", "Слабо", "Средне", "Хорошо", "Отлично"],
    saveInterview: "Сохранить собеседование",
    saving: "Сохранение…",
    interviewSaved: "Собеседование сохранено",
    currentAverage: "Текущий средний балл",
    errUnscored: "Оцените все пункты (1–5) перед сохранением",
    errNoItems: "Добавьте хотя бы один пункт",
    pastInterviews: "Сохранённые собеседования",
    interviewScore: "Балл собеседования",

    statsTitle: "Статистика",
    statsInterviews: "Собеседований",
    statsCandidates: "Кандидатов оценено",
    statsAvgCv: "Средняя оценка резюме",
    statsAvgInterview: "Средний балл собеседования",
    statsWeakest: "Самые слабые компетенции",
    statsWeakestHint: "Средний балл по всем собеседованиям. Показывает повторяющиеся пробелы в навыках кандидатов.",
    statsNoData: "Нет данных. Сохраните хотя бы одно собеседование.",
    statsTimes: "оценок",

    errors: {
      no_vacancy: "Нет активной вакансии",
      not_pdf: "Файл не PDF",
      no_file: "Файл не получен",
      pdf_unreadable: "Не удалось прочитать PDF",
      pdf_no_text: "В PDF нет текстового слоя (скан?). OCR не поддерживается.",
      ai_failed: "Ошибка ИИ",
      empty_description: "Описание вакансии не может быть пустым",
      network: "Ошибка сети",
      unscored_items: "Оцените все пункты (1–5)",
      no_items: "Добавьте хотя бы один пункт",
      generic: "Что-то пошло не так",
    },
  },
  en: {
    appName: "Innowise HR",
    tagline: "AI-assisted candidate evaluation",
    navVacancy: "Vacancy",
    navCandidates: "Candidates",
    navStats: "Statistics",
    loading: "Loading…",
    back: "← All candidates",

    vacancyTitle: "Active vacancy",
    vacancyHint: "Paste the job description. All new CVs will be evaluated against it. Only one vacancy is active at a time — saving replaces the current one.",
    vacancyPlaceholder: "E.g.: We are looking for an accountant with 3+ years of experience, 1C, IFRS…",
    vacancySave: "Save as active",
    vacancySaving: "Saving…",
    vacancySaved: "Vacancy saved",
    vacancyUpdated: "Updated",
    vacancyNext: "Go upload CVs →",
    vacancyEmpty: "The job description cannot be empty",

    candTitle: "Candidates",
    candUploadTitle: "Upload CVs",
    candUploadHint: "Select one or more PDF files. The AI extracts the name, scores the fit against the vacancy, and prepares an interview checklist.",
    candChoose: "Choose PDFs",
    candDrop: "or drag files here",
    candNoVacancy: "Set an active vacancy first.",
    candGoVacancy: "Set vacancy",
    candProcessing: "Analyzing…",
    candQueued: "Queued",
    candDone: "Done",
    candEmpty: "No candidates yet. Upload the first CVs.",
    colName: "Candidate",
    colScore: "CV score",
    colSummary: "Summary",
    colInterview: "Interview",
    disclaimer: "The AI score is guidance for the recruiter, not a decision. A human makes the final call.",

    detailScore: "CV score",
    detailSummary: "Evaluation summary",
    detailStrengths: "Strengths",
    detailWeaknesses: "Gaps / to clarify",
    detailFile: "File",
    notFound: "Candidate not found",
    checklistTitle: "Interview checklist",
    checklistHint: "Competencies the AI suggested for this candidate. Edit, remove, or add your own. Rate each one: 1 — knows nothing, 5 — masters it.",
    itemNamePlaceholder: "Competency name",
    notesPlaceholder: "Notes (optional)",
    addItem: "+ Add item",
    removeItem: "Remove",
    scoreLabels: ["None", "Weak", "Fair", "Good", "Expert"],
    saveInterview: "Save interview",
    saving: "Saving…",
    interviewSaved: "Interview saved",
    currentAverage: "Current average",
    errUnscored: "Rate every item (1–5) before saving",
    errNoItems: "Add at least one item",
    pastInterviews: "Saved interviews",
    interviewScore: "Interview score",

    statsTitle: "Statistics",
    statsInterviews: "Interviews",
    statsCandidates: "Candidates evaluated",
    statsAvgCv: "Average CV score",
    statsAvgInterview: "Average interview score",
    statsWeakest: "Weakest competencies",
    statsWeakestHint: "Average score across all interviews. Reveals recurring skill gaps among candidates.",
    statsNoData: "No data yet. Save at least one interview.",
    statsTimes: "ratings",

    errors: {
      no_vacancy: "No active vacancy",
      not_pdf: "Not a PDF file",
      no_file: "No file received",
      pdf_unreadable: "Could not read the PDF",
      pdf_no_text: "The PDF has no text layer (scanned?). OCR is not supported.",
      ai_failed: "AI error",
      empty_description: "The job description cannot be empty",
      network: "Network error",
      unscored_items: "Rate every item (1–5)",
      no_items: "Add at least one item",
      generic: "Something went wrong",
    },
  },
};

const LangContext = createContext({ lang: "ru", t: dict.ru, setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("ru");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "ru") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem("lang", next);
    } catch {}
  };

  return <LangContext.Provider value={{ lang, t: dict[lang], setLang }}>{children}</LangContext.Provider>;
}

export function useT() {
  return useContext(LangContext);
}

export function errorText(t, data) {
  const base = t.errors[data?.error] || t.errors.generic;
  return data?.detail ? `${base}: ${data.detail}` : base;
}
