// tools/gen-lessons.js
// Run: node tools/gen-lessons.js
const fs = require("fs");
const path = require("path");

const plan = [
  { odd: 6, total: 180 },
  { odd: 7, total: 144 },
  { odd: 8, total: 144 },
  { odd: 9, total: 144 },
];

function pad3(n) {
  return String(n).padStart(3, "0");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeIfMissing(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Created", filePath);
  }
}

for (const { odd, total } of plan) {
  const dir = path.join("lessons", String(odd));
  ensureDir(dir);

  for (let i = 1; i <= total; i++) {
    const cas = pad3(i);
    const fp = path.join(dir, `${cas}.json`);

    const template = {
      title: `Час ${cas}`,
      sections: [
        { type: "text", heading: "Вовед", content: "" },
        { type: "mcq", heading: "MCQ квиз", questions: [] },
        { type: "short", heading: "Краток одговор", questions: [] },
        { type: "dragmatch", heading: "Поврзи", pairs: [] }
      ]
    };

    writeIfMissing(fp, JSON.stringify(template, null, 2));
  }
}

console.log("Done ✅");
