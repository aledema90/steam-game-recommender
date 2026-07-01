// Import the necessary modules
import express from "express"; // Import Express framework
import helmet from "helmet"; // Security-related HTTP headers
import fetch from "node-fetch"; // Import node-fetch for making HTTP requests
import { steamLink } from "./config.js"; // Import variables from config file

const app = express(); // Create an instance of Express
const port = process.env.PORT || 3000; // Define the port on which the server will run or use the PORT environment variable if available
const STEAM_API_KEY = process.env.STEAM_API_KEY; // Required by IStoreService/GetAppList/v1

if (!STEAM_API_KEY) {
  console.warn(
    "STEAM_API_KEY is not set. /games and /random-game will return 500 until it is configured."
  );
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Game header images are served from Steam's CDN domains.
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
);

// The frontend is served from this same origin, so cross-origin access is
// disabled by default. Set ALLOWED_ORIGIN if external clients need the API.
const allowedOrigin = process.env.ALLOWED_ORIGIN;
if (allowedOrigin) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });
}

app.use(express.static("public")); // Serve static files from the 'public' directory

// Helper function to fetch game details with timeout
async function getGameDetails(appId) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data[appId] || !data[appId].data) {
      throw new Error("Invalid game data received");
    }
    return data[appId].data;
  } catch (error) {
    console.error("Error fetching game details:", error);
    return null;
  }
}

// Fetches the full Steam app catalog via IStoreService/GetAppList/v1,
// following its cursor-based pagination (have_more_results/last_appid).
async function fetchAppList() {
  if (!STEAM_API_KEY) {
    throw new Error("STEAM_API_KEY is not configured on the server");
  }

  const apps = [];
  let lastAppId = 0;
  let hasMore = true;
  let page = 0;
  const maxPages = 20; // safety bound, ~1M apps at 50k/page

  while (hasMore && page < maxPages) {
    const params = new URLSearchParams({
      key: STEAM_API_KEY,
      include_games: "true",
      include_dlc: "false",
      include_software: "false",
      include_videos: "false",
      include_hardware: "false",
      max_results: "50000",
      last_appid: String(lastAppId),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(`${steamLink}?${params}`, {
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const page_apps = data.response?.apps || [];
    apps.push(...page_apps);

    hasMore = Boolean(data.response?.have_more_results);
    lastAppId = data.response?.last_appid;
    page++;
  }

  return { applist: { apps } };
}

// Define an endpoint to get all games
app.get("/games", async (req, res) => {
  try {
    const data = await fetchAppList();
    res.json(data);
  } catch (error) {
    console.error("Error fetching game list:", error.message);
    res.status(500).json({
      error: "Failed to fetch game list",
      message: error.message,
    });
  }
});

// Define an endpoint to get a random game with details
app.get("/random-game", async (req, res) => {
  try {
    const data = await fetchAppList();
    const games = data.applist.apps;

    // Keep trying until we find a game with details
    let gameDetails = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!gameDetails && attempts < maxAttempts) {
      const randomGame = games[Math.floor(Math.random() * games.length)];
      gameDetails = await getGameDetails(randomGame.appid);
      attempts++;
    }

    if (!gameDetails) {
      throw new Error(
        "Could not find a game with details after multiple attempts"
      );
    }

    res.json({
      appid: gameDetails.steam_appid,
      name: gameDetails.name,
      header_image: gameDetails.header_image,
      short_description: gameDetails.short_description,
      price: gameDetails.is_free
        ? "Free to Play"
        : gameDetails.price_overview
        ? `$${(gameDetails.price_overview.final / 100).toFixed(2)}`
        : "Price not available",
      categories: gameDetails.categories?.map((cat) => cat.description) || [],
      genres: gameDetails.genres?.map((genre) => genre.description) || [],
      release_date:
        gameDetails.release_date?.date || "Release date not available",
    });
  } catch (error) {
    console.error("Error in random-game endpoint:", error.message);
    res.status(500).json({
      error: "Failed to fetch game details",
      message: error.message,
    });
  }
});

//Get the details of a single game

// Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // Log a message when the server starts
});
