import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

const base = __ENV.BASE_URL || "http://127.0.0.1:3001";
const phase = __ENV.PHASE === "fifty" ? "fifty" : "one";

const products = [
  { slug: "blue-3-piece-suit", name: "Blue 3 piece suit" },
  { slug: "black-shirt", name: "Black Shirt" },
  { slug: "labadi-wide-trousers", name: "Labadi Wide Trousers" },
  { slug: "kumasi-knit-polo", name: "Kumasi Knit Polo" },
  { slug: "cape-coast-wrap-dress", name: "Cape Coast Wrap Dress" },
  { slug: "accra-linen-shirt", name: "Accra Linen Shirt" },
  { slug: "osu-tailored-blazer", name: "Osu Tailored Blazer" },
  { slug: "volta-cotton-set", name: "Volta Cotton Set" },
];

const pages = ["home", "shop", "product", "cart", "login"];
const duration = {};
const waiting = {};
const answered = {};
const timeouts = {};
const httpErrors = {};
const contentMisses = {};

for (const page of pages) {
  duration[page] = new Trend(`duration_${phase}_${page}`, true);
  waiting[page] = new Trend(`waiting_${phase}_${page}`, true);
  answered[page] = new Counter(`answered_${phase}_${page}`);
  timeouts[page] = new Counter(`timeouts_${phase}_${page}`);
  httpErrors[page] = new Counter(`http_errors_${phase}_${page}`);
  contentMisses[page] = new Counter(`content_misses_${phase}_${page}`);
}

const visitsStarted = new Counter(`visits_started_${phase}`);
const visitsFinished = new Counter(`visits_finished_${phase}`);

export const options = {
  scenarios: {
    [phase]:
      phase === "one"
        ? {
            executor: "shared-iterations",
            vus: 1,
            iterations: 8,
            maxDuration: "4m",
            exec: "browse",
          }
        : {
            executor: "constant-vus",
            vus: 50,
            duration: "60s",
            gracefulStop: "90s",
            exec: "browse",
          },
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "max"],
};

function pause() {
  sleep(Math.random() * 0.7 + 0.4);
}

function marker(page, product) {
  if (page === "home") return "Elevated essentials";
  if (page === "shop") return "price in GHS";
  if (page === "cart") return ">Bag</h1>";
  if (page === "login") return "Use your email for orders, looks, and checkout.";
  return product.name;
}

function open(path, page, product) {
  const response = http.get(`${base}${path}`, { timeout: "30s", tags: { page, phase } });
  const timedOut = response.status === 0;
  const httpError = !timedOut && (response.status < 200 || response.status >= 400);
  const rendered = !timedOut && !httpError && String(response.body || "").includes(marker(page, product));

  if (timedOut) timeouts[page].add(1);
  else if (httpError) httpErrors[page].add(1);
  else if (!rendered) contentMisses[page].add(1);
  else {
    answered[page].add(1);
    duration[page].add(response.timings.duration);
    waiting[page].add(response.timings.waiting);
  }

  check(response, {
    [`${page} rendered`]: () => rendered,
  });
}

export function setup() {
  if (phase !== "one") return;
  const paths = ["/", "/products", "/cart", "/login", ...products.map((product) => `/product/${product.slug}`)];
  for (const path of paths) {
    http.get(`${base}${path}`, { timeout: "30s", tags: { phase: "warmup" } });
  }
}

export function browse() {
  visitsStarted.add(1);
  open("/", "home");
  pause();
  open("/products", "shop");
  pause();
  const product = products[Math.floor(Math.random() * products.length)];
  open(`/product/${product.slug}`, "product", product);
  pause();
  open("/cart", "cart");
  pause();
  open("/login", "login");
  pause();
  visitsFinished.add(1);
}

export function handleSummary(data) {
  return {
    [`load/reports/${phase}.json`]: JSON.stringify(data, null, 2),
  };
}
