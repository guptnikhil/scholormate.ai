/**
 * main.js
 * ---------------------------------------------------------------------------
 * Shared behaviour loaded on every page:
 *  - early theme initialization (dark / light mode with zero FOUC)
 *  - injects the Navbar and Footer components
 *  - theme toggle functionality (desktop & mobile) with persistence
 *  - mobile nav toggle
 *  - button ripple effect
 *  - toast notification system (window.showToast)
 *  - scroll-reveal (.fade-up -> .is-visible) via IntersectionObserver
 *  - voice input setup (window.setupVoiceInput)
 * ---------------------------------------------------------------------------
 */

/* ============================ Early Theme Init ============================ */
(function initThemeEarly() {
  try {
    const saved = localStorage.getItem("sm_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
  } catch (_) {}
})();

/* ============================ Components ================================ */

/**
 * Returns the navbar markup. `activePage` should match one of the
 * data-page values used in the nav links ("home", "finder", "assistant",
 * "about", "contact") so the current page can be highlighted.
 */
function Navbar(activePage, rootPrefix) {
  const root = rootPrefix || "";
  const link = (page, href, label) =>
    `<a href="${root}${href}" data-page="${page}" class="${page === activePage ? "is-active" : ""}">${label}</a>`;

  return `
    <div class="container navbar__inner">
      <a href="${root}index.html" class="brand" aria-label="ScholarMate home">
        <span class="brand__mark">SM</span>
        <span>ScholarMate</span>
      </a>

      <nav class="nav-links" aria-label="Primary">
        ${link("home", "index.html", "Overview")}
        ${link("results", "pages/results.html", "Directory")}
        ${link("finder", "pages/finder.html", "Eligibility Finder")}
        ${link("assistant", "pages/assistant.html", "AI Assistant")}
        ${link("about", "pages/about.html", "About")}
        ${link("contact", "pages/contact.html", "Contact")}
      </nav>

      <div class="navbar__actions">
        <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle color theme" title="Toggle color theme">
          <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="navMobile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
    </div>

    <nav class="nav-mobile" id="navMobile" aria-label="Mobile">
      ${link("home", "index.html", "Overview")}
      ${link("results", "pages/results.html", "Directory")}
      ${link("finder", "pages/finder.html", "Eligibility Finder")}
      ${link("assistant", "pages/assistant.html", "AI Assistant")}
      ${link("about", "pages/about.html", "About")}
      ${link("contact", "pages/contact.html", "Contact")}
      <div class="nav-mobile__theme-row">
        <span class="nav-mobile__theme-title">Theme</span>
        <button class="btn btn-secondary mobile-theme-btn" id="themeToggleMobile" type="button" aria-label="Toggle color theme">
          <svg class="sun-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg class="moon-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <span class="theme-text">Dark mode</span>
        </button>
      </div>
    </nav>
  `;
}

function Footer(rootPrefix) {
  const root = rootPrefix || "";
  return `
    <div class="container">
      <div class="footer__grid">
        <div>
          <a href="${root}index.html" class="brand" style="margin-bottom:12px;">
            <span class="brand__mark">SM</span>
            <span>ScholarMate</span>
          </a>
          <p class="text-muted" style="font-size:13.5px; max-width:340px; margin-top:12px; line-height:1.6;">
            A public citizen directory and AI eligibility guide designed to help students discover and verify scholarships through clear, plain-language criteria matching.
          </p>
        </div>
        <div>
          <h4>Registry</h4>
          <a href="${root}pages/results.html">Full Directory</a>
          <a href="${root}pages/finder.html">Eligibility Finder</a>
          <a href="${root}pages/assistant.html">AI Assistant</a>
        </div>
        <div>
          <h4>Initiative</h4>
          <a href="${root}pages/about.html">About ScholarMate</a>
          <a href="${root}pages/contact.html">Contact & Feedback</a>
        </div>
        <div>
          <h4>Reference</h4>
          <a href="${root}pages/contact.html">Public Records Notice</a>
          <a href="${root}pages/contact.html">Terms of Service</a>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© 2026 ScholarMate · Public Scholarship Discovery Index</span>
        <span>Open Academic Directory</span>
      </div>
    </div>
  `;
}

/* ============================= Theme Management =========================== */

const THEME_STORAGE_KEY = "sm_theme";

/**
 * Returns active theme preference ('dark' | 'light').
 * Checks localStorage first, then falls back to system preference.
 */
function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  } catch (_) {}

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/**
 * Updates button accessibility attributes, titles, and button labels across the page.
 */
function updateThemeToggleUI(theme) {
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  const desktopBtn = document.getElementById("themeToggle");
  if (desktopBtn) {
    desktopBtn.setAttribute("aria-label", label);
    desktopBtn.setAttribute("title", label);
  }

  const mobileBtn = document.getElementById("themeToggleMobile");
  if (mobileBtn) {
    mobileBtn.setAttribute("aria-label", label);
    const textSpan = mobileBtn.querySelector(".theme-text");
    if (textSpan) {
      textSpan.textContent = isDark ? "Light mode" : "Dark mode";
    }
  }
}

