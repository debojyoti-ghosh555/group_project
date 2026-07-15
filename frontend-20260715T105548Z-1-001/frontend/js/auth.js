const API_URL = "http://localhost:5000/api";

// ── Toggle password visibility ────────────────────────────────
document.getElementById("toggle-pw")?.addEventListener("click", function () {
  const pw = document.getElementById("password");
  pw.type = pw.type === "password" ? "text" : "password";
  this.textContent = pw.type === "password" ? "👁️" : "🙈";
});

// ── Password strength meter ───────────────────────────────────
document.getElementById("password")?.addEventListener("input", function () {
  const val = this.value;
  let score = 0;
  if (val.length >= 6)          score++;
  if (val.length >= 10)         score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct: "0%",   color: "transparent", label: "Enter a password" },
    { pct: "25%",  color: "#EF4444",     label: "Weak" },
    { pct: "50%",  color: "#F59E0B",     label: "Fair" },
    { pct: "75%",  color: "#3B82F6",     label: "Good" },
    { pct: "100%", color: "#10B981",     label: "Strong" },
  ];
  const lvl = levels[Math.min(score, 4)];
  const fill  = document.getElementById("strength-fill");
  const label = document.getElementById("strength-label");
  if (fill)  { fill.style.width = lvl.pct; fill.style.background = lvl.color; }
  if (label) { label.textContent = lvl.label; label.style.color = lvl.color; }
});

// ── LOGIN ─────────────────────────────────────────────────────
document.getElementById("login-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  let valid = true;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    document.getElementById("email-error").textContent = "Enter a valid email.";
    valid = false;
  } else { document.getElementById("email-error").textContent = ""; }

  if (!password) {
    document.getElementById("password-error").textContent = "Password is required.";
    valid = false;
  } else { document.getElementById("password-error").textContent = ""; }

  if (!valid) return;

  const btn     = document.getElementById("login-btn");
  const btnText = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");
  btnText.style.display = "none";
  spinner.style.display = "inline";
  btn.disabled = true;

  try {
    const res  = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed.");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));
    window.location.href = "dashboard.html";

  } catch (err) {
    const errEl = document.getElementById("login-error");
    errEl.style.display = "block";
    document.getElementById("login-error-msg").textContent = err.message;
    btnText.style.display = "inline";
    spinner.style.display = "none";
    btn.disabled = false;
  }
});

// ── REGISTER ──────────────────────────────────────────────────
document.getElementById("register-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const name     = document.getElementById("name")?.value.trim();
  const email    = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirm  = document.getElementById("confirm-password")?.value;
  const terms    = document.getElementById("terms")?.checked;
  let valid = true;

  const setErr = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg; };

  if (!name || name.length < 2)              { setErr("name-error", "Enter your full name."); valid = false; }
  else                                         setErr("name-error", "");
  if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr("email-error", "Enter a valid email."); valid = false; }
  else                                         setErr("email-error", "");
  if (!password || password.length < 6)      { setErr("password-error", "Min 6 characters."); valid = false; }
  else                                         setErr("password-error", "");
  if (password !== confirm)                  { setErr("confirm-error", "Passwords do not match."); valid = false; }
  else                                         setErr("confirm-error", "");
  if (!terms) { alert("Please accept the terms to continue."); valid = false; }
  if (!valid) return;

  const btn     = document.getElementById("register-btn");
  const btnText = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");
  btnText.style.display = "none";
  spinner.style.display = "inline";
  btn.disabled = true;

  try {
    const res  = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed.");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));

    document.getElementById("register-success").style.display = "block";
    setTimeout(() => { window.location.href = "dashboard.html"; }, 1200);

  } catch (err) {
    const errEl = document.getElementById("register-error");
    errEl.style.display = "block";
    document.getElementById("register-error-msg").textContent = err.message;
    btnText.style.display = "inline";
    spinner.style.display = "none";
    btn.disabled = false;
  }
});
