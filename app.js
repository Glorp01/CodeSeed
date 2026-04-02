import { CATALOG, dailySeed, generateIdea, ideaToMarkdown, normalizeFilters } from "./src/generator.js";

const FAVORITES_KEY = "codeseed:favorites";
const favoritesLimit = 12;

const form = document.querySelector("#controls-form");
const seedInput = document.querySelector("#seed-input");
const platformSelect = document.querySelector("#platform-select");
const vibeSelect = document.querySelector("#vibe-select");
const scopeSelect = document.querySelector("#scope-select");
const titleNode = document.querySelector("#idea-title");
const pitchNode = document.querySelector("#idea-pitch");
const coreLoopNode = document.querySelector("#core-loop");
const repoAngleNode = document.querySelector("#repo-angle");
const repoBlurbNode = document.querySelector("#repo-blurb");
const mvpList = document.querySelector("#mvp-list");
const stretchList = document.querySelector("#stretch-list");
const ingredientList = document.querySelector("#ingredient-list");
const seedPill = document.querySelector("#seed-pill");
const timelinePill = document.querySelector("#timeline-pill");
const statusNode = document.querySelector("#status-message");
const favoritesList = document.querySelector("#favorites-list");

const state = {
  idea: null,
  favorites: loadFavorites()
};

function buildOption(label, value) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function populateSelect(select, items) {
  select.replaceChildren(buildOption("Any", ""));

  items.forEach((item) => {
    select.appendChild(buildOption(item.label, item.id));
  });
}

function sentenceCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function readHashState() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return {
    seed: params.get("seed") ?? "",
    filters: normalizeFilters({
      platform: params.get("platform"),
      vibe: params.get("vibe"),
      scope: params.get("scope")
    })
  };
}

function writeHashState(seed, filters) {
  const params = new URLSearchParams();
  params.set("seed", seed);

  if (filters.platform) {
    params.set("platform", filters.platform);
  }

  if (filters.vibe) {
    params.set("vibe", filters.vibe);
  }

  if (filters.scope) {
    params.set("scope", filters.scope);
  }

  const nextHash = params.toString();

  if (window.location.hash.slice(1) !== nextHash) {
    window.history.replaceState(null, "", `#${nextHash}`);
  }
}

function randomSeed() {
  const left = ["moss", "signal", "ember", "quiet", "gloss", "night", "maple", "orbit", "cinder"];
  const right = ["garden", "relay", "market", "harbor", "thread", "studio", "compass", "archive", "pocket"];
  const number = Math.floor(Math.random() * 900 + 100);
  return `${left[Math.floor(Math.random() * left.length)]}-${right[Math.floor(Math.random() * right.length)]}-${number}`;
}

function getFiltersFromForm() {
  return normalizeFilters({
    platform: platformSelect.value,
    vibe: vibeSelect.value,
    scope: scopeSelect.value
  });
}

function renderList(target, items) {
  target.replaceChildren();

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderIngredients(idea) {
  ingredientList.replaceChildren();
  const ingredients = [
    ["Platform", idea.ingredients.platform.label],
    ["Vibe", idea.ingredients.vibe.label],
    ["Scope", idea.ingredients.scope.label],
    ["Problem", sentenceCase(idea.ingredients.problem.id.replace(/-/g, " "))],
    ["Twist", sentenceCase(idea.ingredients.twist.id.replace(/-/g, " "))]
  ];

  ingredients.forEach(([label, value]) => {
    const chip = document.createElement("span");
    chip.className = "ingredient-chip";
    chip.innerHTML = `<strong>${label}:</strong> ${value}`;
    ingredientList.appendChild(chip);
  });
}

function renderIdea(idea) {
  state.idea = idea;
  titleNode.textContent = idea.title;
  pitchNode.textContent = idea.pitch;
  coreLoopNode.textContent = idea.coreLoop;
  repoAngleNode.textContent = idea.repoAngle;
  repoBlurbNode.textContent = idea.repoBlurb;
  seedPill.textContent = `Seed: ${idea.seed}`;
  timelinePill.textContent = `Scope: ${idea.ingredients.scope.label}`;
  renderIngredients(idea);
  renderList(mvpList, idea.mvp);
  renderList(stretchList, idea.stretch);
}

function showStatus(message) {
  statusNode.textContent = message;
  window.clearTimeout(showStatus.timeoutId);
  showStatus.timeoutId = window.setTimeout(() => {
    statusNode.textContent = "";
  }, 2200);
}

async function copyText(text, successMessage) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      showStatus(successMessage);
      return;
    }
  } catch {
    // Fall back below.
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
  showStatus(successMessage);
}

