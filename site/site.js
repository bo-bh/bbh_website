const sectionIds = ["speaking", "writing", "press", "about", "contact"];
const navLinks = [...document.querySelectorAll(".sequence-nav nav a")];
const progress = document.querySelector(".sequence-progress > span");

let frame = 0;

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
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
