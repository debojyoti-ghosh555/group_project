// ── CONFIG ───────────────────────────────────────────────────
// Change this to your Render URL after deployment
const API_URL = "http://localhost:5000/api";

// ── Budget slider ────────────────────────────────────────────
const slider        = document.getElementById("budget-slider");
const budgetDisplay = document.getElementById("budget-display");
slider?.addEventListener("input", () => {
  const val = parseInt(slider.value).toLocaleString("en-IN");
  if (budgetDisplay) budgetDisplay.textContent = `₹${val}`;
});

// ── Traveller counter ────────────────────────────────────────
const tv = document.getElementById("travellers");
document.getElementById("inc-travellers")?.addEventListener("click", () => {
  if (tv && +tv.value < 20) tv.value = +tv.value + 1;
});
document.getElementById("dec-travellers")?.addEventListener("click", () => {
  if (tv && +tv.value > 1) tv.value = +tv.value - 1;
});

// ── Date auto-fill ───────────────────────────────────────────
const startDate = document.getElementById("start-date");
const daysInput = document.getElementById("days");
const endDate   = document.getElementById("end-date");

function updateEnd() {
  if (!startDate?.value || !daysInput?.value) return;
  const d = new Date(startDate.value);
  d.setDate(d.getDate() + parseInt(daysInput.value) - 1);
  if (endDate) endDate.value = d.toISOString().split("T")[0];
}
startDate?.addEventListener("change", updateEnd);
daysInput?.addEventListener("input", updateEnd);

// ── Loading animation ────────────────────────────────────────
let loadingInterval = null;

function runLoadingSteps() {
  const steps = ["lstep-1", "lstep-2", "lstep-3", "lstep-4", "lstep-5"];
  let i = 0;

  // Clear any previous run and reset all steps first
  if (loadingInterval) clearInterval(loadingInterval);
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active", "done");
  });

  loadingInterval = setInterval(() => {
    if (i > 0) document.getElementById(steps[i - 1])?.classList.replace("active", "done");
    if (i < steps.length) {
      document.getElementById(steps[i])?.classList.add("active");
      i++;
    } else {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }, 1400);
}

function stopLoadingSteps() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

// ── Small helper to avoid HTML/script injection from AI output ─
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Render the AI itinerary onto the page ────────────────────
function renderItinerary(data) {
  // Update trip title and budget summary
  const titleEl = document.getElementById("result-title");
  if (titleEl) titleEl.textContent = data.tripTitle || "Your Itinerary";

  const style  = document.querySelector('input[name="travel_style"]:checked')?.value || "budget";
  const budget = parseInt(slider?.value || 15000).toLocaleString("en-IN");
  const subtitle = document.getElementById("result-subtitle");
  if (subtitle) subtitle.textContent = `${style} trip · ${tv?.value || 1} traveller(s) · ₹${budget} budget`;

  // Budget breakdown
  const bd = data.budgetBreakdown || {};
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = `₹${(val || 0).toLocaleString("en-IN")}`;
  };
  setText("b-activities", bd.activities);
  setText("b-food", bd.food);
  setText("b-transport", bd.transport);
  setText("b-stay", bd.stay);
  setText("b-total", data.totalEstimatedCost);

  // Render day cards
  const container = document.getElementById("day-cards-container");
  if (!container) return;
  container.innerHTML = "";

  (data.days || []).forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div class="day-card-header"
           onclick="this.nextElementSibling.classList.toggle('hidden');
                    this.querySelector('.day-toggle').classList.toggle('open')">
        <h3>Day ${escapeHtml(day.day)} — ${escapeHtml(day.theme || "")}</h3>
        <span class="day-tag">Day ${escapeHtml(day.day)}</span>
        <span class="day-toggle">▾</span>
      </div>
      <div class="day-card-body">
        ${renderActivity("Morning",   day.morning)}
        ${renderActivity("Afternoon", day.afternoon)}
        ${renderActivity("Evening",   day.evening)}
        <div class="transport-tip">🚗 ${escapeHtml(day.transport || "")}</div>
      </div>`;
    container.appendChild(card);
  });

  // Packing tips
  if (data.packingTips?.length) {
    const tips = document.createElement("div");
    tips.className = "packing-tips";
    tips.innerHTML = `<h3>🎒 Packing Tips</h3><ul>${data.packingTips.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
    container.appendChild(tips);
  }
}

