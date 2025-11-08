async function loadEmails() {
  const q = document.getElementById("searchInput").value;
  const res = await fetch(`/api/emails?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  renderEmails(data);
}

async function addEmail() {
  const subject = document.getElementById("subjectInput").value.trim();
  const from = document.getElementById("fromInput").value.trim();
  const body = document.getElementById("bodyInput").value.trim();

  if (!subject || !from || !body) {
    alert("⚠️ Please fill all fields");
    return;
  }

  const res = await fetch("/api/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, from, body })
  });
  const data = await res.json();

  document.getElementById("subjectInput").value = "";
  document.getElementById("fromInput").value = "";
  document.getElementById("bodyInput").value = "";

  alert(`✅ Email added (${data.label})`);
  loadEmails();
}

async function suggestReply(id) {
  const res = await fetch(`/api/emails/${id}/reply`, { method: "POST" });
  const data = await res.json();
  alert("💬 Suggested Reply:\n\n" + data.reply);
}

function renderEmails(emails) {
  const container = document.getElementById("emails");
  container.innerHTML = "";

  if (emails.length === 0) {
    container.innerHTML = "<p style='text-align:center;color:#777'>No emails found</p>";
    return;
  }

  emails.forEach(e => {
    const div = document.createElement("div");
    div.className = "email-card";
    div.innerHTML = `
      <h3>${e.subject}</h3>
      <p><strong>From:</strong> ${e.from}</p>
      <p><strong>Date:</strong> ${e.date}</p>
      <p>${e.body}</p>
      <span class="badge ${e.label.replaceAll(" ", "")}">${e.label}</span><br>
      <button class="reply-btn" onclick="suggestReply(${e.id})">💡 Suggest Reply</button>
    `;
    container.appendChild(div);
  });
}

window.onload = loadEmails;
