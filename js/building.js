// ============================================================
// building.js — Building Complaints Page
// ============================================================

let allComplaints = [];
let building = null;

async function initBuilding() {
  const id = getParam('id') || 'B001';

  const data = await fetchData(`/api/buildings/${id}`);
  if (!data || data.error) {
    document.getElementById('building-content').innerHTML = `<div class="card" style="text-align:center;padding:40px"><h3>Building not found</h3><a href="search.html" class="btn btn-primary btn-sm mt-2">Back to Search</a></div>`;
    return;
  }

  building = data;  // assign to module-level var so filterComplaints() can access it
  allComplaints = building.complaints;
  // API returns landlord object nested
  renderBuilding(building, building.landlord);
}

function renderBuilding(b, landlord) {
  const maintScore = b.maintenanceScore;
  const maintClass = maintScore >= 80 ? 'fair' : maintScore >= 50 ? 'caution' : 'danger';
  const maintColor = maintScore >= 80 ? 'var(--success)' : maintScore >= 50 ? 'var(--warning)' : 'var(--danger)';

  const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  b.complaints.forEach(c => severityCounts[c.severity] = (severityCounts[c.severity] || 0) + 1);
  const typeCounts = {};
  b.complaints.forEach(c => typeCounts[c.type] = (typeCounts[c.type] || 0) + 1);

  document.getElementById('building-content').innerHTML = `
  <!-- Building header -->
  <div class="building-header animate-fade-up">
    <div class="building-icon">🏢</div>
    <div class="building-info">
      <div class="building-name">${b.name}</div>
      <div class="building-meta">
        <span>📍 ${b.address}</span>
        <span>🏗️ Built <strong>${b.built}</strong></span>
        <span>🏠 <strong>${b.units}</strong> Units</span>
        ${landlord ? `<a href="landlord.html?id=${landlord.id}" class="badge badge-info">Landlord: ${landlord.name} →</a>` : ''}
      </div>
    </div>
    <div style="text-align:center">
      <div class="maint-badge" style="color:${maintColor};border-color:${maintColor}50;background:${maintColor}12">
        ${maintScore}
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Maintenance<br>Score</div>
    </div>
  </div>

  <!-- Charts row -->
  <div class="charts-row" data-reveal>
    <div class="card chart-card">
      <h4>Complaint Severity Breakdown</h4>
      <div class="chart-canvas-wrap"><canvas id="severityChart"></canvas></div>
    </div>
    <div class="card chart-card">
      <h4>Complaints by Type</h4>
      <div class="chart-canvas-wrap"><canvas id="typeChart"></canvas></div>
    </div>
  </div>

  <!-- Stats row -->
  <div class="grid-4 mb-3" data-reveal style="margin-bottom:24px">
    <div class="stat-box card"><div class="stat-value">${b.complaints.length}</div><div class="stat-label">Total Complaints</div></div>
    <div class="stat-box card"><div class="stat-value" style="color:var(--danger)">${b.complaints.filter(c => c.status === 'Pending').length}</div><div class="stat-label">Pending</div></div>
    <div class="stat-box card"><div class="stat-value" style="color:var(--success)">${b.complaints.filter(c => c.status === 'Resolved').length}</div><div class="stat-label">Resolved</div></div>
    <div class="stat-box card"><div class="stat-value">${maintScore}</div><div class="stat-label">Maintenance Score</div></div>
  </div>

  <!-- Complaint table -->
  <div class="card" data-reveal style="padding:0">
    <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <h3 style="font-size:16px">Complaint History</h3>
      <div class="filter-row" style="margin:0;padding:0;border:none">
        <select class="filter-select" id="f-type" onchange="filterComplaints()">
          <option value="">All Types</option>
          ${[...new Set(b.complaints.map(c => c.type))].map(t => `<option>${t}</option>`).join('')}
        </select>
        <select class="filter-select" id="f-severity" onchange="filterComplaints()">
          <option value="">All Severity</option>
          <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select class="filter-select" id="f-status" onchange="filterComplaints()">
          <option value="">All Status</option>
          <option>Pending</option><option>Resolved</option><option>In Progress</option>
        </select>
      </div>
    </div>
    <div class="table-wrap" id="complaints-table">
      ${renderComplaintTable(b.complaints)}
    </div>
  </div>
  `;

  // Severity donut chart
  setTimeout(() => {
    const sCtx = document.getElementById('severityChart')?.getContext('2d');
    if (sCtx) {
      new Chart(sCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(severityCounts),
          datasets: [{ data: Object.values(severityCounts), backgroundColor: ['#ff5252', '#ff7043', '#ffca28', '#00d4ff'], borderColor: 'transparent', hoverOffset: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 }, padding: 12 } } }, cutout: '65%' }
      });
    }

    const tCtx = document.getElementById('typeChart')?.getContext('2d');
    if (tCtx) {
      new Chart(tCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(typeCounts),
          datasets: [{ label: 'Complaints', data: Object.values(typeCounts), backgroundColor: 'rgba(0,212,255,0.25)', borderColor: '#00d4ff', borderWidth: 2, borderRadius: 6 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } } } }
        }
      });
    }
  }, 100);

  initScrollReveal();
}

function renderComplaintTable(complaints) {
  if (!complaints.length) return `<div style="text-align:center;padding:40px;color:var(--text-muted)">No complaints match your filters.</div>`;
  return `<table>
    <thead><tr>
      <th>#</th><th>Type</th><th>Description</th><th>Date</th><th>Severity</th><th>Status</th>
    </tr></thead>
    <tbody>
    ${complaints.map((c, i) => `
    <tr>
      <td style="color:var(--text-muted)">${i + 1}</td>
      <td><strong>${c.type}</strong></td>
      <td style="max-width:300px;line-height:1.5">${c.description}</td>
      <td>${c.date}</td>
      <td>${severityBadge(c.severity)}</td>
      <td>${statusBadge(c.status)}</td>
    </tr>`).join('')}
    </tbody>
  </table>`;
}

function filterComplaints() {
  if (!building) return;
  const type = document.getElementById('f-type').value;
  const severity = document.getElementById('f-severity').value;
  const status = document.getElementById('f-status').value;
  let results = building.complaints.filter(c => {
    if (type && c.type !== type) return false;
    if (severity && c.severity !== severity) return false;
    if (status && c.status !== status) return false;
    return true;
  });
  document.getElementById('complaints-table').innerHTML = renderComplaintTable(results);
}

document.addEventListener('DOMContentLoaded', initBuilding);
