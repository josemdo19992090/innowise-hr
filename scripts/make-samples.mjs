// Generates demo CVs (Russian, Cyrillic text layer) into ./samples.
// Usage: node scripts/make-samples.mjs
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const FONT = process.env.CV_FONT || "C:/Windows/Fonts/arial.ttf";
const FONT_BOLD = process.env.CV_FONT_BOLD || "C:/Windows/Fonts/arialbd.ttf";

const cvs = [
  {
    file: "anna-smirnova.pdf",
    name: "Анна Смирнова",
    title: "Frontend-разработчик",
    sections: [
      ["Контакты", ["Минск · anna.smirnova@example.com · +375 29 000-00-01"]],
      ["Опыт работы", [
        "2021 – н.в. — Senior Frontend Developer, ООО «ТехноСофт»",
        "• Разработка SPA на React и Next.js для B2B-платформы (40 000 пользователей).",
        "• Перевела проект с JavaScript на TypeScript, покрытие тестами выросло с 20% до 75%.",
        "• Руководила командой из 3 разработчиков, проводила код-ревью.",
        "2018 – 2021 — Frontend Developer, «Веб Студия Плюс»",
        "• Вёрстка и разработка интернет-магазинов на React, Redux, REST API.",
      ]],
      ["Навыки", ["React, Next.js, TypeScript, Redux, Tailwind CSS, Jest, Playwright, Git, REST, GraphQL (базово)"]],
      ["Образование", ["БГУИР, программная инженерия, бакалавр, 2018"]],
      ["Языки", ["Русский — родной, английский — B2"]],
    ],
  },
  {
    file: "dmitry-kovalev.pdf",
    name: "Дмитрий Ковалёв",
    title: "Веб-разработчик",
    sections: [
      ["Контакты", ["Гомель · d.kovalev@example.com"]],
      ["Опыт работы", [
        "2022 – н.в. — Junior Frontend Developer, фриланс",
        "• Лендинги на HTML, CSS, jQuery для малого бизнеса.",
        "• Небольшие проекты на Vue.js.",
        "2016 – 2020 — Менеджер по продажам, «Торговый Дом»",
        "2020 – 2022 — перерыв",
      ]],
      ["Навыки", ["HTML, CSS, JavaScript, jQuery, Vue.js (базово), Figma, WordPress"]],
      ["Образование", ["Онлайн-курс «Frontend-разработчик», 2021", "ГГУ им. Скорины, экономика, 2016"]],
    ],
  },
  {
    file: "olga-ivanova.pdf",
    name: "Ольга Иванова",
    title: "Fullstack-разработчик",
    sections: [
      ["Контакты", ["Брест · olga.ivanova@example.com"]],
      ["Опыт работы", [
        "2020 – н.в. — Fullstack Developer, «ФинТех Решения»",
        "• Бэкенд на Node.js (Express, PostgreSQL), фронтенд на React.",
        "• Интеграция платёжных систем, разработка внутренних админ-панелей.",
        "2019 – 2020 — Стажёр-разработчик, «ИТ Лаб»",
      ]],
      ["Навыки", ["JavaScript, React, Node.js, Express, PostgreSQL, Docker, Git, CI/CD (GitLab)"]],
      ["Образование", ["БрГТУ, информатика, бакалавр, 2019"]],
      ["Сертификаты", ["AWS Certified Cloud Practitioner, 2023"]],
      ["Языки", ["Русский — родной, английский — B1"]],
    ],
  },
];

mkdirSync("samples", { recursive: true });

for (const cv of cvs) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(readFileSync(FONT), { subset: true });
  const bold = await doc.embedFont(readFileSync(FONT_BOLD), { subset: true });
  const page = doc.addPage([595, 842]);
  let y = 790;
  const line = (text, { f = font, size = 11, gap = 16, color = rgb(0.1, 0.1, 0.1), x = 50 } = {}) => {
    page.drawText(text, { x, y, size, font: f, color });
    y -= gap;
  };
  line(cv.name, { f: bold, size: 22, gap: 26 });
  line(cv.title, { size: 13, gap: 30, color: rgb(0.3, 0.3, 0.5) });
  for (const [heading, rows] of cv.sections) {
    line(heading.toUpperCase(), { f: bold, size: 11, gap: 18, color: rgb(0.2, 0.2, 0.6) });
    for (const r of rows) line(r, { size: 10.5, gap: 15 });
    y -= 10;
  }
  writeFileSync(`samples/${cv.file}`, await doc.save());
  console.log("wrote samples/" + cv.file);
}
