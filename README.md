# Telegram bot setup

This site sends form data to `/api/submit`, which forwards the message to Telegram.

The bot works only on a hosting platform that runs the `api/*.js` functions.
Static hosting such as GitHub Pages will not run the bot.

## Required environment variables

Set these variables in your hosting dashboard:

- `TG_BOT_TOKEN`
- `TG_CHAT_ID`

You can copy the names from `.env.example`.

## Quick check after deploy

Open `/api/health` on the deployed site.

- `telegramConfigured: true` means the variables are present.
- `telegramConfigured: false` means the bot is still disabled in the hosting environment.
