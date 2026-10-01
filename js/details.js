/**
 * details.js
 * ---------------------------------------------------------------------------
 * Loads a single scholarship (via GET /scholarship/:id, mocked in api.js)
 * based on the ?id= query param and renders the details layout.
 * ---------------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const skeleton = document.getElementById("detailSkeleton");
  const body = document.getElementById("detailBody");

  if (!id) {
    renderNotFound(body, skeleton);
    return;
  }

  try {
    const scholarship = await getScholarshipById(id);
    if (!scholarship) {
      renderNotFound(body, skeleton);
      return;
    }
    document.title = `${scholarship.name} — ScholarMate AI`;
    renderDetail(scholarship, body, skeleton);
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Couldn't load this scholarship.");
    renderNotFound(body, skeleton);
  }
});

function renderNotFound(body, skeleton) {
  skeleton.style.display = "none";
  body.style.display = "block";
  body.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
      </div>
      <h3>Scholarship not found</h3>
      <p>It may have expired or the link is incorrect.</p>
      <a href="results.html" class="btn btn-primary btn-sm" style="margin-top:16px;">Browse Scholarships</a>
    </div>
  `;
}

function renderDetail(s, body, skeleton) {
  skeleton.style.display = "none";
  body.style.display = "block";

  body.innerHTML = `
    <div class="fade-up is-visible" style="margin-bottom:24px;">
      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
        <span class="badge-pill blue">${s.category}</span>
        <span class="badge-pill emerald">${s.match}% match for typical applicants</span>
      </div>
      <h1 style="font-size:clamp(24px,3.6vw,34px); max-width:720px;">${s.name}</h1>
      <p class="text-muted" style="margin-top:10px;">${s.provider} · ${s.state}</p>
    </div>

    <div class="grid-2">
      <div>
        <div class="card" style="padding:24px; margin-bottom:20px;">
          <h3 style="font-size:17px; margin-bottom:10px;">About this scholarship</h3>
          <p style="color:var(--ink-soft); line-height:1.65; font-size:14.5px;">${s.description}</p>
        </div>

        <div class="detail-panel" style="margin-bottom:20px;">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
            Eligibility
          </h3>
          <ul>${s.eligibility.map((e) => `<li>${e}</li>`).join("")}</ul>
        </div>

        <div class="detail-panel" style="margin-bottom:20px;">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            Benefits
          </h3>
          <ul>${s.benefits.map((b) => `<li>${b}</li>`).join("")}</ul>
        </div>

        <div class="detail-panel" style="margin-bottom:20px;">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            Required Documents
          </h3>
          <ul>${s.documents.map((d) => `<li>${d}</li>`).join("")}</ul>
        </div>

        <div class="detail-panel">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
            Application Process
          </h3>
          <p style="color:var(--ink-soft); font-size:14.5px; line-height:1.65;">${s.process}</p>
        </div>
      </div>

      <aside>
        <div class="card sticky-apply" style="padding:24px;">
          <div style="font-family:var(--font-data); font-size:28px; font-weight:700; color:var(--blue-700); margin-bottom:2px;">
            ${formatCurrency(s.amount)}
          </div>
          <div class="text-muted" style="font-size:13px; margin-bottom:20px;">Award amount</div>

          <div style="display:flex; justify-content:space-between; padding:12px 0; border-top:1px solid var(--slate-200);">
            <span class="text-muted" style="font-size:13.5px;">Deadline</span>
            <span class="fact-chip is-deadline">${formatDate(s.deadline)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:12px 0; border-top:1px solid var(--slate-200); border-bottom:1px solid var(--slate-200); margin-bottom:20px;">
            <span class="text-muted" style="font-size:13.5px;">Category</span>
            <span style="font-size:13.5px; font-weight:600;">${s.category}</span>
          </div>

          <a href="${s.officialUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-block" style="padding-block:14px; margin-bottom:10px;">
            Apply Now
          </a>
          <a href="${s.officialUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-block">
            Official Website
          </a>
        </div>
      </aside>
    </div>
  `;
}
