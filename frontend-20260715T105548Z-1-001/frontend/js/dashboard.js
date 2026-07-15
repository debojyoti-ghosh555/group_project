const API_URL = "http://localhost:5000/api";

// ── Load trips from backend ───────────────────────────────────
async function loadTrips() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "login.html"; return; }

  try {
    const res  = await fetch(`${API_URL}/trips`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const trips = data.trips || [];

    // Update stats
    const totalDays = trips.reduce((sum, t) => sum + (t.days || 0), 0);
    const dests     = new Set(trips.map(t => t.destination)).size;
    document.getElementById("stat-total").textContent        = trips.length;
    document.getElementById("stat-destinations").textContent = dests;
    document.getElementById("stat-days").textContent         = totalDays;

    renderTrips(trips);
  } catch (err) {
    console.error("Failed to load trips:", err.message);
  }
}

// ── Render trip cards ─────────────────────────────────────────
function renderTrips(trips) {
  const grid    = document.getElementById("trips-grid");
  const empty   = document.getElementById("empty-state");

  // Remove old dynamic cards (keep empty state el)
  grid.querySelectorAll(".trip-card.dynamic").forEach(el => el.remove());

  if (!trips.length) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const icons = { beach:"🏖️", mountain:"🏔️", city:"🏙️", nature:"🌿", default:"✈️" };

  trips.forEach(trip => {
    const icon  = icons.default;
    const style = trip.travel_style || "budget";
    const date  = trip.start_date
      ? new Date(trip.start_date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
      : "Date not set";
    const ago   = timeAgo(trip.created_at);

    const card = document.createElement("article");
    card.className = "trip-card dynamic";
    card.dataset.id = trip.id;
    card.innerHTML = `
      <div class="trip-card-header">
        <div class="trip-destination-badge">${icon}</div>
        <div class="trip-meta">
          <h3 class="trip-destination">${trip.destination}</h3>
          <span class="trip-style ${style}">${style}</span>
        </div>
        <div class="trip-card-menu">
          <button class="icon-btn">⋮</button>
          <div class="dropdown-menu">
            <a href="#" class="dropdown-item delete-btn" data-id="${trip.id}">🗑️ Delete</a>
          </div>
        </div>
      </div>
      <div class="trip-card-body">
        <div class="trip-detail"><span>📅</span> ${date} · ${trip.days} days</div>
        <div class="trip-detail"><span>👥</span> ${trip.travellers || 1} traveller(s)</div>
        <div class="trip-detail"><span>💰</span> ${trip.budget ? "₹" + parseInt(trip.budget).toLocaleString("en-IN") : "Budget not set"}</div>
      </div>
      <div class="trip-card-footer">
        <span class="trip-date">${ago}</span>
      </div>`;
    document.getElementById("trips-grid").appendChild(card);
  });

  // Delete buttons
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Delete this trip?")) return;
      const id    = btn.dataset.id;
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/trips/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      loadTrips(); // refresh
    });
  });
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff/60)} min ago`;
  if (diff < 86400)  return `${Math.floor(diff/3600)} hours ago`;
  return `${Math.floor(diff/86400)} days ago`;
}

// ── Search filter ─────────────────────────────────────────────
document.getElementById("search-trips")?.addEventListener("input", function () {
  const q = this.value.toLowerCase();
  document.querySelectorAll(".trip-card.dynamic").forEach(card => {
    const dest = card.querySelector(".trip-destination")?.textContent.toLowerCase();
    card.style.display = dest?.includes(q) ? "" : "none";
  });
});

// ── Logout ────────────────────────────────────────────────────
document.getElementById("logout-btn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
});

// ── Show logged-in user name ──────────────────────────────────
const user = JSON.parse(localStorage.getItem("user") || "{}");
const appHeader = document.querySelector(".app-header h1");
if (appHeader && user.name) appHeader.textContent = `Welcome, ${user.name.split(" ")[0]} 👋`;

// ── Init ──────────────────────────────────────────────────────
loadTrips();
