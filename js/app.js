const results = document.querySelector('#results');
const searchInput = document.querySelector('#search-input');
const resultCount = document.querySelector('#result-count');
const activeFilters = document.querySelector('#active-filters');
const filterDialog = document.querySelector('#filter-dialog');
const gameDialog = document.querySelector('#game-dialog');
const filterForm = document.querySelector('#filter-form');
let games = [];

const normalise = (value) => value.toLowerCase().replaceAll('å', 'a').replaceAll('ø', 'o').replaceAll('æ', 'ae');

async function loadGames() {
  try {
    const response = await fetch('./assets/games/games.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    games = await response.json();
    render();
  } catch {
    results.innerHTML = '<p class="empty-state" role="alert">Spillene kunne ikke hentes lige nu.</p>';
  }
}

function selectedFilters() {
  const data = new FormData(filterForm);
  return { ...Object.fromEntries(data.entries()), genre: data.getAll('genre') };
}

function filteredGames() {
  const filters = selectedFilters();
  const query = normalise(searchInput.value.trim());
  return games.filter((game) => {
    const matchesSearch = !query || normalise(`${game.title} ${game.description}`).includes(query);
    const matchesLocation = filters.location === 'alle' || normalise(game.location) === normalise(filters.location);
    const matchesPlayers = filters.players === 'alle' || (game.players.min <= Number(filters.players) && game.players.max >= Number(filters.players));
    const matchesGenre = filters.genre.includes('alle') || filters.genre.includes(game.genre);
    const matchesDifficulty = filters.difficulty === 'alle' || game.difficulty === filters.difficulty;
    const matchesTime = filters.time === 'alle' || game.playtime <= Number(filters.time);
    return matchesSearch && matchesLocation && matchesPlayers && matchesGenre && matchesDifficulty && matchesTime;
  });
}

function gameCard(game) {
  return `<button class="game-card" type="button" data-game-id="${game.id}"><span class="card-image"><img src="${game.image}" alt="${game.title}"><span class="rating" aria-label="Bedømmelse ${game.rating} ud af 5">★ ${game.rating}</span></span><h3>${game.title}</h3><span class="card-meta"><span>${game.players.min}-${game.players.max} spillere</span><span>${game.playtime} min.</span></span></button>`;
}

function render() {
  const visibleGames = filteredGames();
  resultCount.textContent = `${visibleGames.length} af ${games.length} spil`;
  renderActiveFilters();
  if (!visibleGames.length) { results.innerHTML = '<p class="empty-state">Ingen spil matcher dine filtre.</p>'; return; }
  const popular = visibleGames.slice().sort((a, b) => b.rating - a.rating).slice(0, 4);
  const popularIds = new Set(popular.map((game) => game.id));
  const rest = visibleGames.filter((game) => !popularIds.has(game.id));
  results.innerHTML = `<section class="game-section" aria-labelledby="popular-title"><h2 id="popular-title">Mest populære</h2><div class="game-grid">${popular.map(gameCard).join('')}</div></section>${rest.length ? `<section class="game-section" aria-labelledby="all-title"><h2 id="all-title">Alle spil</h2><div class="game-grid">${rest.map(gameCard).join('')}</div></section>` : ''}`;
}

function renderActiveFilters() {
  const labels = { location: 'Sted', players: 'Spillere', difficulty: 'Sværhedsgrad', time: 'Spilletid' };
  activeFilters.innerHTML = Object.entries(selectedFilters()).filter(([key, value]) => key !== 'genre' && value !== 'alle').map(([key, value]) => `<span>${labels[key]}: ${value}${key === 'time' ? ' min.' : ''}</span>`).join('');
  const genres = selectedFilters().genre.filter((genre) => genre !== 'alle');
  if (genres.length) activeFilters.insertAdjacentHTML('beforeend', `<span>Genre: ${genres.join(', ')}</span>`);
}

function showGame(game) {
  gameDialog.innerHTML = `<article class="game-detail"><header class="detail-header"><div><p class="detail-label">Spiloversigt / ${game.title}</p><h2 id="game-title">${game.title}</h2><p>${game.description}</p></div><button class="detail-close" type="button" data-close-game>Luk</button></header><div class="detail-main"><div class="detail-image"><img src="${game.image}" alt="${game.title}"></div><dl class="detail-facts"><div><dt>Genre</dt><dd><strong>${game.genre}</strong></dd></div><div><dt>Sværhedsgrad</dt><dd><strong>${game.difficulty}</strong></dd></div><div><dt>Spilletid</dt><dd><strong>${game.playtime} minutter</strong></dd></div><div><dt>Antal spillere</dt><dd><strong>${game.players.min}-${game.players.max} spillere</strong></dd></div><div><dt>Alder</dt><dd><strong>Fra ${game.age} år</strong></dd></div><div><dt>Findes på hylde</dt><dd><strong>${game.shelf}</strong></dd></div></dl></div><section class="rules"><h3>Sådan spiller I</h3><p>${game.rules}</p></section></article>`;
  gameDialog.showModal();
}

document.querySelector('#filter-button').addEventListener('click', () => filterDialog.showModal());
document.querySelector('#reset-filters').addEventListener('click', () => { filterForm.reset(); render(); });
filterForm.addEventListener('change', (event) => {
  if (event.target.name === 'genre') {
    const genreInputs = filterForm.querySelectorAll('input[name="genre"]');
    if (event.target.value === 'alle' && event.target.checked) genreInputs.forEach((input) => { if (input !== event.target) input.checked = false; });
    if (event.target.value !== 'alle' && event.target.checked) filterForm.querySelector('input[name="genre"][value="alle"]').checked = false;
    if (![...genreInputs].some((input) => input.checked)) filterForm.querySelector('input[name="genre"][value="alle"]').checked = true;
  }
  render();
});
searchInput.addEventListener('input', render);
results.addEventListener('click', (event) => { const card = event.target.closest('[data-game-id]'); if (card) showGame(games.find((game) => game.id === Number(card.dataset.gameId))); });
gameDialog.addEventListener('click', (event) => { if (event.target === gameDialog || event.target.closest('[data-close-game]')) gameDialog.close(); });
loadGames();
