/**
 * assistant.js
 * ---------------------------------------------------------------------------
 * Drives the ChatGPT-style AI Assistant page: renders the conversation,
 * sends messages through the mock POST /chat endpoint (api.js), shows a
 * typing indicator while "thinking", and wires up suggested questions plus
 * a UI-only microphone toggle.
 * ---------------------------------------------------------------------------
 */

const chatHistory = [];

document.addEventListener("DOMContentLoaded", () => {
  const messagesEl = document.getElementById("chatMessages");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const micBtn = document.getElementById("micBtn");

  if (!messagesEl || !form) return;

  // Seed the conversation with a welcome message + one example exchange,
  // matching the brief's sample dialogue.
  appendMessage("ai", "Hi! Tell me about yourself and I'll find scholarships you qualify for.");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    autoGrow(input);
    await handleUserMessage(text);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener("input", () => autoGrow(input));

  document.querySelectorAll(".suggested-q").forEach((btn) => {
    btn.addEventListener("click", () => handleUserMessage(btn.dataset.q));
  });

  // Real microphone voice input powered by Web Speech API
  if (micBtn && window.setupVoiceInput) {
    window.setupVoiceInput({
      button: micBtn,
      input: input,
      onResult: () => autoGrow(input),
      onEnd: () => autoGrow(input),
    });
  }
});

function autoGrow(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
}

async function handleUserMessage(text) {
  appendMessage("user", text);
  chatHistory.push({ role: "user", content: text });

  const typingEl = appendTypingIndicator();

  try {
    const { reply, scholarships } = await sendChatMessage(text, chatHistory);
    typingEl.remove();
    appendMessage("ai", reply, scholarships);
    chatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    console.error(err);
    typingEl.remove();
    appendMessage("ai", "Sorry, something went wrong reaching the assistant. Please try again.");
    if (window.showToast) showToast("Chat request failed.");
  }
}

function appendMessage(role, text, scholarships) {
  const messagesEl = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = `chat-bubble-row ${role === "user" ? "is-user" : ""}`;

  const scholarshipsHTML =
    scholarships && scholarships.length
      ? `<ul>${scholarships
          .map((s) => `<li><strong>${s.name}</strong> — ${formatCurrency(s.amount)}, ${s.match}% match, due ${formatDate(s.deadline)}</li>`)
          .join("")}</ul>
         <div style="margin-top:10px;">
           <a href="results.html" class="btn btn-secondary btn-sm">View all matches</a>
         </div>`
      : "";

  row.innerHTML = `
    <div class="chat-avatar">${role === "user" ? "You" : "AI"}</div>
    <div class="chat-bubble">
      <div>${text}</div>
      ${scholarshipsHTML}
    </div>
  `;

  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function appendTypingIndicator() {
  const messagesEl = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = "chat-bubble-row";
  row.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="chat-bubble">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>
  `;
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}
