const API = "";

const els = {
  userId: document.getElementById("userId"),
  genreGrid: document.getElementById("genreGrid"),
  onboardBtn: document.getElementById("onboardBtn"),
  refreshFeedBtn: document.getElementById("refreshFeedBtn"),
  onboardStatus: document.getElementById("onboardStatus"),
  feedStatus: document.getElementById("feedStatus"),
  feedMeta: document.getElementById("feedMeta"),
  movieGrid: document.getElementById("movieGrid"),
};

let genres = [];
let selected = new Set();
let picksRequestGen = 0;
let userSwitchTimer = null;
let initialBoot = true;
/** Last user id we loaded picks/feed for; ignore spurious input when id unchanged. */
let lastAppliedUserId = null;

function validGenreIdSet() {
  return new Set(genres.map((g) => g.id));
}

function currentUserId() {
  const v = els.userId.value.trim();
  if (v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function sanitizeSelected() {
  const ok = validGenreIdSet();
  for (const id of [...selected]) {
    if (!ok.has(id)) selected.delete(id);
  }
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message)) ||
      `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

function clearGenreSelection() {
  selected.clear();
  syncChipState();
}

function renderGenres() {
  els.genreGrid.innerHTML = "";
  genres.forEach((g) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "genre-chip";
    btn.dataset.id = String(g.id);
    btn.textContent = g.name;
    btn.setAttribute("aria-pressed", "false");
    els.genreGrid.appendChild(btn);
  });
  syncChipState();
}

function toggleGenre(id) {
  sanitizeSelected();
  if (selected.has(id)) {
    selected.delete(id);
  } else {
    if (selected.size >= 3) return;
    selected.add(id);
  }
  syncChipState();
}

function syncChipState() {
  sanitizeSelected();
  const chips = els.genreGrid.querySelectorAll(".genre-chip");
  chips.forEach((chip) => {
    const id = parseInt(chip.dataset.id, 10);
    const on = selected.has(id);
    chip.classList.toggle("selected", on);
    chip.classList.toggle(
      "genre-chip--blocked",
      !on && selected.size >= 3
    );
    chip.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

els.genreGrid.addEventListener("click", (e) => {
  const chip = e.target.closest(".genre-chip");
  if (!chip || chip.classList.contains("genre-chip--blocked")) return;
  const id = parseInt(chip.dataset.id, 10);
  if (!Number.isFinite(id)) return;
  e.preventDefault();
  toggleGenre(id);
});

async function loadGenres() {
  try {
    genres = await fetchJson("/genres");
    renderGenres();
    els.onboardStatus.textContent = "";
    els.onboardStatus.className = "status";
  } catch (e) {
    els.onboardStatus.textContent = e.message;
    els.onboardStatus.className = "status error";
  }
}

async function loadUserPicksFor(targetUserId, { skipClear = false } = {}) {
  if (!genres.length || targetUserId == null) return;
  const gen = ++picksRequestGen;
  if (!skipClear) {
    clearGenreSelection();
  }
  const okIds = validGenreIdSet();
  try {
    const data = await fetchJson(
      `/user-picks?user_id=${encodeURIComponent(targetUserId)}`
    );
    if (gen !== picksRequestGen) return;
    if (currentUserId() !== targetUserId) return;

    selected.clear();
    const ids = Array.isArray(data.top_genres) ? data.top_genres : [];
    for (const raw of ids.slice(0, 3)) {
      const id = typeof raw === "number" ? raw : parseInt(String(raw), 10);
      if (Number.isFinite(id) && okIds.has(id)) selected.add(id);
    }
    syncChipState();
  } catch (e) {
    if (gen !== picksRequestGen) return;
    els.onboardStatus.textContent = e.message;
    els.onboardStatus.className = "status error";
  }
}

function scheduleUserContextReload() {
  if (initialBoot) return;

  clearTimeout(userSwitchTimer);
  els.onboardStatus.textContent = "";
  els.onboardStatus.className = "status";

  userSwitchTimer = setTimeout(async () => {
    const u = currentUserId();

    if (u === lastAppliedUserId) {
      return;
    }

    if (u === null) {
      lastAppliedUserId = null;
      clearGenreSelection();
      els.feedMeta.innerHTML = "";
      els.movieGrid.innerHTML =
        '<p class="empty-feed">Enter a user id (1 or higher).</p>';
      els.feedStatus.textContent = "";
      return;
    }

    lastAppliedUserId = u;
    clearGenreSelection();
    await loadUserPicksFor(u, { skipClear: true });
    if (currentUserId() !== u) return;
    await loadFeed();
  }, 200);
}

async function doOnboard() {
  els.onboardStatus.textContent = "";
  els.onboardStatus.className = "status";
  const u = currentUserId();
  if (u === null) {
    els.onboardStatus.textContent = "Enter a valid user id.";
    els.onboardStatus.className = "status error";
    return;
  }
  sanitizeSelected();
  if (selected.size !== 3) {
    els.onboardStatus.textContent = "Pick exactly three genres.";
    els.onboardStatus.className = "status error";
    return;
  }
  const top_genres = Array.from(selected);
  try {
    await fetchJson("/onboard", {
      method: "POST",
      body: JSON.stringify({ user_id: u, top_genres }),
    });
    els.onboardStatus.textContent = "Preferences saved. Loading feed…";
    els.onboardStatus.className = "status ok";
    lastAppliedUserId = u;
    await loadUserPicksFor(u, { skipClear: true });
    await loadFeed();
  } catch (e) {
    els.onboardStatus.textContent = e.message;
    els.onboardStatus.className = "status error";
  }
}

async function loadFeed() {
  els.feedStatus.textContent = "";
  els.feedStatus.className = "status";
  els.feedMeta.innerHTML = "";
  els.movieGrid.innerHTML = "";
  const u = currentUserId();
  if (u === null) {
    els.movieGrid.innerHTML =
      '<p class="empty-feed">Enter a user id to see a feed.</p>';
    return;
  }
  try {
    const limit = 20;
    const data = await fetchJson(
      `/feed?user_id=${encodeURIComponent(u)}&limit=${limit}`
    );
    const mix = data.mix || {};
    els.feedMeta.innerHTML = `
      <span class="mix-pill" title="Bucket counts">Personalized <strong>${mix.personalized ?? 0}</strong></span>
      <span class="mix-pill">Global <strong>${mix.global ?? 0}</strong></span>
      <span class="mix-pill">Discovery <strong>${mix.discovery ?? 0}</strong></span>
    `;
    if (!data.items || data.items.length === 0) {
      els.movieGrid.innerHTML =
        '<p class="empty-feed">No titles left to show (try another user id or watch fewer movies).</p>';
      return;
    }
    data.items.forEach((item) => {
      els.movieGrid.appendChild(movieCard(item));
    });
  } catch (e) {
    els.feedStatus.textContent = e.message;
    els.feedStatus.className = "status error";
  }
}

function genreListHtml(genres) {
  const g = Array.isArray(genres) ? genres : [];
  if (!g.length) return "";
  const items = g.map((name) => `<li>${escapeHtml(name)}</li>`).join("");
  return `<ul class="movie-genres" aria-label="Genres">${items}</ul>`;
}

function movieCard(item) {
  const card = document.createElement("article");
  card.className = "movie-card";
  const b = (item.bucket || "").toLowerCase();
  const bucketClass =
    b === "personalized" || b === "global" || b === "discovery" ? b : "global";
  card.innerHTML = `
    <span class="bucket ${bucketClass}">${escapeHtml(item.bucket || "")}</span>
    <h3 class="movie-title">${escapeHtml(item.title || "")}</h3>
    ${genreListHtml(item.genres)}
    <button type="button" class="btn btn-secondary btn-small watch-btn" data-mid="${item.movie_id}">Mark watched</button>
  `;
  card.querySelector(".watch-btn").addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const mid = parseInt(btn.dataset.mid, 10);
    const u = currentUserId();
    if (u === null) {
      els.feedStatus.textContent = "Set a valid user id first.";
      els.feedStatus.className = "status error";
      return;
    }
    btn.disabled = true;
    try {
      await fetchJson("/watch", {
        method: "POST",
        body: JSON.stringify({ user_id: u, movie_id: mid }),
      });
      await loadFeed();
    } catch (err) {
      els.feedStatus.textContent = err.message;
      els.feedStatus.className = "status error";
      btn.disabled = false;
    }
  });
  return card;
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

els.onboardBtn.addEventListener("click", (e) => {
  e.preventDefault();
  doOnboard();
});
els.refreshFeedBtn.addEventListener("click", (e) => {
  e.preventDefault();
  loadFeed();
});

els.userId.addEventListener("input", scheduleUserContextReload);
els.userId.addEventListener("change", scheduleUserContextReload);

loadGenres()
  .then(async () => {
    const u = currentUserId();
    if (u !== null) {
      await loadUserPicksFor(u, { skipClear: false });
    } else {
      clearGenreSelection();
    }
    await loadFeed();
    lastAppliedUserId = currentUserId();
  })
  .catch(() => {})
  .finally(() => {
    initialBoot = false;
  });
