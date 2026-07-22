const sectionIds = ["speaking", "writing", "press", "about", "contact"];
const navLinks = [...document.querySelectorAll(".sequence-nav nav a")];
const progress = document.querySelector(".sequence-progress > span");
const heroName = document.querySelector(".hero-name");
const heroLines = heroName ? [...heroName.querySelectorAll(".hero-name-line")] : [];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const GLYPH_POOL = "<>()[]{}/*#=+:;→↓↑↳⇄|".split("");
const HERO_FRAME_MS = 62;
const HERO_FRAMES_PER_CHARACTER = 2;
const HERO_REPLAY_LIMIT_MS = 1500;

let frame = 0;
let heroFrame = 0;
let heroTimer = 0;
let heroRunning = false;
let heroLastStartedAt = 0;

const heroGlyphs = heroLines.flatMap((line) => {
  const text = line.dataset.text ?? line.textContent ?? "";
  line.replaceChildren();

  return [...text].map((character) => {
    const glyph = document.createElement("span");
    glyph.className = "hero-name-glyph";
    glyph.dataset.character = character;
    line.append(glyph);
    return glyph;
  });
});

function renderHeroStatic() {
  heroGlyphs.forEach((glyph) => {
    glyph.textContent = glyph.dataset.character;
    glyph.className = "hero-name-glyph";
  });
}

function renderHeroFrame() {
  const position = Math.min(
    heroGlyphs.length,
    Math.floor(heroFrame / HERO_FRAMES_PER_CHARACTER)
  );

  heroGlyphs.forEach((glyph, index) => {
    if (index < position) {
      glyph.textContent = glyph.dataset.character;
      glyph.className = "hero-name-glyph";
    } else if (index === position) {
      glyph.textContent = GLYPH_POOL[heroFrame % GLYPH_POOL.length];
      glyph.className = "hero-name-glyph is-cursor";
    } else {
      glyph.textContent = GLYPH_POOL[(index * 5 + 2) % GLYPH_POOL.length];
      glyph.className = "hero-name-glyph is-pending";
    }
  });

  if (position >= heroGlyphs.length) {
    window.clearInterval(heroTimer);
    heroTimer = 0;
    heroRunning = false;
  }
}

function runHeroAnimation() {
  const now = Date.now();
  if (
    !heroGlyphs.length ||
    reducedMotion.matches ||
    heroRunning ||
    now - heroLastStartedAt < HERO_REPLAY_LIMIT_MS
  ) return;

  heroRunning = true;
  heroLastStartedAt = now;
  heroFrame = 0;
  renderHeroFrame();
  heroTimer = window.setInterval(() => {
    heroFrame += 1;
    renderHeroFrame();
  }, HERO_FRAME_MS);
}

function initializeHeroName() {
  if (!heroName || !heroGlyphs.length) return;

  if (reducedMotion.matches) {
    renderHeroStatic();
    return;
  }

  runHeroAnimation();
  heroName.addEventListener("mouseenter", runHeroAnimation);
  heroName.addEventListener("focus", runHeroAnimation);

  if ("IntersectionObserver" in window) {
    let hasObservedInitialState = false;
    let wasIntersecting = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (!hasObservedInitialState) {
        hasObservedInitialState = true;
        wasIntersecting = entry.isIntersecting;
        return;
      }

      if (entry.isIntersecting && !wasIntersecting) runHeroAnimation();
      wasIntersecting = entry.isIntersecting;
    });
    observer.observe(heroName);
  }

  reducedMotion.addEventListener("change", (event) => {
    if (!event.matches) return;
    window.clearInterval(heroTimer);
    heroTimer = 0;
    heroRunning = false;
    renderHeroStatic();
  });
}

function updateScrollState() {
  const maximum = document.documentElement.scrollHeight - window.innerHeight;
  const amount = maximum > 0 ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 0;
  if (progress) progress.style.transform = `scaleX(${amount})`;

  const marker = window.scrollY + window.innerHeight * 0.45;
  let current = sectionIds[0];

  sectionIds.forEach((id) => {
    const section = document.getElementById(id);
    if (section && section.offsetTop <= marker) current = id;
  });

  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    current = sectionIds.at(-1);
  }

  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${current}`;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });

  frame = 0;
}

function onScroll() {
  if (!frame) frame = window.requestAnimationFrame(updateScrollState);
}

updateScrollState();
initializeHeroName();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
