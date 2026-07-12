// ── Toggle password visibility ──────────────────────────────
document.getElementById("toggle-pw")?.addEventListener("click", function () {
  const pw = document.getElementById("password");
  pw.type = pw.type === "password" ? "text" : "password";
  this.textContent = pw.type === "password" ? "👁️" : "🙈";
});

// ── Password strength meter (register page) ─────────────────
const pwInput     = document.getElementById("password");
const fillEl      = document.getElementById("strength-fill");
const labelEl     = document.getElementById("strength-label");

pwInput?.addEventListener("input", () => {
  const val = pwInput.value;
  let score = 0;
  if (val.length >= 6)                        score++;
  if (val.length >= 10)                       score++;
  if (/[A-Z]/.test(val))                      score++;
  if (/[0-9]/.test(val))                      score++;
  if (/[^A-Za-z0-9]/.test(val))              score++;

  const levels = [
    { pct: "0%",   color: "transparent", label: "Enter a password" },
    { pct: "25%",  color: "#EF4444",     label: "Weak" },
    { pct: "50%",  color: "#F59E0B",     label: "Fair" },
    { pct: "75%",  color: "#3B82F6",     label: "Good" },
    { pct: "100%", color: "#10B981",     label: "Strong" },
  ];
  const lvl = levels[Math.min(score, 4)];
  if (fillEl)  { fillEl.style.width = lvl.pct; fillEl.style.background = lvl.color; }
  if (labelEl) { labelEl.textContent = lvl.label; labelEl.style.color = lvl.color; }
});

// ── Auto-fill end date from days ────────────────────────────
const startDate  = document.getElementById("start-date");
const daysInput  = document.getElementById("days");
const endDate    = document.getElementById("end-date");

function updateEndDate() {
  if (!startDate?.value || !daysInput?.value) return;
  const start = new Date(startDate.value);
  start.setDate(start.getDate() + parseInt(daysInput.value) - 1);
  if (endDate) endDate.value = start.toISOString().split("T")[0];
}
startDate?.addEventListener("change", updateEndDate);
daysInput?.addEventListener("input",  updateEndDate);

// ── Budget slider display ───────────────────────────────────
const slider       = document.getElementById("budget-slider");
const budgetDisplay = document.getElementById("budget-display");

slider?.addEventListener("input", () => {
  const val = parseInt(slider.value).toLocaleString("en-IN");
  if (budgetDisplay) budgetDisplay.textContent = `₹${val}`;
});

// ── Traveller counter ───────────────────────────────────────
const travellersInput = document.getElementById("travellers");

document.getElementById("inc-travellers")?.addEventListener("click", () => {
  if (travellersInput && parseInt(travellersInput.value) < 20)
    travellersInput.value = parseInt(travellersInput.value) + 1;
});
document.getElementById("dec-travellers")?.addEventListener("click", () => {
  if (travellersInput && parseInt(travellersInput.value) > 1)
    travellersInput.value = parseInt(travellersInput.value) - 1;
});

// ── Login form validation ───────────────────────────────────
document.getElementById("login-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  let valid = true;

  // Simple validation
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    document.getElementById("email-error").textContent = "Enter a valid email address.";
    valid = false;
  } else {
    document.getElementById("email-error").textContent = "";
  }
  if (!password) {
    document.getElementById("password-error").textContent = "Password is required.";
    valid = false;
  } else {
    document.getElementById("password-error").textContent = "";
  }
  if (!valid) return;

  // Show loading state
  const btn     = document.getElementById("login-btn");
  const btnText = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");
  btnText.style.display = "none";
  spinner.style.display = "inline";
  btn.disabled = true;

  // TODO: Replace this with real API call
  // const res  = await fetch("/api/auth/login", { method:"POST", ... });
  // const data = await res.json();
  // localStorage.setItem("token", data.token);
  // window.location.href = "/pages/dashboard.html";

  // Simulated delay (remove when backend is ready)
  await new Promise(r => setTimeout(r, 1500));

  // Demo: show error
  const errorEl = document.getElementById("login-error");
  errorEl.style.display = "block";
  document.getElementById("login-error-msg").textContent = "Invalid email or password. (Backend not connected yet)";
  btnText.style.display = "inline";
  spinner.style.display = "none";
  btn.disabled = false;
});

// ── Register form validation ────────────────────────────────
document.getElementById("register-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const name     = document.getElementById("name")?.value.trim();
  const email    = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirm  = document.getElementById("confirm-password")?.value;
  const terms    = document.getElementById("terms")?.checked;
  let valid = true;

  const setErr = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg; };

  if (!name || name.length < 2)               { setErr("name-error", "Enter your full name."); valid = false; }
  else                                          setErr("name-error", "");

  if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr("email-error", "Enter a valid email."); valid = false; }
  else                                          setErr("email-error", "");

  if (!password || password.length < 6)       { setErr("password-error", "Password must be at least 6 characters."); valid = false; }
  else                                          setErr("password-error", "");

  if (password !== confirm)                   { setErr("confirm-error", "Passwords do not match."); valid = false; }
  else                                          setErr("confirm-error", "");

  if (!terms) { valid = false; }

  if (!valid) return;

  // TODO: POST to /api/auth/register
  document.getElementById("register-success").style.display = "block";
  document.getElementById("register-error").style.display   = "none";
  setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
});