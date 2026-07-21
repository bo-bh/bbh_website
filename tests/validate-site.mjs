import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const html = readFileSync(join(site, "index.html"), "utf8");
const css = readFileSync(join(site, "styles.css"), "utf8");
const javascript = readFileSync(join(site, "site.js"), "utf8");
const netlify = readFileSync(join(root, "netlify.toml"), "utf8");

function section(id, nextId) {
  const start = html.indexOf(`<section id="${id}"`);
  const end = nextId ? html.indexOf(`<section id="${nextId}"`, start) : html.length;
  assert.notEqual(start, -1, `Missing #${id}`);
  assert.notEqual(end, -1, `Missing section after #${id}`);
  return html.slice(start, end);
}

function recordCount(fragment) {
  return (fragment.match(/<li class="sequence-record">/g) ?? []).length;
}

test("approved information architecture and content are present", () => {
  const nav = html.match(/<nav aria-label="Page sections">([\s\S]*?)<\/nav>/)?.[1] ?? "";
  assert.deepEqual(
    [...nav.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]),
    ["about", "writing", "speaking", "contact"]
  );
  assert.doesNotMatch(nav, />Press</);
  assert.doesNotMatch(html, /Copy biography/i);
  assert.match(html, /PhD · he\/him/);
  assert.match(html, /I work where AI risk management meets technical practice\./);
  assert.match(html, /mailto:borhane\.blilihamelin@gmail\.com/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/borhane\//);
});

test("section numbering and curated record counts are exact", () => {
  const writing = section("writing", "speaking");
  const speaking = section("speaking", "press");
  const press = section("press", "contact");
  const contact = section("contact");

  assert.match(writing, /sequence-section-number">01</);
  assert.match(speaking, /sequence-section-number">02</);
  assert.match(press, /sequence-section-number">03</);
  assert.match(contact, /sequence-section-number">04</);
  assert.doesNotMatch(html, /sequence-section-number">05</);
  assert.equal(recordCount(writing), 14);
  assert.equal(recordCount(speaking), 15);
  assert.equal(recordCount(press), 1);
});

test("publication and speaking curation matches approved decisions", () => {
  assert.doesNotMatch(html, /FTC commercial-surveillance rulemaking/i);
  assert.doesNotMatch(html, /AI Vulnerability Database: 2023 in review/i);
  assert.doesNotMatch(html, /ARVA response to NTIA/i);
  assert.doesNotMatch(html, /arxiv\.org\/abs\/2401\.15229/i);
  assert.match(html, /Google Responsible AI Talk/);
  assert.match(html, /Queer in AI at NeurIPS/);
  assert.match(html, /BABL AI: AI and Research Ethics/);
  assert.match(html, /youtube\.com\/watch\?v=RKVsDcFQfIY/);
});

test("biography and podcast copy match approved presentation", () => {
  const about = section("about", "writing");
  const dataAndSocietyLinks = about.match(/<a href="https:\/\/datasociety\.net\/">Data &amp; Society<\/a>/g) ?? [];

  assert.equal(dataAndSocietyLinks.length, 1);
  assert.match(about, /My work has appeared through ICML, FAccT, AIES, Data &amp; Society, and IEEE-USA\./);
  assert.match(html, /<h3>Rethinking Intelligence in the Age of AI<\/h3>/);
  assert.doesNotMatch(html, /<h3>Borhane Blili-Hamelin: Rethinking Intelligence in the Age of AI<\/h3>/);
});

test("page title is concise and the retired turtle favicon is absent", () => {
  const approvedTitle = "Borhane Blili-Hamelin · AI Risk Management";

  assert.match(html, new RegExp(`<title>${approvedTitle}<\\/title>`));
  assert.match(html, new RegExp(`<meta property="og:title" content="${approvedTitle}">`));
  assert.match(html, new RegExp(`<meta name="twitter:title" content="${approvedTitle}">`));
  assert.doesNotMatch(html, /rel="icon"/);
  assert.equal(existsSync(join(site, "favicon.png")), false);
});

test("local assets exist and production config publishes only the static site", () => {
  const localAssets = [...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !path.startsWith("/#"));

  for (const asset of localAssets) {
    const clean = asset.split(/[?#]/)[0];
    assert.ok(existsSync(join(site, clean)), `Missing local asset: ${clean}`);
  }

  assert.match(netlify, /publish\s*=\s*"site"/);
  assert.match(netlify, /command\s*=\s*"npm test"/);
  assert.match(javascript, /"about", "writing", "speaking", "press", "contact"/);
});

test("locked type, colors, mobile navigation, and reduced motion remain intact", () => {
  for (const color of ["#c3c3b4", "#25281f", "#7a6ce8", "#5c5f52"]) {
    assert.match(css.toLowerCase(), new RegExp(color));
  }
  assert.match(css, /font-family: "IBM Plex Mono"/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?\.sequence-brand \{ display: none; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
