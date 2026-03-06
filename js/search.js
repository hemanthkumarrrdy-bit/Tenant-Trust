// ============================================================
// search.js — Search Page Logic
// ============================================================

let allLandlords = [];
let allBuildings = [];
let currentView = 'list';
let mapInstance = null;
let mapMarkers = [];

async function initSearch() {
    allLandlords = await fetchData('/api/landlords') || [];
    allBuildings = await fetchData('/api/buildings') || [];

    // Pre-fill from URL query
    const q = getParam('q');
    if (q) document.getElementById('search-input').value = q;

    applyFilters();

    // Enter key on search input
    document.getElementById('search-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') applyFilters();
    });
}

function applyFilters() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    const city = document.getElementById('f-city').value;
    const minRating = parseFloat(document.getElementById('f-rating').value) || 0;
    const verified = document.getElementById('f-verified').value;
    const minFrs = parseFloat(document.getElementById('f-frs').value) || 0;
    const sort = document.getElementById('f-sort').value;

    let results = allLandlords.filter(l => {
        if (q && !l.name.toLowerCase().includes(q) && !l.areas.join(' ').toLowerCase().includes(q) && !l.city.toLowerCase().includes(q)) return false;
        if (city && l.city !== city) return false;
        if (l.rating < minRating) return false;
        if (verified === 'yes' && !l.verified) return false;
        if (verified === 'no' && l.verified) return false;
        if (l.fairRentScore < minFrs) return false;
        return true;
    });

    // Sort
    results.sort((a, b) => {
        if (sort === 'rating') return b.rating - a.rating;
        if (sort === 'frs') return b.fairRentScore - a.fairRentScore;
        if (sort === 'reviews') return b.totalReviews - a.totalReviews;
        return 0;
    });

    document.getElementById('result-count').innerHTML = `Showing <strong>${results.length}</strong> landlord${results.length !== 1 ? 's' : ''}`;
    renderList(results);
    if (currentView === 'map') renderMap(results);
}

function renderList(results) {
    const container = document.getElementById('results-list');
    if (!results.length) {
        container.innerHTML = `<div class="no-results card"><div class="icon">🔍</div><h3>No results found</h3><p class="mt-1">Try adjusting your search or filters.</p></div>`;
        return;
    }
    container.innerHTML = results.map(l => {
        const frsClass = l.fairRentScore >= 80 ? 'fair' : l.fairRentScore >= 60 ? 'caution' : 'danger';
        const stars = Array.from({ length: 5 }, (_, i) => `<span class="star${i < Math.round(l.rating) ? '' : ' empty'}">★</span>`).join('');
        const building = allBuildings.find(b => b.landlordId === l.id);
        const flagsHtml = l.redFlags.length ? l.redFlags.slice(0, 2).map(f => `<div class="result-flag-item">⚠️ ${f}</div>`).join('') : '';

        return `
    <div class="card result-card" onclick="window.location='landlord.html?id=${l.id}'" style="margin-bottom:14px">
      <div class="avatar avatar-lg">${l.avatar}</div>
      <div class="result-body">
        <div class="result-name">
          ${l.name}
          ${l.verified ? '<span class="badge badge-info" style="font-size:10px">✓ Verified</span>' : '<span class="badge badge-muted" style="font-size:10px">Unverified</span>'}
        </div>
        <div class="result-area">📍 ${l.areas.join(', ')} · ${l.city}</div>
        <div class="result-row">
          <span class="stars">${stars}</span>
          <span class="result-rating-num">${l.rating.toFixed(1)}</span>
          <span class="result-reviews">(${l.totalReviews} reviews)</span>
          ${building ? `<a href="building.html?id=${building.id}" class="badge badge-muted" onclick="event.stopPropagation()">🏢 ${building.name}</a>` : ''}
        </div>
        <div class="result-row">
          <span class="text-xs text-muted">⏱ Response: ${l.responseTime}</span>
          <span class="text-xs text-muted">🏠 ${l.propertiesManaged} properties</span>
        </div>
        ${flagsHtml ? `<div class="result-flags">${flagsHtml}</div>` : ''}
      </div>
      <div class="result-right">
        <div class="score-mini ${frsClass}">
          <div class="val">${l.fairRentScore}</div>
          <div class="lbl">FRS</div>
        </div>
        <span class="btn btn-secondary btn-sm">View Profile →</span>
      </div>
    </div>`;
    }).join('');
}

function setView(view) {
    currentView = view;
    document.getElementById('btn-list').classList.toggle('active', view === 'list');
    document.getElementById('btn-map').classList.toggle('active', view === 'map');
    document.getElementById('map-panel').classList.toggle('hidden', view === 'list');
    document.getElementById('results-layout').classList.toggle('map-mode', view === 'map');

    if (view === 'map') {
        initMapInstance();
        const results = allLandlords; // simplified — show all on map
        renderMap(results);
    }
}

function initMapInstance() {
    if (mapInstance) return;
    mapInstance = L.map('map').setView([19.076, 72.877], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Dark tile overlay style via CSS
    document.querySelector('.leaflet-layer')?.setAttribute('style', 'filter:invert(0.9) hue-rotate(180deg) brightness(0.85)');
}

function renderMap(results) {
    if (!mapInstance) return;
    mapMarkers.forEach(m => m.remove());
    mapMarkers = [];

    allBuildings.forEach(b => {
        const landlord = results.find(l => l.id === b.landlordId);
        if (!landlord) return;
        const frsColor = landlord.fairRentScore >= 80 ? '#00e676' : landlord.fairRentScore >= 60 ? '#ffca28' : '#ff5252';
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:${frsColor};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#0a0c18;border:3px solid rgba(255,255,255,0.3);box-shadow:0 2px 10px rgba(0,0,0,0.5)">${landlord.fairRentScore}</div>`,
            iconSize: [36, 36], iconAnchor: [18, 18]
        });
        const marker = L.marker([b.lat, b.lng], { icon })
            .addTo(mapInstance)
            .bindPopup(`<b>${landlord.name}</b><br>⭐ ${landlord.rating} · FRS: ${landlord.fairRentScore}<br>${b.address}`);
        mapMarkers.push(marker);
    });
}

document.addEventListener('DOMContentLoaded', initSearch);
