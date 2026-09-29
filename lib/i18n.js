"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Russian needs three forms after a number (1 файл / 2 файла / 5 файлов),
// picked by the last digit, with 11–14 as exceptions.
function pluralRu(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const dict = {
  ru: {
    appName: "Innowise HR",
    tagline: "Оценка кандидатов с помощью ИИ",
    navHome: "Главная",

    homeEyebrow: "Инструмент для HR",
    homeTitle: "Отбор кандидатов с помощью ИИ — от резюме до собеседования",
    homeLead:
      "Innowise HR помогает небольшой команде подбора быстро разобрать поток резюме: ИИ оценивает каждое резюме относительно вакансии, строит рейтинг и готовит чек-лист для собеседования. Решение всегда остаётся за вами.",
    homeCta: "Начать с вакансии →",
    homeCtaSecondary: "К кандидатам",
    homeStepsTitle: "Как это работает",
    homeSteps: [
      {
        title: "Опишите вакансию",
        text: "Вставьте описание должности. Все резюме будут оцениваться относительно него. Одновременно активна одна вакансия.",
        href: "/vacancy",
        link: "Раздел «Вакансия»",
      },
      {
        title: "Загрузите резюме",
        text: "Один или несколько PDF. ИИ извлечёт имя, поставит оценку 0–100 и выделит сильные стороны и пробелы. Кандидата можно добавить и вручную, без ИИ.",
        href: "/candidates",
        link: "Раздел «Кандидаты»",
      },
      {
        title: "Проведите собеседование",
        text: "Откройте кандидата: чек-лист компетенций уже подготовлен под его пробелы. Отредактируйте его, оцените каждый пункт от 1 до 10 и сохраните.",
        href: "/candidates",
        link: "Открыть кандидатов",
      },
      {
        title: "Смотрите статистику",
        text: "Средние оценки и самые слабые компетенции по всем собеседованиям — видно, каких навыков систематически не хватает кандидатам.",
        href: "/stats",
        link: "Раздел «Статистика»",
      },
    ],
    homeGoodToKnow: "Важно знать",
    homeNotes: [
      "Оценка ИИ — это ориентир, а не решение. Модель не выносит вердикт «подходит/не подходит» и не учитывает пол, возраст, национальность и другие личные характеристики.",
      "Поддерживаются только PDF с текстовым слоем — сканы без распознанного текста прочитать нельзя.",
      "Бесплатный тариф ИИ ограничен: загружайте резюме партиями по 3–5. Если ИИ недоступен, добавьте кандидата вручную.",
    ],
    homeGuestNote: "Без входа в аккаунт всё работает, но данные исчезнут при перезагрузке страницы. Войдите, чтобы сохранять работу.",
    homeSignedInNote: "Вы вошли в аккаунт — ваша работа сохраняется.",
    navVacancy: "Вакансия",
    navCandidates: "Кандидаты",
    navStats: "Статистика",
    loading: "Загрузка…",
    back: "← Все кандидаты",

    authSignIn: "Войти",
    authSignUp: "Создать аккаунт",
    authSignOut: "Выйти",
    authEmail: "Email",
    authPassword: "Пароль",
    authSubmitSignIn: "Войти",
    authSubmitSignUp: "Создать аккаунт",
    authSwitchToSignUp: "Нет аккаунта? Создать",
    authSwitchToSignIn: "Уже есть аккаунт? Войти",
    authGuestNotice: "Вы не вошли в аккаунт — данные не сохранятся и исчезнут при перезагрузке страницы.",
    authSignedInAs: "Вы вошли как",
    authCheckEmail: "Проверьте почту — нужно подтвердить регистрацию, затем войдите.",
    authErrorGeneric: "Не удалось войти. Проверьте email и пароль.",

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
    candOr: "или",
    candAddManual: "Добавить вручную",
    candNoVacancy: "Сначала задайте активную вакансию.",
    candGoVacancy: "Задать вакансию",
    candProcessing: "Анализ…",
    candQueued: "В очереди",
    candDone: "Готово",
    candEmpty: "Пока нет кандидатов. Загрузите первые резюме или добавьте вручную.",
    colName: "Кандидат",
    colScore: "Оценка резюме",
    colSummary: "Кратко",
    colInterview: "Собеседование",
    disclaimer: "Оценка ИИ — это ориентир для рекрутера, а не решение. Окончательное решение принимает человек.",
    manualBadge: "Вручную",
    injectionBadge: "⚠️ Проверить",
    injectionWarning:
      "⚠️ В тексте резюме обнаружены фразы, похожие на попытку дать инструкции ИИ (например, «поставь максимальный балл»). Возможно, кандидат попытался вставить скрытый текст, чтобы повлиять на оценку. ИИ проигнорировал эти фразы при оценке, но рекомендуем вручную проверить исходный PDF.",

    manualFormTitle: "Добавить кандидата вручную",
    manualFormHint: "Заполните то, что знаете сами — без участия ИИ. Чек-лист собеседования можно будет добавить на странице кандидата.",
    manualCriteriaTitle: "Критерии оценки резюме",
    manualCriteriaHint: "Добавьте столько критериев, сколько нужно, и оцените каждый от 1 до 10. Итоговая оценка резюме считается как их среднее — не вводится вручную.",
    manualCriteriaBreakdown: "Из чего складывается оценка",
    manualCriterionPlaceholder: "Название критерия",
    manualAddCriterion: "+ Добавить критерий",
    manualRemoveCriterion: "Удалить критерий",
    manualCurrentScore: "Текущая оценка резюме",
    manualScoreFormula: (avg) => `среднее ${avg} из 10 × 10`,
    cvScoreAnchors: { 1: "Не знает совсем", 5: "Средне", 10: "Эксперт" },
    errNoCriteria: "Добавьте хотя бы один критерий",
    errUnscoredCriteria: "Оцените все критерии (1–10)",
    manualRescueHint: "Не дождались ИИ? Заполните эти поля сами — файл резюме останется прикреплён.",
    manualName: "Имя кандидата",
    manualNamePlaceholder: "Например: Иван Петров",
    manualDefaultCriteria: ["Опыт относительно вакансии", "Технические навыки", "Образование и сертификаты", "Общее соответствие вакансии"],
    manualSummary: "Краткое резюме (необязательно)",
    manualSummaryPlaceholder: "2–3 строки о кандидате",
    manualStrengths: "Сильные стороны (необязательно)",
    manualWeaknesses: "Что уточнить / пробелы (необязательно)",
    manualListHint: "Каждый пункт — с новой строки",
    manualSubmit: "Добавить кандидата",
    manualSubmitting: "Добавление…",
    manualCancel: "Отмена",

    selectAll: "Выбрать все",
    selectedCount: "Выбрано",
    deleteSelected: "Удалить выбранных",
    deleteAll: "Удалить всех",
    deleteOne: "Удалить кандидата",
    printButton: "Печать / PDF",
    deleteConfirmOne: (name) =>
      `Удалить кандидата «${name}»? Резюме и все его собеседования будут удалены без возможности восстановления.`,
    // 1–4 кандидата, 5+ кандидатов (винительный падеж, одушевлённое).
    deleteConfirmSelected: (n) =>
      `Удалить ${n} ${pluralRu(n, "кандидата", "кандидата", "кандидатов")}? Резюме и их собеседования будут удалены без возможности восстановления.`,
    deleteConfirmAll: (n) =>
      `Удалить всех кандидатов (${n})? Резюме и все собеседования будут удалены без возможности восстановления.`,
    deleteConfirmButton: "Да, удалить",
    deleteCancelButton: "Отмена",
    deleting: "Удаление…",

    detailScore: "Оценка резюме",
    detailSummary: "Резюме оценки",
    detailStrengths: "Сильные стороны",
    detailWeaknesses: "Что уточнить / пробелы",
    detailFile: "Файл",
    manualNote: "Эта карточка заполнена вручную рекрутером, без участия ИИ.",
    notFound: "Кандидат не найден",
    checklistTitle: "Чек-лист собеседования",
    checklistHint: "Компетенции, предложенные ИИ для этого кандидата. Отредактируйте, удалите или добавьте свои. Оцените каждую от 1 до 10 — итоговый балл собеседования считается как их среднее × 10, как и оценка резюме.",
    checklistHintManual: "Список пуст — этот кандидат добавлен вручную, без чек-листа от ИИ. Добавьте пункты сами. Оцените каждый от 1 до 10 — итоговый балл считается как их среднее × 10, как и оценка резюме.",
    itemNamePlaceholder: "Название компетенции",
    notesPlaceholder: "Заметки (необязательно)",
    addItem: "+ Добавить пункт",
    removeItem: "Удалить",
    scoreLabels: ["Не знает", "Слабо", "Средне", "Хорошо", "Отлично"],
    saveInterview: "Сохранить собеседование",
    saving: "Сохранение…",
    interviewSaved: "Собеседование сохранено",
    currentAverage: "Текущий средний балл",
    errUnscored: "Оцените все пункты (1–10) перед сохранением",
    errNoItems: "Добавьте хотя бы один пункт",
    pastInterviews: "Сохранённые собеседования",
    interviewScore: "Балл собеседования",

    statsTitle: "Статистика",
    statsInterviews: "Собеседований",
    statsCandidates: "Кандидатов оценено",
    statsAvgCv: "Средняя оценка резюме",
    statsAvgInterview: "Средний балл собеседования",
    statsWeakest: "Повторяющиеся пробелы в навыках",
    statsWeakestHint: "Средний балл по каждой компетенции среди всех сохранённых собеседований — не результат одного кандидата, а то, чего систематически не хватает всей группе. Похожие формулировки объединяются в один пункт.",
    statsVariants: (n) => `${n} ${pluralRu(n, "формулировка", "формулировки", "формулировок")}`,
    statsRankingTitle: "Итоговый рейтинг кандидатов",
    statsRankingHint: "Каждый кандидат, прошедший собеседование: оценка резюме, балл собеседования и их среднее — по нему и отсортирован список.",
    statsRankingCv: "Резюме",
    statsRankingInterview: "Собеседование",
    statsRankingOverall: "Итог",
    statsRankingEmpty: "Появится здесь, как только у кандидата будет и оценка резюме, и сохранённое собеседование.",
    activeVacancy: "Активная вакансия",
    activeVacancyChange: "Изменить",
    statsNoData: "Нет данных. Сохраните хотя бы одно собеседование.",
    statsTimes: "оценок",

    errors: {
      no_vacancy: "Нет активной вакансии",
      not_pdf: "Файл не PDF",
      no_file: "Файл не получен",
      file_too_large: "Файл слишком большой (максимум 4 МБ)",
      auth_failed: "Сессия истекла. Обновите страницу и войдите снова.",
      pdf_unreadable: "Не удалось прочитать PDF",
      pdf_no_text: "В PDF нет текстового слоя (скан?). OCR не поддерживается.",
      ai_failed: "Ошибка ИИ",
      empty_description: "Описание вакансии не может быть пустым",
      network: "Ошибка сети",
      unscored_items: "Оцените все пункты (1–10)",
      no_items: "Добавьте хотя бы один пункт",
      manual_missing_name: "Укажите имя кандидата",
      manual_no_criteria: "Добавьте хотя бы один критерий",
      manual_unscored_criteria: "Оцените все критерии (1–10)",
      generic: "Что-то пошло не так",
    },
  },
  en: {
    appName: "Innowise HR",
    tagline: "AI-assisted candidate evaluation",
    navHome: "Home",

    homeEyebrow: "A tool for HR",
    homeTitle: "AI-assisted candidate screening — from CV to interview",
    homeLead:
      "Innowise HR helps a small recruiting team get through a stack of CVs fast: the AI scores each CV against the vacancy, ranks candidates and prepares an interview checklist. The decision always stays with you.",
    homeCta: "Start with a vacancy →",
    homeCtaSecondary: "Go to candidates",
    homeStepsTitle: "How it works",
    homeSteps: [
      {
        title: "Describe the vacancy",
        text: "Paste the job description. Every CV is scored against it. One vacancy is active at a time.",
        href: "/vacancy",
        link: "Vacancy section",
      },
      {
        title: "Upload CVs",
        text: "One or more PDFs. The AI extracts the name, gives a 0–100 score and lists strengths and gaps. You can also add a candidate manually, without AI.",
        href: "/candidates",
        link: "Candidates section",
      },
      {
        title: "Run the interview",
        text: "Open a candidate: the competency checklist is already tailored to their gaps. Edit it, rate each item from 1 to 10 and save.",
        href: "/candidates",
        link: "Open candidates",
      },
      {
        title: "Check the statistics",
        text: "Average scores and the weakest competencies across all interviews — see which skills candidates are consistently missing.",
        href: "/stats",
        link: "Statistics section",
      },
    ],
    homeGoodToKnow: "Good to know",
    homeNotes: [
      "The AI score is guidance, not a decision. The model gives no fit/no-fit verdict and ignores gender, age, nationality and other personal characteristics.",
      "Only PDFs with a text layer are supported — scans without recognised text can't be read.",
      "The free AI tier is limited: upload CVs in batches of 3–5. If the AI is unavailable, add the candidate manually.",
    ],
    homeGuestNote: "Everything works without an account, but your data disappears on page reload. Sign in to keep your work.",
    homeSignedInNote: "You're signed in — your work is saved.",
    navVacancy: "Vacancy",
    navCandidates: "Candidates",
    navStats: "Statistics",
    loading: "Loading…",

    authSignIn: "Sign in",
    authSignUp: "Create account",
    authSignOut: "Sign out",
    authEmail: "Email",
    authPassword: "Password",
    authSubmitSignIn: "Sign in",
    authSubmitSignUp: "Create account",
    authSwitchToSignUp: "No account? Create one",
    authSwitchToSignIn: "Already have an account? Sign in",
    authGuestNotice: "You're not signed in — nothing will be saved, it's lost on page reload.",
    authSignedInAs: "Signed in as",
    authCheckEmail: "Check your email to confirm your account, then sign in.",
    authErrorGeneric: "Couldn't sign in. Check your email and password.",
    back: "← All candidates",

    vacancyTitle: "Active vacancy",
    vacancyHint: "Paste the job description. All new CVs will be evaluated against it. Only one vacancy is active at a time — saving replaces the current one.",
    vacancyPlaceholder: "E.g.: We're looking for an accountant with 3+ years of experience, QuickBooks, IFRS…",
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
    candOr: "or",
    candAddManual: "Add manually",
    candNoVacancy: "Set an active vacancy first.",
    candGoVacancy: "Set vacancy",
    candProcessing: "Analyzing…",
    candQueued: "Queued",
    candDone: "Done",
    candEmpty: "No candidates yet. Upload the first CVs or add one manually.",
    colName: "Candidate",
    colScore: "CV score",
    colSummary: "Summary",
    colInterview: "Interview",
    disclaimer: "The AI score is guidance for the recruiter, not a decision. A human makes the final call.",
    manualBadge: "Manual",
    injectionBadge: "⚠️ Review",
    injectionWarning:
      "⚠️ This CV's text contains phrasing that looks like an attempt to instruct the AI (e.g. \"give a perfect score\"). The candidate may have hidden text in the file to try to influence the evaluation. The AI ignored these phrases when scoring, but we recommend manually checking the original PDF.",

    manualFormTitle: "Add a candidate manually",
    manualFormHint: "Fill in what you know yourself — no AI involved. You can add an interview checklist later, on the candidate's page.",
    manualCriteriaTitle: "CV evaluation criteria",
    manualCriteriaHint: "Add as many criteria as you need and rate each one from 1 to 10. The overall CV score is their average — never typed in by hand.",
    manualCriteriaBreakdown: "What the score is made of",
    manualCriterionPlaceholder: "Criterion name",
    manualAddCriterion: "+ Add criterion",
    manualRemoveCriterion: "Remove criterion",
    manualCurrentScore: "Current CV score",
    manualScoreFormula: (avg) => `avg ${avg}/10 × 10`,
    cvScoreAnchors: { 1: "Knows nothing", 5: "Average", 10: "Expert" },
    errNoCriteria: "Add at least one criterion",
    errUnscoredCriteria: "Rate every criterion (1–10)",
    manualRescueHint: "AI didn't come through? Fill these in yourself — the CV file stays attached.",
    manualName: "Candidate name",
    manualNamePlaceholder: "E.g.: Jane Smith",
    manualDefaultCriteria: ["Relevant experience", "Technical skills", "Education & certificates", "Overall fit for the role"],
    manualSummary: "Short summary (optional)",
    manualSummaryPlaceholder: "2–3 lines about the candidate",
    manualStrengths: "Strengths (optional)",
    manualWeaknesses: "Gaps / questions to clarify (optional)",
    manualListHint: "One item per line",
    manualSubmit: "Add candidate",
    manualSubmitting: "Adding…",
    manualCancel: "Cancel",

    selectAll: "Select all",
    selectedCount: "Selected",
    deleteSelected: "Delete selected",
    deleteAll: "Delete all",
    deleteOne: "Delete candidate",
    printButton: "Print / PDF",
    deleteConfirmOne: (name) =>
      `Delete “${name}”? Their CV and all interviews will be permanently removed.`,
    deleteConfirmSelected: (n) =>
      `Delete ${n} candidate${n === 1 ? "" : "s"}? Their CVs and interviews will be permanently removed.`,
    deleteConfirmAll: (n) => `Delete all candidates (${n})? All CVs and interviews will be permanently removed.`,
    deleteConfirmButton: "Yes, delete",
    deleteCancelButton: "Cancel",
    deleting: "Deleting…",

    detailScore: "CV score",
    detailSummary: "Evaluation summary",
    detailStrengths: "Strengths",
    detailWeaknesses: "Gaps / questions to clarify",
    detailFile: "File",
    manualNote: "This card was filled in by hand by the recruiter — no AI involved.",
    notFound: "Candidate not found",
    checklistTitle: "Interview checklist",
    checklistHint: "Competencies the AI suggested for this candidate. Edit, remove, or add your own. Rate each one from 1 to 10 — the interview score is their average × 10, same as the CV score.",
    checklistHintManual: "Empty — this candidate was added manually, with no AI checklist. Add your own items. Rate each one from 1 to 10 — the score is their average × 10, same as the CV score.",
    itemNamePlaceholder: "Competency name",
    notesPlaceholder: "Notes (optional)",
    addItem: "+ Add item",
    removeItem: "Remove",
    scoreLabels: ["None", "Weak", "Fair", "Good", "Expert"],
    saveInterview: "Save interview",
    saving: "Saving…",
    interviewSaved: "Interview saved",
    currentAverage: "Current average",
    errUnscored: "Rate every item (1–10) before saving",
    errNoItems: "Add at least one item",
    pastInterviews: "Saved interviews",
    interviewScore: "Interview score",

    statsTitle: "Statistics",
    statsInterviews: "Interviews",
    statsCandidates: "Candidates evaluated",
    statsAvgCv: "Average CV score",
    statsAvgInterview: "Average interview score",
    statsWeakest: "Recurring skill gaps",
    statsWeakestHint: "Average score per competency across every saved interview — not any one candidate's result, but what the whole group is systematically missing. Similar wordings are merged into one entry.",
    statsVariants: (n) => `${n} wording${n === 1 ? "" : "s"}`,
    statsRankingTitle: "Final candidate ranking",
    statsRankingHint: "Every candidate who's had an interview: CV score, interview score, and their average — the list is sorted by it.",
    statsRankingCv: "CV",
    statsRankingInterview: "Interview",
    statsRankingOverall: "Overall",
    statsRankingEmpty: "Shows up here once a candidate has both a CV score and a saved interview.",
    activeVacancy: "Active vacancy",
    activeVacancyChange: "Change",
    statsNoData: "No data yet. Save at least one interview.",
    statsTimes: "ratings",

    errors: {
      no_vacancy: "No active vacancy",
      not_pdf: "Not a PDF file",
      no_file: "No file received",
      file_too_large: "File is too large (4 MB max)",
      auth_failed: "Your session expired. Refresh the page and sign in again.",
      pdf_unreadable: "Could not read the PDF",
      pdf_no_text: "The PDF has no text layer (scanned?). OCR is not supported.",
      ai_failed: "AI error",
      empty_description: "The job description cannot be empty",
      network: "Network error",
      unscored_items: "Rate every item (1–10)",
      no_items: "Add at least one item",
      manual_missing_name: "Enter the candidate's name",
      manual_no_criteria: "Add at least one criterion",
      manual_unscored_criteria: "Rate every criterion (1–10)",
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
