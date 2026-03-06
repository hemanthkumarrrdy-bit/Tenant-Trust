// ============================================================
// rent-trends.js — Rent Trends & Fair Rent Score Calculator
// ============================================================

let trendData = null;
let trendChart = null;
let areaChart = null;

async function initTrends() {
    const trendsArr = await fetchData('/api/rent-trends');
    trendData = Array.isArray(trendsArr) ? trendsArr[0] : trendsArr;
    if (!trendData) {
        showToast('Could not load rent data', 'error');
        return;
    }
    updateCalcAreas();
    updateTrends();
    updateTable();

    // Pre-fill landlord from URL
    const landlord = getParam('landlord');
    if (landlord) {
        const inp = document.getElementById('c-city');
        if (inp) inp.focus();
    }

    // Char count for review
    document.getElementById('c-rent')?.addEventListener('input', () => {
        const v = parseFloat(document.getElementById('c-rent').value);
        if (v && v > 1) calcScore(); // auto-calculate on input
    });
}

function updateTrends() {
    const city = document.getElementById('t-city')?.value || 'Mumbai';
    document.getElementById('trend-city-label').textContent = city;
    const cityData = trendData.cities[city];
    if (!cityData) return;

    const months = trendData.trendMonths;
    const trend = cityData.trend;

    if (trendChart) trendChart.destroy();
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: `Avg Rent (${city})`,
                data: trend,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0,212,255,0.08)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointBorderColor: '#fff',
                pointBackgroundColor: '#00d4ff',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { size: 12 } } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } } },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: {
                        color: 'rgba(255,255,255,0.5)', font: { size: 11 },
                        callback: v => '₹' + (v / 1000).toFixed(0) + 'k'
                    }
                }
            }
        }
    });

    // Also update area comparison
    updateAreaChart(city);
}

function updateTable() {
    const city = document.getElementById('t-city')?.value || 'Mumbai';
    const bhk = document.getElementById('t-bhk')?.value || '2BHK';
    document.getElementById('bhk-label').textContent = bhk.replace('BHK', ' BHK');

    const cityData = trendData.cities[city];
    if (!cityData) return;

    const areas = Object.entries(cityData.areas);
    const table = document.getElementById('price-table');
    table.innerHTML = `<table>
    <thead><tr>
      <th>Area</th><th>Avg Rent</th><th>Min</th><th>Max</th><th>Status</th>
    </tr></thead>
    <tbody>
    ${areas.map(([area, data]) => {
        const d = data[bhk];
        if (!d) return '';
        const cityAvgs = areas.map(([, ad]) => ad[bhk]?.avg || 0);
        const cityMedian = cityAvgs.reduce((a, b) => a + b, 0) / cityAvgs.length;
        const ratio = d.avg / cityMedian;
        const status = ratio > 1.15
            ? `<span class="badge badge-danger">Overpriced</span>`
            : ratio < 0.9
                ? `<span class="badge badge-success">Good Value</span>`
                : `<span class="badge badge-warning">Average</span>`;
        return `<tr>
        <td><strong>${area}</strong></td>
        <td><strong>₹${d.avg.toLocaleString('en-IN')}</strong></td>
        <td>₹${d.min.toLocaleString('en-IN')}</td>
        <td>₹${d.max.toLocaleString('en-IN')}</td>
        <td>${status}</td>
      </tr>`;
    }).join('')}
    </tbody>
  </table>`;
}

function updateAreaChart(city) {
    const cityData = trendData.cities[city];
    if (!cityData) return;
    const bhk = document.getElementById('t-bhk')?.value || '2BHK';
    const areas = Object.keys(cityData.areas);
    const avgs = areas.map(a => cityData.areas[a][bhk]?.avg || 0);

    if (areaChart) areaChart.destroy();
    const ctx = document.getElementById('areaChart')?.getContext('2d');
    if (!ctx) return;

    areaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: areas,
            datasets: [{
                label: 'Avg Rent',
                data: avgs,
                backgroundColor: avgs.map(v => {
                    const max = Math.max(...avgs);
                    const ratio = v / max;
                    return ratio > 0.85 ? 'rgba(255,82,82,0.5)' : ratio > 0.65 ? 'rgba(255,202,40,0.5)' : 'rgba(0,230,118,0.5)';
                }),
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, callback: v => '₹' + (v / 1000).toFixed(0) + 'k' } }
            }
        }
    });
}

// ── Calc areas dropdown ──
function updateCalcAreas() {
    const city = document.getElementById('c-city')?.value || 'Mumbai';
    if (!trendData) return;
    const areas = Object.keys(trendData.cities[city]?.areas || {});
    const sel = document.getElementById('c-area');
    if (!sel) return;
    sel.innerHTML = areas.map(a => `<option value="${a}">${a}</option>`).join('');
}

// ── Fair Rent Score calculation ──
function calcScore() {
    const city = document.getElementById('c-city')?.value;
    const area = document.getElementById('c-area')?.value;
    const bhk = document.getElementById('c-bhk')?.value;
    const rent = parseFloat(document.getElementById('c-rent')?.value);
    const complaints = parseFloat(document.getElementById('c-complaints')?.value) || 0;
    const lrRating = parseFloat(document.getElementById('c-lr')?.value) || 3.5;

    if (!rent || !area || !city) {
        showToast('Please fill in City, Area, and Monthly Rent', 'error');
        return;
    }

    const cityMedian = trendData?.cities?.[city]?.areas?.[area]?.[bhk]?.median;
    const score = calcFairRentScore({ rent, cityMedian, complaints, landlordRating: lrRating, maintenanceScore: 70 });
    const verdict = getFrsVerdict(score);

    // Display
    const el = document.getElementById('frs-num');
    el.textContent = score;
    el.className = 'num frs-' + verdict.class;

    document.getElementById('frs-verdict').innerHTML = `<span class="verdict verdict-${verdict.class}">${verdict.emoji} ${verdict.label}</span>`;
    document.getElementById('frs-title').textContent = verdict.label;

    const descriptions = {
        fair: 'This property appears to be fairly priced relative to the area median and landlord reputation. A solid choice!',
        caution: 'The rent is somewhat above the area median. Negotiate the price or check for comparable alternatives before signing.',
        danger: 'This property appears overpriced. We strongly recommend comparing with area averages and looking for alternatives.'
    };
    document.getElementById('frs-desc').textContent = descriptions[verdict.class];

    const rentDiff = cityMedian ? rent - cityMedian : null;
    document.getElementById('frs-breakdown').innerHTML = [
        ['📍 Area Median', cityMedian ? `₹${cityMedian.toLocaleString('en-IN')}` : 'N/A'],
        ['📊 Your Rent', `₹${rent.toLocaleString('en-IN')}`],
        ['± Difference', rentDiff !== null ? `${rentDiff >= 0 ? '+' : ''}₹${rentDiff.toLocaleString('en-IN')}` : 'N/A'],
        ['🏚 Complaints', complaints + ' logged'],
        ['⭐ Landlord Rating', lrRating + '/5'],
    ].map(([k, v]) => `<div class="frs-item"><span>${k}</span><strong>${v}</strong></div>`).join('');

    document.getElementById('calc-result').classList.add('show');
}

document.addEventListener('DOMContentLoaded', initTrends);
