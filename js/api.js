/**
 * api.js
 * ---------------------------------------------------------------------------
 * Thin API layer for ScholarMate AI.
 *
 * Every function below is written the way it will look once a real FastAPI
 * backend exists: it returns a Promise and internally calls fetch().
 * Right now the fetch() calls are commented out and each function resolves
 * with mock JSON after a short artificial delay, so the whole frontend can
 * be demoed with no backend running.
 *
 * To connect your backend later: uncomment the fetch() block in each
 * function and delete the corresponding mock branch.
 * ---------------------------------------------------------------------------
 */

const API_BASE_URL = "/api"; // e.g. http://localhost:8000

/** Small helper to simulate network latency for mock responses. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================= Mock data ================================ */

const MOCK_SCHOLARSHIPS = [
  {
    id: "sch_001",
    name: "National Merit Scholarship for Girls in STEM",
    provider: "Ministry of Education",
    amount: 75000,
    match: 96,
    deadline: "2026-11-30",
    state: "Bihar",
    category: "STEM",
    description:
      "Full tuition support for female students pursuing engineering, mathematics, or computer science degrees at a recognized institution.",
    eligibility: [
      "Female candidate currently enrolled in a STEM undergraduate program",
      "Family income below ₹2,50,000 per annum",
      "Minimum 75% marks in most recent qualifying exam",
    ],
    benefits: [
      "₹75,000 disbursed directly toward tuition fees",
      "One-time laptop grant for first-year students",
      "Mentorship pairing with an industry professional",
    ],
    documents: [
      "Income certificate",
      "Latest mark sheet",
      "Aadhaar card / valid ID",
      "Admission proof from institution",
    ],
    process:
      "Submit the online application with supporting documents, complete a short eligibility interview, and await verification within 3–4 weeks.",
    officialUrl: "https://www.education.gov.in/scholarships",
    applyUrl: "https://scholarships.gov.in/otrapplication/#/login-page",
  },
  {
    id: "sch_002",
    name: "Post-Matric Scholarship for Minority Students",
    provider: "State Welfare Department",
    amount: 40000,
    match: 91,
    deadline: "2026-12-15",
    state: "Bihar",
    category: "Minority",
    description:
      "Financial assistance for students from notified minority communities pursuing higher secondary or undergraduate education.",
    eligibility: [
      "Belongs to a notified minority community",
      "Enrolled in Class 11 or above",
      "Family income below ₹1,00,000 per annum",
    ],
    benefits: ["Annual tuition reimbursement", "Book and stationery allowance", "Hostel fee waiver where applicable"],
    documents: ["Minority community certificate", "Income certificate", "Bonafide student certificate"],
    process: "Apply through the state welfare portal; disbursal is made directly to the institution.",
    officialUrl: "https://scholarships.gov.in/",
    applyUrl: "https://scholarships.gov.in/otrapplication/#/login-page",
  },
  {
    id: "sch_003",
    name: "Disability Empowerment Education Grant",
    provider: "Department of Social Justice",
    amount: 60000,
    match: 88,
    deadline: "2027-01-10",
    state: "All India",
    category: "Disability",
    description:
      "Supports students with a certified disability of 40% or more in completing school or college education without financial barriers.",
    eligibility: [
      "Disability certificate of 40% or above",
      "Enrolled in a recognized school or college",
      "No income ceiling for severe disability cases",
    ],
    benefits: ["Assistive device allowance", "Full fee reimbursement", "Escort/attendant stipend where required"],
    documents: ["Disability certificate", "Admission letter", "Bank passbook copy"],
    process: "Apply online, upload the disability certificate, and schedule a verification appointment if requested.",
    officialUrl: "https://disabilityaffairs.gov.in/",
    applyUrl: "https://scholarships.gov.in/otrapplication/#/login-page",
  },
  {
    id: "sch_004",
    name: "Orphan and Vulnerable Children Education Fund",
    provider: "Child Welfare Trust",
    amount: 50000,
    match: 84,
    deadline: "2026-12-31",
    state: "All India",
    category: "Orphan",
    description:
      "Covers school and college fees for orphaned or single-parent children to ensure uninterrupted education.",
    eligibility: [
      "Orphan or single surviving parent",
      "Enrolled in Class 6 through undergraduate level",
      "Guardian income below ₹1,50,000 per annum",
    ],
    benefits: ["Full fee coverage", "Annual uniform and book kit", "Access to counselling support"],
    documents: ["Guardianship / orphan certificate", "School enrollment proof", "Guardian ID"],
    process: "Submit application through a registered NGO partner or directly via the trust's portal.",
    officialUrl: "https://wcd.nic.in/",
    applyUrl: "https://scholarships.gov.in/otrapplication/#/login-page",
  },
  {
    id: "sch_005",
    name: "Rural Talent Higher Education Scholarship",
    provider: "State Education Board",
    amount: 30000,
    match: 79,
    deadline: "2026-11-15",
    state: "Bihar",
    category: "General",
    description:
      "Recognizes academically strong students from rural backgrounds pursuing undergraduate studies in any discipline.",
    eligibility: [
      "Resident of a notified rural block",
      "Minimum 70% in Class 12 board exams",
      "Family income below ₹3,00,000 per annum",
    ],
    benefits: ["One-time cash award", "Priority hostel allotment", "Certificate of merit"],
    documents: ["Rural residence certificate", "Class 12 mark sheet", "Income certificate"],
    process: "Apply via the state board portal within the notified window each academic year.",
    officialUrl: "https://scholarships.gov.in/",
    applyUrl: "https://scholarships.gov.in/otrapplication/#/login-page",
  },
  {
    id: "sch_006",
    name: "Girl Child First-Generation Learner Award",
    provider: "National Education Foundation",
    amount: 45000,
    match: 74,
    deadline: "2027-01-31",
    state: "All India",
    category: "Gender",
    description:
      "For female students who are the first in their immediate family to pursue higher education.",
    eligibility: [
      "Female candidate, first-generation college student",
      "Enrolled in an undergraduate program",
      "Family income below ₹2,00,000 per annum",
    ],
    benefits: ["Tuition support", "Career counselling sessions", "Alumni mentorship network access"],
    documents: ["Self-declaration of first-generation status", "Income certificate", "Admission proof"],
    process: "Complete the online form and a short written statement about your educational goals.",
    officialUrl: "https://www.aicte-india.org/schemes/students-development-schemes",
    applyUrl: "https://scholarships.gov.in/otrapplication/#/login-page",
  },
];

