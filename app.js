import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());

// resolve static folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// sample emails
let emails = [
  {
    id: 1,
    subject: "Interested in your profile",
    from: "hr@company.com",
    date: "2025-11-08",
    body: "We would like to schedule an interview with you this week.",
    label: ""
  },
  {
    id: 2,
    subject: "Out of office",
    from: "ceo@startup.com",
    date: "2025-11-07",
    body: "I am currently out of office until Monday.",
    label: ""
  }
];

// offline “AI” categorization
function categorizeEmail(email) {
  const text = (email.subject + " " + email.body).toLowerCase();
  if (text.includes("interview") || text.includes("interested")) return "Interested";
  if (text.includes("meeting booked")) return "Meeting Booked";
  if (text.includes("out of office")) return "Out of Office";
  if (text.includes("spam") || text.includes("prize") || text.includes("win")) return "Spam";
  return "Not Interested";
}

// categorize initial emails
emails = emails.map(e => ({ ...e, label: categorizeEmail(e) }));

// Slack/Webhook mock notifier
async function notifyInterested(email) {
  console.log(`📣 New Interested email: ${email.subject} from ${email.from}`);
  if (process.env.SLACK_WEBHOOK_URL)
    await axios.post(process.env.SLACK_WEBHOOK_URL, { text: `Interested Email: ${email.subject}` }).catch(() => {});
  if (process.env.WEBHOOK_URL)
    await axios.post(process.env.WEBHOOK_URL, { event: "interested_email", email }).catch(() => {});
}

// auto notify for “Interested” emails
emails.filter(e => e.label === "Interested").forEach(notifyInterested);

// API routes

// ➕ Add new email
app.post("/api/emails", (req, res) => {
  const { subject, from, body } = req.body;
  if (!subject || !from || !body) return res.status(400).json({ error: "Missing fields" });
  const id = emails.length + 1;
  const date = new Date().toISOString().slice(0, 10);
  const label = categorizeEmail({ subject, body });
  const email = { id, subject, from, date, body, label };
  emails.push(email);
  if (label === "Interested") notifyInterested(email);
  res.json(email);
});

// 🔍 Search/list
app.get("/api/emails", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const filtered = emails.filter(
    e =>
      e.subject.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.from.toLowerCase().includes(q)
  );
  res.json(filtered);
});

// 💬 Suggest reply (mock RAG)
app.post("/api/emails/:id/reply", (req, res) => {
  const email = emails.find(e => e.id == req.params.id);
  if (!email) return res.status(404).json({ error: "Email not found" });

  let reply;
  switch (email.label) {
    case "Interested":
      reply = "Thank you for your interest! You can book a meeting here: https://cal.com/example";
      break;
    case "Out of Office":
      reply = "Thanks for letting me know. I’ll follow up when you’re back.";
      break;
    case "Spam":
      reply = "No reply needed.";
      break;
    default:
      reply = "Thank you for your message!";
  }
  res.json({ reply });
});

// start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Onebox demo running at http://localhost:${PORT}`));
