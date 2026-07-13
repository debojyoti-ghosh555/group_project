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
document.getElementById("inc-travellers")?.addEventListener("click", () => { if (tv && +tv.value < 20) tv.value = +tv.value + 1; });
document.getElementById("dec-travellers")?.addEventListener("click", () => { if (tv && +tv.value > 1)  tv.value = +tv.value - 1; });

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
daysInput?.addEventListener("input",  updateEnd);

// ── Loading animation ────────────────────────────────────────
function runLoadingSteps() {
  const steps = ["lstep-1","lstep-2","lstep-3","lstep-4","lstep-5"];
  let i = 0;
  // Reset all steps first
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("active","done"); }
  });
  const iv = setInterval(() => {
    if (i > 0) document.getElementById(steps[i-1])?.classList.replace("active","done");
    if (i < steps.length) {
      document.getElementById(steps[i])?.classList.add("active");
      i++;
    } else {
      clearInterval(iv);
    }
  }, 1400);
}

// ── Render the AI itinerary onto the page ────────────────────
function renderItinerary(data) {
  // Update trip title and budget summary
  document.getElementById("result-title").textContent = data.tripTitle || "Your Itinerary";

  const dest  = document.getElementById("destination")?.value || "";
  const days  = document.getElementById("days")?.value || "";
  const style = document.querySelector('input[name="travel_style"]:checked')?.value || "budget";
  const budget = parseInt(slider?.value || 15000).toLocaleString("en-IN");
  const subtitle = document.getElementById("result-subtitle");
  if (subtitle) subtitle.textContent = `${style} trip · ${tv?.value || 1} traveller(s) · ₹${budget} budget`;

  // Budget breakdown
  const bd = data.budgetBreakdown || {};
  document.getElementById("b-activities").textContent = `₹${(bd.activities || 0).toLocaleString("en-IN")}`;
  document.getElementById("b-food").textContent       = `₹${(bd.food || 0).toLocaleString("en-IN")}`;
  document.getElementById("b-transport").textContent  = `₹${(bd.transport || 0).toLocaleString("en-IN")}`;
  document.getElementById("b-stay").textContent       = `₹${(bd.stay || 0).toLocaleString("en-IN")}`;
  document.getElementById("b-total").textContent      = `₹${(data.totalEstimatedCost || 0).toLocaleString("en-IN")}`;

  // Render day cards
  const container = document.getElementById("day-cards-container");
  container.innerHTML = "";

  (data.days || []).forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div class="day-card-header"
           onclick="this.nextElementSibling.classList.toggle('hidden');
                    this.querySelector('.day-toggle').classList.toggle('open')">
        <h3>Day ${day.day} — ${day.theme || ""}</h3>
        <span class="day-tag">Day ${day.day}</span>
        <span class="day-toggle">▾</span>
      </div>
      <div class="day-card-body">
        ${renderActivity("Morning",   day.morning)}
        ${renderActivity("Afternoon", day.afternoon)}
        ${renderActivity("Evening",   day.evening)}
        <div class="transport-tip">🚗 ${day.transport || ""}</div>
      </div>`;
    container.appendChild(card);
  });

  // Packing tips
  if (data.packingTips?.length) {
    const tips = document.createElement("div");
    tips.className = "packing-tips";
    tips.innerHTML = `<h3>🎒 Packing Tips</h3><ul>${data.packingTips.map(t => `<li>${t}</li>`).join("")}</ul>`;
    container.appendChild(tips);
  }
}

function renderActivity(label, act) {
  if (!act) return "";
  return `
    <div class="activity-row">
      <span class="activity-icon">${act.icon || "📍"}</span>
      <div>
        <div class="activity-time">${label}</div>
        <div class="activity-name">${act.name || ""}</div>
        <div class="activity-detail">${act.detail || ""}</div>
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

  // Validate
  if (!destination) {
    document.getElementById("dest-error").textContent = "Please enter a destination.";
    return;
  }
  document.getElementById("dest-error").textContent = "";

  // Check if user is logged in
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first to generate an itinerary.");
    window.location.href = "login.html";
    return;
  }

  // Show loading screen
  document.getElementById("planner-form-section").style.display = "none";
  document.getElementById("loading-section").style.display      = "flex";
  document.getElementById("result-section").style.display       = "none";
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate itinerary.");
    }

    // ── Auto-save the trip to the database ─────────────────
    await fetch(`${API_URL}/trips`, {
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

    // ── Show the result ────────────────────────────────────
    document.getElementById("loading-section").style.display = "none";
    document.getElementById("result-section").style.display  = "block";
    renderItinerary(data.itinerary);

  } catch (err) {
    document.getElementById("loading-section").style.display       = "none";
    document.getElementById("planner-form-section").style.display  = "block";
    document.getElementById("dest-error").textContent = `Error: ${err.message}`;
  }
});

// ── Regenerate button ────────────────────────────────────────
document.getElementById("regenerate-btn")?.addEventListener("click", () => {
  document.getElementById("result-section").style.display       = "none";
  document.getElementById("planner-form-section").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});
