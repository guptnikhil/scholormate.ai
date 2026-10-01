/**
 * results.js
 * ---------------------------------------------------------------------------
 * Renders scholarship result cards on the Results page. If the user arrived
 * from the Finder form, uses the results saved to sessionStorage; otherwise
 * falls back to GET /scholarships (mock) so this page also works standalone
 * as a "Browse Scholarships" view.
 * ---------------------------------------------------------------------------
 */

let currentResults = [];

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("resultsGrid");
  if (!grid) return;

  renderSkeletons(grid, 6);

  const storedProfile = sessionStorage.getItem("sm_profile");
  const storedResults = sessionStorage.getItem("sm_results");

  try {
    if (storedResults) {
      currentResults = JSON.parse(storedResults);
      updateHeading(storedProfile ? JSON.parse(storedProfile) : null);
      // brief delay so the skeleton -> content transition is visible
      await new Promise((r) => setTimeout(r, 350));
    } else {
      const { results } = await getScholarships({});
      currentResults = results;
    }
    renderResults(currentResults);
  } catch (err) {
    console.error(err);
    grid.innerHTML = "";
    if (window.showToast) showToast("Couldn't load scholarships. Please try again.");
  }

  wireFilters();
});

function updateHeading(profile) {
  const heading = document.getElementById("resultsHeading");
  const sub = document.getElementById("resultsSubheading");
  if (!profile || !heading) return;
  if (profile.state && profile.state !== "Any") {
    heading.textContent = `Scholarships matched to your profile`;
    sub.textContent = `Based on your details in ${profile.state}, ranked by best fit.`;
  }
}

function renderSkeletons(grid, count) {
  grid.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="skeleton-card card">
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <div style="flex:1;">
            <div class="skeleton skeleton-line w-90" style="margin-bottom:8px;"></div>
            <div class="skeleton skeleton-line w-40"></div>
          </div>
          <div class="skeleton skeleton-circle"></div>
        </div>
        <div class="skeleton skeleton-line w-100"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div style="display:flex; gap:8px;">
          <div class="skeleton skeleton-line w-40" style="height:26px; border-radius:999px;"></div>
          <div class="skeleton skeleton-line w-40" style="height:26px; border-radius:999px;"></div>
        </div>
      </div>`
    )
    .join("");
}

function renderResults(list) {
  const grid = document.getElementById("resultsGrid");
  const empty = document.getElementById("emptyState");

  if (!list.length) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  grid.innerHTML = list.map(scholarshipCardHTML).join("");
  initScrollReveal();
}

function scholarshipCardHTML(s) {
  return `
    <article class="card card-lift scholarship-card fade-up">
      <div class="scholarship-card__top">
        <div>
          <div class="scholarship-card__name">${s.name}</div>
          <div class="scholarship-card__meta">${s.provider} · ${s.state}</div>
        </div>
        <div class="match-badge" title="${s.match}% match">
          ${s.match}%
          <span>MATCH</span>
        </div>
      </div>

      <p class="scholarship-card__desc">${s.description}</p>

      <div class="scholarship-card__facts">
        <span class="fact-chip is-amount">${formatCurrency(s.amount)}</span>
        <span class="fact-chip is-deadline">Due ${formatDate(s.deadline)}</span>
        <span class="fact-chip">${s.category}</span>
      </div>

      <div class="scholarship-card__actions">
        <a href="details.html?id=${s.id}" class="btn btn-secondary btn-sm">View Details</a>
        <a href="${s.officialUrl}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Official Website</a>
        <a href="${s.officialUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Apply Now</a>
      </div>
    </article>
  `;
}

function wireFilters() {
  const stateSel = document.getElementById("filterState");
  const catSel = document.getElementById("filterCategory");
  const searchInput = document.getElementById("filterSearch");
  const sortSel = document.getElementById("sortSelect");

  const apply = debounce(() => {
    let list = [...currentResults];

    if (stateSel.value !== "Any") {
      list = list.filter((s) => s.state === stateSel.value || s.state === "All India");
    }
    if (catSel.value !== "Any") {
      list = list.filter((s) => s.category === catSel.value);
    }
    if (searchInput.value.trim()) {
      const q = searchInput.value.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    if (sortSel.value === "amount") {
      list.sort((a, b) => b.amount - a.amount);
    } else if (sortSel.value === "deadline") {
      list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else {
      list.sort((a, b) => b.match - a.match);
    }

    renderResults(list);
  }, 180);

  [stateSel, catSel, sortSel].forEach((el) => el.addEventListener("change", apply));
  searchInput.addEventListener("input", apply);

  const voiceBtn = document.getElementById("voiceSearchBtn");
  if (voiceBtn && window.setupVoiceInput) {
    window.setupVoiceInput({
      button: voiceBtn,
      input: searchInput,
      onResult: () => apply(),
      onEnd: () => apply(),
    });
  }
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