/**
 * Applies the given theme to the document root and persists to localStorage if requested.
 */
function applyTheme(theme, save = true) {
  const finalTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", finalTheme);

  if (save) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, finalTheme);
    } catch (_) {}
  }

  updateThemeToggleUI(finalTheme);
}

/**
 * Toggles between dark and light themes with user notification.
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next, true);

  if (window.showToast) {
    window.showToast(next === "dark" ? "Dark mode activated 🌙" : "Light mode activated ☀️");
  }
}

/**
 * Listens for system OS theme changes (if user hasn't explicitly set a preference).
 */
function initTheme() {
  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme, false);

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      try {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          applyTheme(e.matches ? "dark" : "light", false);
        }
      } catch (_) {}
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  }
}

function wireThemeToggle() {
  initTheme();

  const desktopBtn = document.getElementById("themeToggle");
  if (desktopBtn) {
    desktopBtn.addEventListener("click", toggleTheme);
  }

  const mobileBtn = document.getElementById("themeToggleMobile");
  if (mobileBtn) {
    mobileBtn.addEventListener("click", toggleTheme);
  }
}

window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.getPreferredTheme = getPreferredTheme;

/* ============================= Mounting =================================== */

function mountLayout() {
  const navEl = document.getElementById("site-navbar");
  const footerEl = document.getElementById("site-footer");

  const page = document.body.dataset.page || "home";
  const root = document.body.dataset.root || "";

  if (navEl) {
    navEl.innerHTML = Navbar(page, root);
    wireMobileNav();
    wireThemeToggle();
  } else {
    initTheme();
  }

  if (footerEl) {
    footerEl.innerHTML = Footer(root);
  }

  initButtonRipples();
  initScrollReveal();
}

function wireMobileNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMobile");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

/* ============================= Micro-UX =================================== */

/**
 * Material-style ripple on buttons. Creates a span, expands it, then removes it.
 */
function initButtonRipples() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

/* ============================== Toasts ===================================== */

function ensureToastStack() {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    stack.setAttribute("role", "status");
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);
  }
  return stack;
}

/**
 * Show a toast notification. Attached to window so any page/script can call
 * showToast("Saved!") without importing anything extra.
 */
function showToast(message, { duration = 3200 } = {}) {
  const stack = ensureToastStack();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;">
      <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
    </svg>
    <span>${message}</span>
  `;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 220);
  }, duration);
}
window.showToast = showToast;

/* =========================== Scroll reveal ================================= */

function initScrollReveal() {
  const targets = document.querySelectorAll(".fade-up");
  if (!("IntersectionObserver" in window) || targets.length === 0) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((t) => observer.observe(t));
}

/* =========================== Voice Input =================================== */

/**
 * Attaches browser SpeechRecognition to a microphone trigger button and target input/textarea.
 * Works with Web Speech API in Chrome, Edge, Safari, and modern browsers.
 */
function setupVoiceInput({ button, input, onResult, onStart, onEnd, lang = "en-IN" }) {
  if (!button) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.showToast) {
        window.showToast("Voice recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      }
    });
    return null;
  }

  let recognition = null;
  let isListening = false;
  let baseText = "";

  function stop() {
    if (recognition && isListening) {
      try { recognition.stop(); } catch (_) {}
    }
    isListening = false;
    button.classList.remove("is-recording");
    button.setAttribute("aria-label", "Start voice input");
    button.title = "Click to speak";
    if (onEnd) onEnd();
  }

  function start() {
    try {
      recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      baseText = input ? input.value : "";
      if (baseText && !baseText.endsWith(" ")) {
        baseText += " ";
      }

      recognition.onstart = () => {
        isListening = true;
        button.classList.add("is-recording");
        button.setAttribute("aria-label", "Listening… Click to stop");
        button.title = "Listening… Click to stop";
        if (window.showToast) {
          window.showToast("Listening… Speak your message now 🎙️");
        }
        if (onStart) onStart();
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (input) {
          input.value = baseText + transcript;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const lastResult = event.results[event.results.length - 1];
        const isFinal = lastResult ? lastResult.isFinal : false;

        if (onResult) {
          onResult(transcript, isFinal);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          if (window.showToast) window.showToast("Microphone access denied. Please allow microphone permission in your browser.");
        } else if (event.error === "no-speech") {
          if (window.showToast) window.showToast("No speech detected. Please try again.");
        } else if (event.error !== "aborted") {
          if (window.showToast) window.showToast("Voice error: " + event.error);
        }
        stop();
      };

      recognition.onend = () => {
        const hadText = input && input.value.trim().length > baseText.trim().length;
        stop();
        if (hadText && window.showToast) {
          window.showToast("Voice captured! Ready to send.");
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Could not start speech recognition:", err);
      stop();
    }
  }

  button.addEventListener("click", (e) => {
    e.preventDefault();
    if (isListening) {
      stop();
    } else {
      start();
    }
  });

  return {
    start,
    stop,
    isListening: () => isListening,
  };
}
window.setupVoiceInput = setupVoiceInput;

document.addEventListener("DOMContentLoaded", mountLayout);