function favoriteKey(entry) {
  return `${entry.seed}|${entry.filters.platform ?? ""}|${entry.filters.vibe ?? ""}|${entry.filters.scope ?? ""}`;
}

function loadFavorites() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistFavorites() {
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
}

function renderFavorites() {
  favoritesList.replaceChildren();

  if (state.favorites.length === 0) {
    const empty = document.createElement("li");
    empty.className = "favorite-card";
    empty.innerHTML = "<p>No saved projects yet. Save one from the main card.</p>";
    favoritesList.appendChild(empty);
    return;
  }

  state.favorites.forEach((entry) => {
    const idea = generateIdea({ seed: entry.seed, filters: entry.filters });
    const item = document.createElement("li");
    item.className = "favorite-card";
    item.dataset.key = favoriteKey(entry);

    const chips = [
      idea.ingredients.platform.label,
      idea.ingredients.vibe.label,
      idea.ingredients.scope.label
    ]
      .map((value) => `<span class="ingredient-chip">${value}</span>`)
      .join("");

    item.innerHTML = `
      <h3>${idea.title}</h3>
      <p>${idea.pitch}</p>
      <div class="favorite-meta">${chips}</div>
      <div class="favorite-actions">
        <button class="button button-secondary" data-action="load" type="button">Open</button>
        <button class="button button-ghost" data-action="remove" type="button">Remove</button>
      </div>
    `;

    favoritesList.appendChild(item);
  });
}

function generateAndRender({ seed, filters }) {
  const idea = generateIdea({ seed, filters });
  renderIdea(idea);
  writeHashState(idea.seed, idea.filters);
  return idea;
}

function syncFormWithState({ seed, filters }) {
  seedInput.value = seed;
  platformSelect.value = filters.platform ?? "";
  vibeSelect.value = filters.vibe ?? "";
  scopeSelect.value = filters.scope ?? "";
}

populateSelect(platformSelect, CATALOG.platforms);
populateSelect(vibeSelect, CATALOG.vibes);
populateSelect(scopeSelect, CATALOG.scopes);

const hashState = readHashState();
const initialState = {
  seed: hashState.seed || dailySeed(),
  filters: hashState.filters
};

syncFormWithState(initialState);
generateAndRender(initialState);
renderFavorites();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const seed = seedInput.value.trim() || dailySeed();
  const filters = getFiltersFromForm();
  generateAndRender({ seed, filters });
});

document.querySelector("#surprise-button").addEventListener("click", () => {
  seedInput.value = randomSeed();
  const filters = getFiltersFromForm();
  generateAndRender({ seed: seedInput.value, filters });
});

document.querySelector("#reset-button").addEventListener("click", () => {
  seedInput.value = dailySeed();
  platformSelect.value = "";
  vibeSelect.value = "";
  scopeSelect.value = "";
  generateAndRender({ seed: seedInput.value, filters: getFiltersFromForm() });
});

document.querySelector("#save-button").addEventListener("click", () => {
  if (!state.idea) {
    return;
  }

  const entry = {
    seed: state.idea.seed,
    filters: state.idea.filters
  };

  if (state.favorites.some((favorite) => favoriteKey(favorite) === favoriteKey(entry))) {
    showStatus("This idea is already in the greenhouse.");
    return;
  }

  state.favorites = [entry, ...state.favorites].slice(0, favoritesLimit);
  persistFavorites();
  renderFavorites();
  showStatus("Saved to the greenhouse.");
});

document.querySelector("#share-button").addEventListener("click", async () => {
  await copyText(window.location.href, "Share link copied.");
});

document.querySelector("#markdown-button").addEventListener("click", async () => {
  if (!state.idea) {
    return;
  }

  await copyText(ideaToMarkdown(state.idea), "Markdown copied.");
});

favoritesList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const card = button.closest("[data-key]");

  if (!card) {
    return;
  }

  const entry = state.favorites.find((favorite) => favoriteKey(favorite) === card.dataset.key);

  if (!entry) {
    return;
  }

  if (button.dataset.action === "remove") {
    state.favorites = state.favorites.filter((favorite) => favoriteKey(favorite) !== card.dataset.key);
    persistFavorites();
    renderFavorites();
    showStatus("Saved idea removed.");
    return;
  }

  syncFormWithState(entry);
  generateAndRender(entry);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("hashchange", () => {
  const nextState = readHashState();
  const seed = nextState.seed || dailySeed();
  syncFormWithState({ seed, filters: nextState.filters });
  generateAndRender({ seed, filters: nextState.filters });
});
