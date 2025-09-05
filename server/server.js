require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());

const PORT = 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

// ============================
// 1. ChatGPT - گرفتن کد
// ============================
app.post("/ask", async (req, res) => {
  const { prompt } = req.body;
  try {
    const r = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
    );

    const answer = r.data.choices[0].message.content;

    // ذخیره فایل موقت
    fs.writeFileSync("generated.txt", answer, "utf-8");

    res.json({ response: answer });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// ============================
// 2. آپلود به GitHub (با تایید کاربر)
// ============================
app.post("/upload", async (req, res) => {
  const { filename, content } = req.body;
  try {
    const r = await axios.put(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
      {
        message: `Upload ${filename}`,
        content: Buffer.from(content).toString("base64"),
      },
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
    );

    res.json({ success: true, url: r.data.content.html_url });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// ============================
// 3. لیست فایل‌های ریپو
// ============================
app.get("/files", async (req, res) => {
  try {
    const r = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO}/contents`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
    );
    res.json(r.data.map((f) => f.name));
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// ============================
// 4. دانلود فایل از GitHub
// ============================
app.get("/download/:filename", async (req, res) => {
  const { filename } = req.params;
  try {
    const r = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
    );

    const content = Buffer.from(r.data.content, "base64").toString("utf-8");

    fs.writeFileSync(filename, content, "utf-8");

    res.json({ success: true, file: filename, content });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// ============================
// 5. اجرای کد (Python, JS, Bash)
// ============================
app.post("/run", (req, res) => {
  const { filename } = req.body;
  if (!fs.existsSync(filename)) {
    return res.status(404).json({ error: "فایل پیدا نشد" });
  }

  let cmd;
  if (filename.endsWith(".py")) cmd = `python ${filename}`;
  else if (filename.endsWith(".js")) cmd = `node ${filename}`;
  else if (filename.endsWith(".sh")) cmd = `bash ${filename}`;
  else return res.status(400).json({ error: "نوع فایل پشتیبانی نمیشه" });

  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.json({ error: stderr });
    res.json({ output: stdout });
  });
});

// ============================
// 6. تست خودکار (Pipeline ساده)
// ============================
app.post("/test", (req, res) => {
  const { filename } = req.body;
  if (!fs.existsSync(filename)) {
    return res.status(404).json({ error: "فایل پیدا نشد" });
  }

  let cmd;
  if (filename.endsWith(".py")) cmd = `python -m py_compile ${filename}`;
  else if (filename.endsWith(".js")) cmd = `node --check ${filename}`;
  else return res.status(400).json({ error: "فقط Python و JS تست میشه" });

  exec(cmd, (err) => {
    if (err) return res.json({ success: false, error: err.toString() });
    res.json({ success: true, message: "✅ تست پاس شد" });
  });
});

// ============================
// 7. مانیتورینگ ساده
// ============================
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ============================
// Start Server
// ============================
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
