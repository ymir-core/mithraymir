require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// برای اینکه بدنه JSON رو بخونه 👇
app.use(express.json());

// تست ساده (GET)
app.get("/", (req, res) => {
  res.send("🚀 سرور روشنه و کار می‌کنه!");
});

// هندل درخواست POST
app.post("/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "❌ پرامپت خالیه!" });
    }

    // تماس با OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    const answer = data.choices[0].message.content;
    res.json({ response: answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ خطای داخلی سرور" });
  }
});

// اجرا
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
