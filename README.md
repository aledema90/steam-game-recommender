# my_steam_app

This web app is meant to be helpful when you don't know what to play on Steam.

It will randomly pick a game from Steam public library and propose it to you: beware it can be everything, including DLC and bundles, no filters applied.

It is a hobby project that I am using to learn a little bit about NodeJS and web deployment.

## Setup

The app calls Steam's `IStoreService/GetAppList/v1`, which requires a Steam Web API key.

1. Get a free key at https://steamcommunity.com/dev/apikey
2. Copy `.env.example` to `.env` and fill in `STEAM_API_KEY` (never commit `.env`)
3. Run locally with `node --env-file=.env app.js` (Node 20.6+), or export `STEAM_API_KEY` in your shell before `npm start`
4. On Vercel, set `STEAM_API_KEY` as a project environment variable instead — do not commit it
