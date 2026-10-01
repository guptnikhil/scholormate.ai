/**
 * finder.js
 * ---------------------------------------------------------------------------
 * Behaviour for the Scholarship Finder page: toggle chips, form submission,
 * calling the (mock) POST /match endpoint, and handing results to the
 * Results page via sessionStorage.
 * ---------------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("finderForm");
  if (!form) return;

  initToggleGroups();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitFinder();
  });
});

/** Wires up the Yes/No toggle-chip groups (disability, minority, orphan). */
function initToggleGroups() {
  document.querySelectorAll("[data-toggle-group]").forEach((group) => {
    group.querySelectorAll(".toggle-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        group.querySelectorAll(".toggle-chip").forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
      });
    });
  });
}

/** Reads the current value ("yes"/"no") of a toggle group by name. */
function getToggleValue(name) {
  const group = document.querySelector(`[data-toggle-group="${name}"]`);
  if (!group) return "no";
  const active = group.querySelector(".toggle-chip.is-active");
  return active ? active.dataset.value : "no";
}

async function submitFinder() {
  const findBtn = document.getElementById("findBtn");
  const findBtnLabel = document.getElementById("findBtnLabel");

  const profile = {
    state: document.getElementById("state").value,
    category: document.getElementById("category").value,
    income: document.getElementById("income").value,
    currentClass: document.getElementById("currentClass").value,
    gender: document.getElementById("gender").value,
    education: document.getElementById("education").value,
    disability: getToggleValue("disability"),
    minority: getToggleValue("minority"),
    orphan: getToggleValue("orphan"),
  };

  // Loading state
  findBtn.disabled = true;
  findBtn.style.opacity = "0.85";
  findBtnLabel.innerHTML = `<span class="spinner" style="margin-right:4px;"></span> Finding scholarships…`;

  try {
    const { results } = await matchScholarships(profile);
    sessionStorage.setItem("sm_profile", JSON.stringify(profile));
    sessionStorage.setItem("sm_results", JSON.stringify(results));
    window.location.href = "results.html";
  } catch (err) {
    console.error(err);
    findBtn.disabled = false;
    findBtnLabel.textContent = "Find Scholarships";
    if (window.showToast) showToast("Something went wrong. Please try again.");
  }
}
