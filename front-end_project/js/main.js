// ── Hamburger menu ──────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const navLinks  = document.querySelector(".nav-links");

hamburger?.addEventListener("click", () => {
  navLinks?.classList.toggle("nav-open");
});

// ── Smooth scroll for anchor links ─────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
  });
});

// ── Navbar scroll shadow ────────────────────────────────────
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  navbar?.classList.toggle("scrolled", window.scrollY > 20);
});
