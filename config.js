// ISteamApps/GetAppList/v2 (unauthenticated) was retired by Valve.
// IStoreService/GetAppList/v1 is its replacement and requires a Steam Web
// API key, read from process.env.STEAM_API_KEY at request time in app.js.
// Never hardcode the key here, log it, or send it to the client.
export const steamLink =
  "https://api.steampowered.com/IStoreService/GetAppList/v1/";
