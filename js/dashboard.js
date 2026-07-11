// ── Stats (replace with real API data) ─────────────────────
document.getElementById("stat-total")?.textContent && null;
const statsEl = {
  total:        document.getElementById("stat-total"),
  destinations: document.getElementById("stat-destinations"),
  days:         document.getElementById("stat-days"),
};
// TODO: Fetch from /api/users/me/stats
if (statsEl.total)        statsEl.total.textContent        = "2";
if (statsEl.destinations) statsEl.destinations.textContent = "2";
if (statsEl.days)         statsEl.days.textContent         = "9";

// ── Search filter ───────────────────────────────────────────
document.getElementById("search-trips")?.addEventListener("input", function () {
  const q = this.value.toLowerCase();
  document.querySelectorAll(".trip-card").forEach(card => {
    const dest = card.querySelector(".trip-destination")?.textContent.toLowerCase();
    card.style.display = dest?.includes(q) ? "" : "none";
  });
});

// ── Logout ──────────────────────────────────────────────────
document.getElementById("logout-btn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../index.html";
});