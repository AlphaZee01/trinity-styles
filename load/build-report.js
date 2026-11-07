const fs = require("fs");
const path = require("path");

const reports = path.join("load", "reports");
const one = JSON.parse(fs.readFileSync(path.join(reports, "one.json"), "utf8"));
const fifty = JSON.parse(fs.readFileSync(path.join(reports, "fifty.json"), "utf8"));

const pages = [
  ["home", "Home"],
  ["shop", "Shop"],
  ["product", "Product"],
  ["cart", "Bag"],
  ["login", "Login"],
];

function count(data, name) {
  const metric = data.metrics[name];
  if (!metric) return 0;
  return metric.values.count || 0;
}

function values(data, name) {
  return data.metrics[name] ? data.metrics[name].values : null;
}

function ms(value) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

function phaseBlock(data, key, title, detail) {
  const started = count(data, `visits_started_${key}`);
  const finished = count(data, `visits_finished_${key}`);
  const cutOff = Math.max(0, started - finished);
  let answered = 0;
  let timedOut = 0;
  let httpFailed = 0;
  let missing = 0;
  const rows = pages
    .map(([page, label]) => {
      const hits = count(data, `answered_${key}_${page}`);
      const timeouts = count(data, `timeouts_${key}_${page}`);
      const errors = count(data, `http_errors_${key}_${page}`);
      const misses = count(data, `content_misses_${key}_${page}`);
      const timing = values(data, `duration_${key}_${page}`);
      const wait = values(data, `waiting_${key}_${page}`);
      answered += hits;
      timedOut += timeouts;
      httpFailed += errors;
      missing += misses;
      return `<tr><td>${label}</td><td>${hits}</td><td>${timeouts}</td><td>${errors}</td><td>${misses}</td><td>${ms(timing && timing.med)}</td><td>${ms(timing && timing["p(95)"])}</td><td>${ms(timing && timing.max)}</td><td>${ms(wait && wait.med)}</td></tr>`;
    })
    .join("");

  return { title, detail, started, finished, cutOff, answered, timedOut, httpFailed, missing, rows };
}

function section(block) {
  return `<section>
  <h2>${block.title}</h2>
  <p>${block.detail}</p>
  <div class="cards">
    <div class="card"><span>Visits finished</span><strong>${block.finished}</strong><em>${block.started} started</em></div>
    <div class="card"><span>Cut off</span><strong>${block.cutOff}</strong></div>
    <div class="card"><span>Pages rendered</span><strong>${block.answered}</strong></div>
    <div class="card"><span>Timeouts</span><strong>${block.timedOut}</strong></div>
    <div class="card"><span>HTTP errors</span><strong>${block.httpFailed}</strong></div>
    <div class="card"><span>Wrong content</span><strong>${block.missing}</strong></div>
  </div>
  <table>
    <tr><th>Page</th><th>Rendered</th><th>Timeout</th><th>HTTP error</th><th>Wrong content</th><th>Median</th><th>p95</th><th>Slowest</th><th>Server wait</th></tr>
    ${block.rows}
  </table>
  <p class="muted">Median, p95, and slowest count only pages that contained the expected content. A timeout is not folded into those times.</p>
</section>`;
}

const single = phaseBlock(
  one,
  "one",
  "One shopper",
  "Eight visits, one after another, after a warm-up that is not included here.",
);
const crowd = phaseBlock(
  fifty,
  "fifty",
  "Fifty shoppers",
  "Fifty people at once for 60 seconds. Visits already underway were given another 90 seconds to finish.",
);

const oneMed = values(one, "duration_one_home");
const fiftyMed = values(fifty, "duration_fifty_home");
const homeLine =
  oneMed && fiftyMed
    ? `The home page median was ${ms(oneMed.med)} for one shopper and ${ms(fiftyMed.med)} for fifty.`
    : "";

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Trinity Styles — production load</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem auto; max-width: 56rem; color: #1c2430; background: #f6f8fc; }
    h1, h2 { font-weight: 500; letter-spacing: -0.02em; }
    p { line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #e4e8f0; }
    th { font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 1rem 0; }
    .card { background: white; border-radius: 1rem; padding: 1rem; }
    .card span, .muted { color: #5c6778; }
    .card span { display: block; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .card strong { display: block; font-size: 1.6rem; margin-top: 0.25rem; }
    .card em { color: #5c6778; font-style: normal; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Production load</h1>
  <p class="muted">k6 against the production server on ${process.env.BASE_URL || "http://127.0.0.1:3001"}. The warm-up opened the home page, the shop, every product, the bag, and login once, and those requests are left out. A page counts as rendered only when the response contains its real text. Orders and virtual try-on were not used. This is the document response, not a full browser.</p>
  <p>${homeLine}</p>
  ${section(single)}
  ${section(crowd)}
</body>
</html>`;

fs.writeFileSync(path.join(reports, "summary.html"), html);
console.log(`one ${single.finished}/${single.started} finished, ${single.answered} rendered, ${single.timedOut} timeouts, ${single.httpFailed} http, ${single.missing} content`);
console.log(`fifty ${crowd.finished}/${crowd.started} finished, ${crowd.answered} rendered, ${crowd.timedOut} timeouts, ${crowd.httpFailed} http, ${crowd.missing} content`);
