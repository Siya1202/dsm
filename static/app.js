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

function uid() {
  const n = parseInt(els.userId.value, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
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

function renderGenres() {
  els.genreGrid.innerHTML = "";
  genres.forEach((g) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "genre-chip";
    btn.dataset.id = String(g.id);
    btn.textContent = g.name;
    btn.addEventListener("click", () => toggleGenre(g.id, btn));
    els.genreGrid.appendChild(btn);
  });
  syncChipState();
}

function toggleGenre(id, btn) {
  if (selected.has(id)) {
    selected.delete(id);
  } else {
    if (selected.size >= 3) return;
    selected.add(id);
  }
  syncChipState();
}

function syncChipState() {
  const chips = els.genreGrid.querySelectorAll(".genre-chip");
  chips.forEach((chip) => {
    const id = parseInt(chip.dataset.id, 10);
    const on = selected.has(id);
    chip.classList.toggle("selected", on);
    chip.disabled = !on && selected.size >= 3;
  });
}

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

async function doOnboard() {
  els.onboardStatus.textContent = "";
  els.onboardStatus.className = "status";
  if (selected.size !== 3) {
    els.onboardStatus.textContent = "Pick exactly three genres.";
    els.onboardStatus.className = "status error";
    return;
  }
  const top_genres = Array.from(selected);
  try {
    await fetchJson("/onboard", {
      method: "POST",
      body: JSON.stringify({ user_id: uid(), top_genres }),
    });
    els.onboardStatus.textContent = "Preferences saved. Loading feed…";
    els.onboardStatus.className = "status ok";
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
  try {
    const limit = 20;
    const data = await fetchJson(
      `/feed?user_id=${encodeURIComponent(uid())}&limit=${limit}`
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
    btn.disabled = true;
    try {
      await fetchJson("/watch", {
        method: "POST",
        body: JSON.stringify({ user_id: uid(), movie_id: mid }),
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

els.onboardBtn.addEventListener("click", doOnboard);
els.refreshFeedBtn.addEventListener("click", loadFeed);
els.userId.addEventListener("change", () => loadFeed());

loadGenres().then(() => loadFeed());
