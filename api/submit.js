function getRequestText(body) {
  if (!body) return "";
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      return parsed?.text || "";
    } catch {
      return "";
    }
  }

  return body.text || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const text = getRequestText(req.body);
    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ error: "Empty text" });
    }

    const token = process.env.TG_BOT_TOKEN;
    const chatId = process.env.TG_CHAT_ID;
    if (!token || !chatId) {
      return res.status(500).json({ error: "Telegram is not configured" });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Новый ввод с сайта:\n\n${String(text).slice(0, 4000)}`,
      }),
    });

    if (!tgRes.ok) {
      const errText = await tgRes.text();
      return res.status(500).json({ error: "Telegram error", details: errText });
    }

    const result = await tgRes.json().catch(() => null);
    if (result && result.ok === false) {
      return res.status(500).json({ error: "Telegram error", details: result.description || "Unknown Telegram API error" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
