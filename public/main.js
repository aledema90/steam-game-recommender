// Utility functions
const showElement = (elementId) =>
  document.getElementById(elementId).classList.remove("hidden");
const hideElement = (elementId) =>
  document.getElementById(elementId).classList.add("hidden");
const showError = (message) => {
  const errorElement = document.getElementById("error-message");
  errorElement.textContent = message;
  showElement("error-message");
  setTimeout(() => hideElement("error-message"), 5000);
};

// State management
let allGames = [];
let filteredGames = [];

// Search functionality
const searchInput = document.getElementById("search-games");
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  filteredGames = allGames.filter((game) =>
    game.name.toLowerCase().includes(searchTerm)
  );
  displayGames(filteredGames);
});

// Display games in a grid
const displayGames = (games) => {
  const gamesGrid = document.getElementById("games-grid");
  gamesGrid.innerHTML = "";

  games.forEach((game) => {
    const gameCard = document.createElement("div");
    gameCard.className = "game-card animate-fade-in";

    const title = document.createElement("h3");
    title.className = "font-semibold text-lg mb-2";
    title.textContent = game.name;

    const appId = document.createElement("p");
    appId.className = "text-sm text-gray-400";
    appId.textContent = `App ID: ${game.appid}`;

    gameCard.appendChild(title);
    gameCard.appendChild(appId);
    gamesGrid.appendChild(gameCard);
  });
};

// Create tag elements
const createTags = (tags, containerId) => {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  tags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.className = "tag";
    tagElement.textContent = tag;
    container.appendChild(tagElement);
  });
};

// Display random game details
const displayRandomGame = (game) => {
  // Update game image
  const gameImage = document.getElementById("game-image");
  gameImage.src = game.header_image;
  gameImage.alt = `${game.name} header image`;

  // Update game title
  document.getElementById("game-title").textContent = game.name;

  // Update price and release date
  document.getElementById("game-price").textContent = game.price;
  document.getElementById("game-release").textContent = game.release_date;

  // Update description
  document.getElementById("game-description").textContent =
    game.short_description;

  // Update categories and genres
  createTags(game.categories, "game-categories");
  createTags(game.genres, "game-genres");

  // Show the game card
  hideElement("loading");
  showElement("random-game");
};

// Get random game
document.getElementById("get-game").addEventListener("click", async () => {
  try {
    hideElement("games-container");
    hideElement("search-container");
    showElement("loading");
    hideElement("random-game");

    const response = await fetch("/random-game");
    if (!response.ok) throw new Error("Failed to fetch random game");

    const game = await response.json();
    displayRandomGame(game);
  } catch (error) {
    hideElement("loading");
    showError("Failed to fetch random game. Please try again.");
    console.error("Error fetching random game:", error);
  }
});

// Get all games
document.getElementById("get-all-games").addEventListener("click", async () => {
  try {
    hideElement("random-game");
    showElement("loading");
    showElement("search-container");
    hideElement("games-container");

    const response = await fetch("/games");
    if (!response.ok) throw new Error("Failed to fetch games");

    const data = await response.json();
    allGames = data.applist.apps.filter((game) => game.name.trim() !== "");
    filteredGames = [...allGames];

    hideElement("loading");
    showElement("games-container");
    displayGames(filteredGames);
  } catch (error) {
    hideElement("loading");
    showError("Failed to fetch games. Please try again.");
    console.error("Error fetching games:", error);
  }
});
