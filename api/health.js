export default function handler(req, res) {
  return res.status(200).json({
    ok: true,
    telegramConfigured: Boolean(process.env.TG_BOT_TOKEN && process.env.TG_CHAT_ID),
  });
}
