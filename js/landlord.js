// ============================================================
// landlord.js — Landlord Profile Page Logic
// ============================================================

async function initLandlordProfile() {
  const id = getParam('id') || 'L001';

  const landlord = await fetchData(`/api/landlords/${id}`);
  if (!landlord || landlord.error) {
    document.getElementById('profile-content').innerHTML = `<div class="card" style="text-align:center;padding:40px"><h3>Landlord not found</h3><p class="mt-1"><a href="search.html" class="btn btn-primary btn-sm mt-2">Back to Search</a></p></div>`;
    return;
  }

  // Landlord includes a `landlord` field with building ref — fetch building separately if needed
  const buildings = await fetchData('/api/buildings');
  const building = buildings?.find(b => b.landlord_id === id);
  renderProfile(landlord, building);
}

function renderProfile(landlord, building) {
  const frsClass = landlord.fairRentScore >= 80 ? 'fair' : landlord.fairRentScore >= 60 ? 'caution' : 'danger';
  const frsConfig = getFrsVerdict(landlord.fairRentScore);
  const ratingsBig = Object.entries(landlord.ratings);

  const redFlagsHtml = landlord.redFlags.length
    ? landlord.redFlags.map(f => `<div class="red-flag"><span class="red-flag-icon">🚩</span><span>${f}</span></div>`).join('')
    : `<div style="font-size:14px;color:var(--success);padding:12px 0">✅ No red flags reported for this landlord.</div>`;

  const propertiesHtml = landlord.properties.map(p => `
    <div class="property-item">
      <div class="property-icon">🏠</div>
      <div class="property-detail">
        <div class="addr">${p.address}</div>
        <div class="rent">${p.bhk} BHK · ₹${p.rent.toLocaleString('en-IN')}/mo</div>
      </div>
    </div>`).join('');

  const reviewsHtml = landlord.reviews.map(r => {
    const initials = r.anonymous ? '?' : r.author.split(' ').map(x => x[0]).join('');
    const starsHtml = Array.from({ length: 5 }, (_, i) => `<span class="star${i < r.rating ? '' : ' empty'}">★</span>`).join('');
    return `
    <div class="review-item">
      <div class="review-top">
        <div class="reviewer">
          <div class="avatar avatar-sm" style="${r.anonymous ? 'background:rgba(255,255,255,0.1)' : ''}">${initials}</div>
          <div>
            <div class="name">${r.author}</div>
            <div class="date">${r.date}</div>
          </div>
        </div>
        <div class="stars">${starsHtml}</div>
      </div>
      <div class="review-body">"${r.text}"</div>
      <div class="review-actions">
        <button class="upvote-btn" onclick="this.textContent='👍 '+(parseInt(this.textContent.replace(/\D/g,''))+1);this.style.color='var(--accent-cyan)'">👍 ${r.upvotes}</button>
        <button class="upvote-btn" onclick="showToast('Review flagged for review.','success')">🚩 Flag</button>
        ${r.anonymous ? `<span class="badge badge-muted" style="font-size:10px">Anonymous</span>` : ''}
      </div>
    </div>`;
  }).join('');

  const ratingBarsHtml = ratingsBig.map(([key, val]) => `
    <div class="rating-bar-wrap">
      <div class="rating-bar-label">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
      <div class="rating-bar-track"><div class="rating-bar-fill" style="width:${(val / 5) * 100}%"></div></div>
      <div class="rating-bar-val">${val.toFixed(1)}</div>
    </div>`).join('');

  document.getElementById('profile-content').innerHTML = `
  <!-- Profile Header -->
  <div class="profile-header animate-fade-up">
    <div class="avatar avatar-lg">${landlord.avatar}</div>
    <div class="profile-info">
      <div class="profile-name">
        ${landlord.name}
        ${landlord.verified
      ? `<span class="badge badge-info">✓ Verified</span>`
      : `<span class="badge badge-muted">Unverified</span>`}
      </div>
      <div class="profile-meta">
        <span>📍 ${landlord.areas.join(', ')}, ${landlord.city}</span>
        <span>🏠 <strong>${landlord.propertiesManaged}</strong> Properties</span>
        <span>⏱ Response: <strong>${landlord.responseTime}</strong></span>
        <span>💬 <strong>${landlord.totalReviews}</strong> Reviews</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="font-size:32px;font-weight:900;color:var(--warning)">${landlord.rating.toFixed(1)}</span>
        <div class="stars" style="font-size:22px">${Array.from({ length: 5 }, (_, i) => `<span class="star${i < Math.round(landlord.rating) ? '' : ' empty'}">★</span>`).join('')}</div>
        <span class="text-muted text-sm">(${landlord.totalReviews} reviews)</span>
      </div>
    </div>
    <div class="profile-right">
      <div class="score-mini ${frsClass}" style="width:72px;height:72px">
        <div class="val" style="font-size:22px">${landlord.fairRentScore}</div>
        <div class="lbl">FRS</div>
      </div>
      <span class="verdict verdict-${frsConfig.class}" style="font-size:12px">${frsConfig.emoji} ${frsConfig.label}</span>
      ${building ? `<a href="building.html?id=${building.id}" class="btn btn-secondary btn-sm">🏢 View Building</a>` : ''}
    </div>
  </div>

  <!-- Two column layout -->
  <div class="profile-layout">
    <!-- Left column -->
    <div>
      <!-- Rating breakdown -->
      <div class="card ratings-section mb-2" data-reveal style="margin-bottom:20px">
        <h4>Rating Breakdown</h4>
        ${ratingBarsHtml}
      </div>

      <!-- Radar chart -->
      <div class="card chart-wrap" data-reveal style="margin-bottom:20px">
        <h4>Performance Overview</h4>
        <div class="chart-container">
          <canvas id="radarChart"></canvas>
        </div>
      </div>

      <!-- Reviews -->
      <h3 style="margin-bottom:16px;font-size:16px" data-reveal>Tenant Reviews <span class="badge badge-muted" style="font-size:11px">${landlord.reviews.length}</span></h3>
      <div id="reviews-list" data-reveal>${reviewsHtml}</div>
      <div class="text-center mt-2" data-reveal>
        <a href="submit-review.html?landlord=${encodeURIComponent(landlord.name)}" class="btn btn-primary">Write a Review</a>
      </div>
    </div>

    <!-- Right column -->
    <div>
      <!-- Red flags -->
      <div class="card sidebar-card" data-reveal style="margin-bottom:20px">
        <h4>⚠️ Red Flags & Alerts</h4>
        ${redFlagsHtml}
      </div>

      <!-- Properties -->
      <div class="card sidebar-card" data-reveal style="margin-bottom:20px">
        <h4>🏠 Properties Managed</h4>
        ${propertiesHtml}
      </div>

      <!-- Quick stats -->
      <div class="card sidebar-card" data-reveal>
        <h4>📊 Quick Stats</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">
          <div class="stat-box" style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid var(--border)">
            <div class="stat-value" style="font-size:1.5rem">${landlord.rating}</div>
            <div class="stat-label">Avg Rating</div>
          </div>
          <div class="stat-box" style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid var(--border)">
            <div class="stat-value" style="font-size:1.5rem">${landlord.fairRentScore}</div>
            <div class="stat-label">Fair Rent Score</div>
          </div>
          <div class="stat-box" style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid var(--border)">
            <div class="stat-value" style="font-size:1.5rem">${landlord.totalReviews}</div>
            <div class="stat-label">Reviews</div>
          </div>
          <div class="stat-box" style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid var(--border)">
            <div class="stat-value" style="font-size:1.5rem">${landlord.propertiesManaged}</div>
            <div class="stat-label">Properties</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // Render radar chart
  setTimeout(() => {
    const ctx = document.getElementById('radarChart')?.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Responsiveness', 'Maintenance', 'Fairness', 'Communication'],
        datasets: [{
          label: 'Rating',
          data: [
            landlord.ratings.responsiveness,
            landlord.ratings.maintenance,
            landlord.ratings.fairness,
            landlord.ratings.communication
          ],
          backgroundColor: 'rgba(0,212,255,0.12)',
          borderColor: '#00d4ff',
          pointBackgroundColor: '#00d4ff',
          pointBorderColor: '#fff',
          pointRadius: 5,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0, max: 5, ticks: { stepSize: 1, color: 'rgba(255,255,255,0.3)', font: { size: 10 }, backdropColor: 'transparent' },
            grid: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } },
            angleLines: { color: 'rgba(255,255,255,0.06)' }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }, 100);

  // Scroll reveal
  initScrollReveal();
}

document.addEventListener('DOMContentLoaded', initLandlordProfile);
