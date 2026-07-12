// ── Budget slider ───────────────────────────────────────────
const slider        = document.getElementById("budget-slider");
const budgetDisplay = document.getElementById("budget-display");
slider?.addEventListener("input", () => {
  const val = parseInt(slider.value).toLocaleString("en-IN");
  if (budgetDisplay) budgetDisplay.textContent = `₹${val}`;
});

// ── Traveller counter ───────────────────────────────────────
const tv = document.getElementById("travellers");
document.getElementById("inc-travellers")?.addEventListener("click", () => { if (tv && +tv.value < 20) tv.value = +tv.value + 1; });
document.getElementById("dec-travellers")?.addEventListener("click", () => { if (tv && +tv.value > 1)  tv.value = +tv.value - 1; });

// ── Date auto-fill ──────────────────────────────────────────
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

// ── Loading steps animation ─────────────────────────────────
function runLoadingSteps() {
  const steps = ["lstep-1","lstep-2","lstep-3","lstep-4","lstep-5"];
  let i = 0;
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

// ── Sample itinerary data (replace with real API response) ──
const SAMPLE_ITINERARY = {
  tripTitle: "5-Day Goa Itinerary",
  totalEstimatedCost: 14600,
  budgetBreakdown: { activities: 4500, food: 3200, transport: 2100, stay: 4800 },
  days: [
    {
      day: 1, theme: "Arrival & North Goa Beaches",
      morning:   { icon:"✈️", name:"Arrive in Goa — check in", detail:"Zostel Goa, Anjuna", cost: 0 },
      afternoon: { icon:"🏖️", name:"Calangute & Baga Beach", detail:"2–3 hrs, bring sunscreen", cost: 0 },
      evening:   { icon:"🍽️", name:"Dinner at Thalassa", detail:"Greek-Goan fusion · Vagator", cost: 800 },
    },
    {
      day: 2, theme: "Water Sports & Old Goa",
      morning:   { icon:"🚤", name:"Water sports at Baga Beach", detail:"Jet ski, parasailing", cost: 1500 },
      afternoon: { icon:"⛪", name:"Old Goa churches", detail:"Basilica of Bom Jesus (UNESCO)", cost: 0 },
      evening:   { icon:"🌅", name:"Sunset at Fort Aguada", detail:"Iconic 17th-century fort", cost: 50 },
    },
    {
      day: 3, theme: "South Goa — Quiet & Scenic",
      morning:   { icon:"🏄", name:"Palolem Beach", detail:"Most scenic beach in Goa", cost: 0 },
      afternoon: { icon:"🐬", name:"Dolphin watching cruise", detail:"1.5 hr boat trip", cost: 400 },
      evening:   { icon:"🍺", name:"Silent Noise party", detail:"Palolem beach headphone party", cost: 500 },
    },
    {
      day: 4, theme: "Culture & Spice Farms",
      morning:   { icon:"🌿", name:"Spice plantation tour", detail:"Sahakari Farms, Ponda", cost: 400 },
      afternoon: { icon:"🛍️", name:"Anjuna flea market", detail:"Handicrafts, clothes, souvenirs", cost: 600 },
      evening:   { icon:"🎵", name:"Live music at Curlies", detail:"Anjuna beach shack", cost: 300 },
    },
    {
      day: 5, theme: "Lazy Morning & Departure",
      morning:   { icon:"☕", name:"Breakfast at Infanteria", detail:"Best croissants in Goa — Panaji", cost: 250 },
      afternoon: { icon:"✈️", name:"Head to airport", detail:"Dabolim / Mopa airport", cost: 0 },
      evening:   { icon:"🏠", name:"Back home", detail:"Safe travels!", cost: 0 },
    },
  ]
};

// ── Render itinerary ────────────────────────────────────────
function renderItinerary(data) {
  document.getElementById("result-title").textContent    = data.tripTitle;
  document.getElementById("b-activities").textContent = `₹${data.budgetBreakdown.activities.toLocaleString("en-IN")}`;
  document.getElementById("b-food").textContent       = `₹${data.budgetBreakdown.food.toLocaleString("en-IN")}`;
  document.getElementById("b-transport").textContent  = `₹${data.budgetBreakdown.transport.toLocaleString("en-IN")}`;
  document.getElementById("b-stay").textContent       = `₹${data.budgetBreakdown.stay.toLocaleString("en-IN")}`;
  document.getElementById("b-total").textContent      = `₹${data.totalEstimatedCost.toLocaleString("en-IN")}`;

  const container = document.getElementById("day-cards-container");
  container.innerHTML = "";

  data.days.forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div class="day-card-header" onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.day-toggle').classList.toggle('open')">
        <h3>Day ${day.day} — ${day.theme}</h3>
        <span class="day-tag">Day ${day.day}</span>
        <span class="day-toggle">▾</span>
      </div>
      <div class="day-card-body">
        ${renderActivity("Morning",   day.morning)}
        ${renderActivity("Afternoon", day.afternoon)}
        ${renderActivity("Evening",   day.evening)}
      </div>`;
    container.appendChild(card);
  });
}

function renderActivity(label, act) {
  return `
    <div class="activity-row">
      <span class="activity-icon">${act.icon}</span>
      <div>
        <div class="activity-time">${label}</div>
        <div class="activity-name">${act.name}</div>
        <div class="activity-detail">${act.detail}</div>
      </div>
      <span class="activity-cost">${act.cost > 0 ? "₹" + act.cost.toLocaleString("en-IN") : "Free"}</span>
    </div>`;
}

// ── Form submit ─────────────────────────────────────────────
document.getElementById("planner-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const dest = document.getElementById("destination").value.trim();
  if (!dest) {
    document.getElementById("dest-error").textContent = "Please enter a destination.";
    return;
  }
  document.getElementById("dest-error").textContent = "";

  // Show loading, hide form
  document.getElementById("planner-form-section").style.display = "none";
  document.getElementById("loading-section").style.display      = "flex";
  document.getElementById("result-section").style.display       = "none";
  runLoadingSteps();

  // TODO: Replace with real API call
  // const interests = [...document.querySelectorAll('input[name="interests"]:checked')].map(c => c.value);
  // const response  = await fetch("/api/ai/generate", { method:"POST", headers:{...}, body: JSON.stringify({destination: dest, ...}) });
  // const data      = await response.json();

  // Simulated 7s delay (remove when backend is ready)
  await new Promise(r => setTimeout(r, 7000));

  // Render result
  document.getElementById("loading-section").style.display = "none";
  document.getElementById("result-section").style.display  = "block";
  const subtitle = document.getElementById("result-subtitle");
  const days = document.getElementById("days").value;
  const budget = parseInt(slider?.value || 15000).toLocaleString("en-IN");
  if (subtitle) subtitle.textContent = `Budget trip · ${tv?.value || 2} travellers · ₹${budget} total`;

  renderItinerary(SAMPLE_ITINERARY);
});

// ── Regenerate button ───────────────────────────────────────
document.getElementById("regenerate-btn")?.addEventListener("click", () => {
  document.getElementById("result-section").style.display       = "none";
  document.getElementById("planner-form-section").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});