const SUGGESTED_QUESTIONS = [
  "What scholarships am I eligible for?",
  "I'm from Bihar with 80k family income — what qualifies?",
  "Scholarships for engineering students",
  "What documents do I need to apply?",
  "Scholarships with the nearest deadline",
  "Explain why I matched a scholarship",
];

/* ============================ API functions =============================== */

/**
 * POST /match
 * Send the finder form answers, get back ranked scholarship matches.
 * @param {object} profile - form field values from the Scholarship Finder page
 * @returns {Promise<{results: object[], total: number}>}
 */
async function matchScholarships(profile) {
  // ---- Real backend call (uncomment when FastAPI is ready) ----
  // const res = await fetch(`${API_BASE_URL}/match`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(profile),
  // });
  // if (!res.ok) throw new Error("Failed to fetch matches");
  // return res.json();

  await delay(900);
  let results = [...MOCK_SCHOLARSHIPS];

  if (profile?.state && profile.state !== "Any") {
    results = results.filter((s) => s.state === profile.state || s.state === "All India");
  }
  if (profile?.category && profile.category !== "Any") {
    results = results.filter((s) => s.category === profile.category || s.category === "General");
  }

  results.sort((a, b) => b.match - a.match);
  return { results, total: results.length };
}

/**
 * GET /scholarships
 * List / browse all scholarships, optionally filtered.
 * @param {object} [filters]
 * @returns {Promise<{results: object[], total: number}>}
 */
async function getScholarships(filters = {}) {
  // ---- Real backend call ----
  // const params = new URLSearchParams(filters).toString();
  // const res = await fetch(`${API_BASE_URL}/scholarships?${params}`);
  // if (!res.ok) throw new Error("Failed to fetch scholarships");
  // return res.json();

  await delay(700);
  let results = [...MOCK_SCHOLARSHIPS];

  if (filters.state && filters.state !== "Any") {
    results = results.filter((s) => s.state === filters.state || s.state === "All India");
  }
  if (filters.category && filters.category !== "Any") {
    results = results.filter((s) => s.category === filters.category);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }
  if (filters.sort === "amount") {
    results.sort((a, b) => b.amount - a.amount);
  } else if (filters.sort === "deadline") {
    results.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else {
    results.sort((a, b) => b.match - a.match);
  }

  return { results, total: results.length };
}

/**
 * GET /scholarship/:id
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getScholarshipById(id) {
  // ---- Real backend call ----
  // const res = await fetch(`${API_BASE_URL}/scholarship/${id}`);
  // if (!res.ok) throw new Error("Scholarship not found");
  // return res.json();

  await delay(500);
  return MOCK_SCHOLARSHIPS.find((s) => s.id === id) || null;
}

/**
 * POST /chat
 * Send a natural-language message to the AI assistant.
 * @param {string} message
 * @param {object[]} [history] - prior chat turns, for context
 * @returns {Promise<{reply: string, scholarships?: object[]}>}
 */
async function sendChatMessage(message, history = []) {
  // ---- Real backend call ----
  // const res = await fetch(`${API_BASE_URL}/chat`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ message, history }),
  // });
  // if (!res.ok) throw new Error("Chat request failed");
  // return res.json();

  await delay(1100);
  const lower = message.toLowerCase();

  if (lower.includes("bihar") || lower.includes("income")) {
    const matches = MOCK_SCHOLARSHIPS.filter((s) => s.state === "Bihar" || s.state === "All India").slice(0, 3);
    return {
      reply: `Based on what you shared, you qualify for ${matches.length} scholarships. Here are your best matches:`,
      scholarships: matches,
    };
  }

  if (lower.includes("document")) {
    return {
      reply:
        "Most scholarships ask for an income certificate, your latest mark sheet, a valid ID, and proof of admission. Exact requirements vary — open any scholarship's details page to see its full checklist.",
    };
  }

  if (lower.includes("deadline")) {
    const soonest = [...MOCK_SCHOLARSHIPS].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
    return {
      reply: `The scholarship closing soonest is "${soonest.name}" on ${formatDate(soonest.deadline)}. Want me to pull up similar ones?`,
      scholarships: [soonest],
    };
  }

  if (lower.includes("engineer")) {
    const matches = MOCK_SCHOLARSHIPS.filter((s) => s.category === "STEM" || s.category === "General");
    return {
      reply: `Here are scholarships that fit engineering students:`,
      scholarships: matches,
    };
  }

  return {
    reply:
      "Tell me a bit about yourself — your state, category, and family income — and I'll find scholarships you actually qualify for.",
  };
}

/** Format an ISO date string as "15 Sep 2026". */
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Format a number as Indian rupees, e.g. 75000 -> "₹75,000". */
function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}
