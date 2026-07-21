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
    ["about", "writing", "speaking", "press", "contact"]
  );
  assert.match(nav, />Press</);
  assert.doesNotMatch(html, /Copy biography/i);
  assert.match(html, /PhD · he\/him/);
  assert.match(html, /I practice AI risk management inside a large bank\. Everything else I do, from research to auditing to policy, comes back to improving the practice itself\./);
  assert.match(html, /For collaborations or speaking, the fastest way to reach me is email or LinkedIn\./);
  assert.doesNotMatch(html, /For collaborations, reviews, or speaking/);
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
  assert.equal(recordCount(press), 0);
  assert.match(press, /<figure class="sq-record">/);
});

test("press is a single linked pull-quote card", () => {
  const press = section("press", "contact");
  const links = [...press.matchAll(/<a\b[^>]*href="([^"]+)"/g)];

  assert.equal(links.length, 1);
  assert.equal(links[0][1], "https://www.washingtonpost.com/technology/2024/03/05/ai-research-letter-openai-meta-midjourney/");
  assert.match(press, /<a class="sq-record-link"/);
  assert.match(press, /Shaming shouldn’t be the only way independent researchers get heard\./);
  assert.match(press, /We have a broken oversight ecosystem\./);
  assert.match(press, /&lsquo;gotcha&rsquo;/);
  assert.match(press, /The Washington Post/);
  assert.match(press, /researcher safe harbor · March 2024/);
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
  const magicGrantLinks = about.match(/<a href="https:\/\/brown\.columbia\.edu\/announcing-2023-magic-grants\/">Magic Grant<\/a>/g) ?? [];

  assert.equal(dataAndSocietyLinks.length, 1);
  assert.equal(magicGrantLinks.length, 1);
  assert.match(
    about,
    /I also helped lead the <a href="https:\/\/avidml\.org">AI Risk and Vulnerability Alliance \(ARVA\)<\/a>, where I directed its research partnership with <a href="https:\/\/datasociety\.net\/">Data &amp; Society<\/a>\. That work was funded through a <a href="https:\/\/brown\.columbia\.edu\/announcing-2023-magic-grants\/">Magic Grant<\/a> I received from the Brown Institute for Media Innovation \(Columbia × Stanford\), with our red-teaming research supported by Omidyar Network\./
  );
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
  assert.doesNotMatch(css, /Newsreader|--read-family|--disp-family/);
  assert.equal(existsSync(join(site, "fonts/ibm-plex-mono-latin-600-normal.woff2")), false);
  assert.doesNotMatch(css, /font-weight: 600/);
  assert.match(css, /\.sq-record-lead \{[^}]*font-size: clamp\(1\.08rem, 1\.35vw, 1\.25rem\);[^}]*line-height: 1\.7;[^}]*font-weight: 400;/);
  assert.match(css, /\.sq-record-quote p \{[^}]*font-size: clamp\(1\.5rem, 2\.6vw, 2\.15rem\);[^}]*line-height: 1\.34;[^}]*font-weight: 400;[^}]*font-style: italic;/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?\.sequence-brand \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?\.sq-record-link \{ grid-template-columns: 1fr;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
