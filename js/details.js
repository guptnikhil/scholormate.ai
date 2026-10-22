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

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

function renderDetail(s, body, skeleton) {
  skeleton.style.display = "none";
  body.style.display = "block";  const applyLink = s.applyUrl || "https://scholarships.gov.in/otrapplication/#/login-page";
  const officialLink = s.officialUrl || "https://scholarships.gov.in/";

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            Benefits & Entitlements
          </h3>
          <ul>${s.benefits.map((b) => `<li>${b}</li>`).join("")}</ul>
        </div>

        <div class="detail-panel doc-checklist-panel" style="margin-bottom:20px;">
          <div class="doc-checklist-header">
            <div>
              <h3>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13l2 2 4-4"/></svg>
                Required Documents Checklist
              </h3>
              <p class="text-muted" style="font-size:13px; margin-top:2px;">
                Tick each document you have ready to verify application readiness.
              </p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="toggleAllDocsBtn" style="font-size:12px; padding:4px 10px;">
              Mark all ready
            </button>
          </div>

          <div class="doc-progress-wrap">
            <div class="doc-progress-bar">
              <div class="doc-progress-fill" id="docProgressFill" style="width: 0%;"></div>
            </div>
            <div class="doc-progress-label">
              <span id="docProgressText">0 of ${s.documents.length} ready</span>
              <span id="docProgressPercent">0%</span>
            </div>
          </div>

          <div class="doc-checklist" id="docChecklist">
            ${s.documents
              .map(
                (d, i) => `
              <label class="doc-item" for="doc-${i}">
                <input type="checkbox" id="doc-${i}" class="doc-checkbox" data-index="${i}" data-doc="${escapeAttr(d)}" />
                <span class="doc-checkbox-custom" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span class="doc-item-title">${d}</span>
                <span class="doc-status-badge">Pending</span>
              </label>
            `
              )
              .join("")}
          </div>

          <div id="docAllReadyNotice" class="doc-all-ready-notice" style="display:none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>All required documents are marked ready! You are prepared to proceed with the official application.</span>
          </div>
        </div>

        <div class="detail-panel">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
            How to Apply
          </h3>
          <p style="color:var(--ink-soft); font-size:14.5px; line-height:1.65; margin-bottom:14px;">${s.process}</p>

          <div style="background:var(--paper-tint); border:1px solid var(--slate-200); border-radius:var(--r-md); padding:16px; margin-top:12px;">
            <div style="font-weight:600; font-size:13.5px; margin-bottom:8px; color:var(--ink);">Official Student Application Steps:</div>
            <ol style="margin:0; padding-left:18px; font-size:13.5px; color:var(--slate-500); line-height:1.65;">
              <li>Open the <strong>National Scholarship Portal (NSP) OTR module</strong>.</li>
              <li>Complete One-Time Registration (OTR) with your Aadhaar / Mobile number to generate your 14-digit OTR ID.</li>
              <li>Log in with your OTR credentials to access the scholarship application form, select <strong>"${s.name}"</strong>, and submit.</li>
            </ol>
            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:16px;">
              <a href="${applyLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                Open Official Student Application Portal ↗
              </a>
              <a href="${officialLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                Scheme Guidelines & Portal ↗
              </a>
            </div>
          </div>
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

          <a href="${applyLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-block" style="padding-block:14px; margin-bottom:10px;">
            Apply Now (Student Portal) ↗
          </a>
          <a href="${officialLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-block">
            Official Guidelines Website
          </a>
        </div>
      </aside>
    </div>
  `;

  wireDocumentChecklist(s);
}

function wireDocumentChecklist(s) {
  const checklistEl = document.getElementById("docChecklist");
  const progressFill = document.getElementById("docProgressFill");
  const progressText = document.getElementById("docProgressText");
  const progressPercent = document.getElementById("docProgressPercent");
  const allReadyNotice = document.getElementById("docAllReadyNotice");
  const toggleAllBtn = document.getElementById("toggleAllDocsBtn");

  if (!checklistEl) return;

  const storageKey = `sm_docs_${s.id}`;
  let savedChecked = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) savedChecked = JSON.parse(raw);
  } catch (_) {}

  const checkboxes = checklistEl.querySelectorAll(".doc-checkbox");
  const total = checkboxes.length;

  function updateState(skipSave = false) {
    let checkedCount = 0;
    const currentCheckedIndices = [];

    checkboxes.forEach((cb) => {
      const idx = parseInt(cb.dataset.index, 10);
      const row = cb.closest(".doc-item");
      const badge = row.querySelector(".doc-status-badge");

      if (cb.checked) {
        checkedCount++;
        currentCheckedIndices.push(idx);
        row.classList.add("is-checked");
        if (badge) badge.textContent = "Ready ✓";
      } else {
        row.classList.remove("is-checked");
        if (badge) badge.textContent = "Pending";
      }
    });

    const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${checkedCount} of ${total} ready`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;

    if (allReadyNotice) {
      allReadyNotice.style.display = checkedCount === total && total > 0 ? "flex" : "none";
    }

    if (toggleAllBtn) {
      toggleAllBtn.textContent = checkedCount === total && total > 0 ? "Uncheck all" : "Mark all ready";
    }

    if (!skipSave) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentCheckedIndices));
      } catch (_) {}
    }
  }

  // Restore saved state
  checkboxes.forEach((cb) => {
    const idx = parseInt(cb.dataset.index, 10);
    if (savedChecked.includes(idx)) {
      cb.checked = true;
    }
  });

  updateState(true);

  // Wire checkbox change events
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      updateState();
      const docName = cb.dataset.doc || "Document";
      if (cb.checked && window.showToast) {
        const currentChecked = checklistEl.querySelectorAll(".doc-checkbox:checked").length;
        if (currentChecked === total) {
          window.showToast("All documents marked as ready! You're prepared to apply.");
        } else {
          window.showToast(`Marked "${docName}" as ready ✓`);
        }
      }
    });
  });

  // Toggle all button
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener("click", () => {
      const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
      checkboxes.forEach((cb) => {
        cb.checked = !allChecked;
      });
      updateState();
      if (!allChecked && window.showToast) {
        window.showToast("All documents marked ready ✓");
      }
    });
  }
}