function renderActivity(label, act) {
  if (!act) return "";
  return `
    <div class="activity-row">
      <span class="activity-icon">${escapeHtml(act.icon || "📍")}</span>
      <div>
        <div class="activity-time">${escapeHtml(label)}</div>
        <div class="activity-name">${escapeHtml(act.name || "")}</div>
        <div class="activity-detail">${escapeHtml(act.detail || "")}</div>
      </div>
      <span class="activity-cost">${act.cost > 0 ? "₹" + act.cost.toLocaleString("en-IN") : "Free"}</span>
    </div>`;
}

// ── MAIN: Form submit → call backend → render result ─────────
document.getElementById("planner-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const destination  = document.getElementById("destination")?.value.trim();
  const days         = parseInt(document.getElementById("days")?.value);
  const budget       = parseInt(slider?.value || 15000);
  const travel_style = document.querySelector('input[name="travel_style"]:checked')?.value;
  const travellers   = parseInt(tv?.value || 1);
  const notes        = document.getElementById("notes")?.value.trim();
  const interests    = [...document.querySelectorAll('input[name="interests"]:checked')]
                         .map(c => c.value);
  const start_date   = document.getElementById("start-date")?.value;

  const destErrorEl = document.getElementById("dest-error");

  // Validate
  if (!destination) {
    if (destErrorEl) destErrorEl.textContent = "Please enter a destination.";
    return;
  }
  if (!days || days < 1) {
    if (destErrorEl) destErrorEl.textContent = "Please enter a valid number of days.";
    return;
  }
  if (destErrorEl) destErrorEl.textContent = "";

  // Check if user is logged in
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first to generate an itinerary.");
    window.location.href = "login.html";
    return;
  }

  // Show loading screen
  const formSection    = document.getElementById("planner-form-section");
  const loadingSection = document.getElementById("loading-section");
  const resultSection  = document.getElementById("result-section");

  if (formSection)    formSection.style.display    = "none";
  if (loadingSection) loadingSection.style.display = "flex";
  if (resultSection)  resultSection.style.display  = "none";
  runLoadingSteps();

  try {
    // ── Call your Express backend ──────────────────────────
    const response = await fetch(`${API_URL}/ai/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,   // JWT token from login
      },
      body: JSON.stringify({ destination, days, budget, interests, travel_style, travellers, notes, start_date }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        alert("Your session has expired. Please log in again.");
        window.location.href = "login.html";
        return;
      }
      throw new Error(data.error || "Failed to generate itinerary.");
    }

    // ── Auto-save the trip to the database ─────────────────
    try {
      const saveResponse = await fetch(`${API_URL}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          destination, days, start_date, budget, interests,
          travel_style, travellers, notes,
          itinerary: data.itinerary,
        }),
      });
      if (!saveResponse.ok) {
        console.warn("Trip generated but failed to auto-save.");
      }
    } catch (saveErr) {
      console.warn("Trip generated but failed to auto-save:", saveErr);
    }

    // ── Show the result ────────────────────────────────────
    stopLoadingSteps();
    if (loadingSection) loadingSection.style.display = "none";
    if (resultSection)  resultSection.style.display  = "block";
    renderItinerary(data.itinerary);

  } catch (err) {
    stopLoadingSteps();
    if (loadingSection) loadingSection.style.display = "none";
    if (formSection)    formSection.style.display    = "block";
    if (destErrorEl)    destErrorEl.textContent       = `Error: ${err.message}`;
  }
});

// ── Regenerate button ────────────────────────────────────────
document.getElementById("regenerate-btn")?.addEventListener("click", () => {
  const formSection   = document.getElementById("planner-form-section");
  const resultSection = document.getElementById("result-section");
  if (resultSection) resultSection.style.display = "none";
  if (formSection)   formSection.style.display    = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});