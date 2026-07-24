const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "symbols");
const files = fs.readdirSync(dir).filter(f => /\.(gif|png|jpe?g)$/i.test(f));

const entries = [];
const skipped = [];
for (const f of files) {
  const m = f.match(/^[0-9_]+(.+)\.(gif|png|jpe?g)$/i);
  if (!m) { skipped.push(f); continue; }
  entries.push({ file: f, label: m[1] });
}

entries.sort((a, b) => a.file.localeCompare(b.file, "ja"));

fs.writeFileSync(path.join(__dirname, "symbols.json"), JSON.stringify(entries));
console.log("entries:", entries.length, "skipped:", skipped.length);
if (skipped.length) console.log(skipped.slice(0, 20));
