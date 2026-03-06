// ============================================================
// TENANT TRUST — Shared Utilities (main.js)
// ============================================================

// ── API Configuration ──
const API_BASE = 'http://localhost:3001';

// ── Token helpers ──
function getToken() { return localStorage.getItem('tt_token'); }
function saveToken(t) { localStorage.setItem('tt_token', t); }
function clearToken() { localStorage.removeItem('tt_token'); localStorage.removeItem('tt_user'); }
function saveUser(u) { localStorage.setItem('tt_user', JSON.stringify(u)); }
function getSavedUser() {
  try { return JSON.parse(localStorage.getItem('tt_user')); } catch { return null; }
}
function getAuthHeaders() {
  const token = getToken();
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

// ── Navbar scroll effect ──
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Mark active nav link ──
function initActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ── Scroll-reveal animations ──
function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('animate-fade-up');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

// ── Star rating renderer ──
function renderStars(rating, maxStars = 5) {
  let html = '<span class="stars">';
  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(rating)) {
      html += '<span class="star">★</span>';
    } else if (i === Math.ceil(rating) && rating % 1 >= 0.4) {
      html += '<span class="star" style="opacity:0.6">★</span>';
    } else {
      html += '<span class="star empty">★</span>';
    }
  }
  html += `</span>`;
  return html;
}

// ── Fair Rent Score calculator ──
function calcFairRentScore({ rent, area, bhk, cityMedian, complaints, landlordRating, maintenanceScore }) {
  let score = 100;

  // Rent deviation from city median
  if (cityMedian && rent) {
    const deviation = (rent - cityMedian) / cityMedian;
    score -= Math.max(0, Math.min(20, deviation * 80));
  }

  // Complaint density
  if (complaints !== undefined) {
    const clamped = Math.min(complaints, 6);
    score -= clamped * 5;
  }

  // Landlord rating bonus
  if (landlordRating !== undefined) {
    score += ((landlordRating / 5) * 20) - 10;
  }

  // Maintenance score bonus
  if (maintenanceScore !== undefined) {
    score += ((maintenanceScore / 100) * 10) - 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── FRS Verdict ──
function getFrsVerdict(score) {
  if (score >= 80) return { label: 'Fair Deal', class: 'fair', emoji: '🟢' };
  if (score >= 60) return { label: 'Slightly Overpriced', class: 'caution', emoji: '🟡' };
  return { label: 'Overpriced — Caution', class: 'danger', emoji: '🔴' };
}

// ── Badge severity ──
function severityBadge(severity) {
  const map = { Critical: 'danger', High: 'danger', Medium: 'warning', Low: 'info' };
  return `<span class="badge badge-${map[severity] || 'muted'}">${severity}</span>`;
}

// ── Status badge ──
function statusBadge(status) {
  const map = { Resolved: 'success', Pending: 'warning', 'In Progress': 'info' };
  return `<span class="badge badge-${map[status] || 'muted'}">${status}</span>`;
}

// ── Toast notification ──
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  const icon = type === 'success' ? '✅' : '❌';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Fetch JSON data helper ──
// For legacy calls with relative paths (data/*.json), falls back to local file.
// For /api/* paths, always hits the backend.
async function fetchData(path, options = {}) {
  try {
    let url = path;
    if (path.startsWith('/api/') || path.startsWith('http')) {
      url = path.startsWith('http') ? path : API_BASE + path;
    } else if (!path.startsWith('data/')) {
      url = API_BASE + (path.startsWith('/') ? path : '/' + path);
    }
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('Data load error:', path, e);
    return null;
  }
}

// ── Authenticated POST/PUT helper ──
async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ── Format number with commas ──
function formatNum(n) {
  return n?.toLocaleString('en-IN') ?? n;
}

// ── Format currency ──
function formatRent(n) {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n;
}

// ── URL query param ──
function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}

// ── Navbar HTML template ──
function renderNavbar(activePage) {
  const user = getSavedUser();
  const authHtml = user
    ? `<div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:13px;color:var(--text-secondary)">👋 <strong>${user.name.split(' ')[0]}</strong></span>
        <button class="btn btn-secondary btn-sm" onclick="signOut()" style="padding:6px 14px;font-size:12px">Sign Out</button>
       </div>`
    : `<a href="signin.html" class="btn btn-primary btn-sm nav-cta">Sign In</a>`;

  return `
  <nav class="navbar" id="navbar">
    <div class="container">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">
          <div class="nav-logo-icon">🏠</div>
          <span>Tenant<span class="gradient-text">Trust</span></span>
        </a>
        <div class="nav-links">
          <a href="search.html" class="nav-link ${activePage === 'search' ? 'active' : ''}">Search</a>
          <a href="rent-trends.html" class="nav-link ${activePage === 'trends' ? 'active' : ''}">Rent Trends</a>
          <a href="submit-review.html" class="nav-link ${activePage === 'review' ? 'active' : ''}">Submit Review</a>
          ${authHtml}
        </div>
      </div>
    </div>
  </nav>`;
}

function signOut() {
  clearToken();
  showToast('Signed out successfully', 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

// ── Footer HTML template ──
function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo">
            <div class="nav-logo-icon">🏠</div>
            <span style="font-size:18px;font-weight:800">Tenant<span class="gradient-text">Trust</span></span>
          </a>
          <p>India's most transparent platform for renter rights, landlord accountability, and fair housing.</p>
        </div>
        <div class="footer-col">
          <h5>Platform</h5>
          <a href="search.html">Search</a>
          <a href="rent-trends.html">Rent Trends</a>
          <a href="submit-review.html">Submit Review</a>
        </div>
        <div class="footer-col">
          <h5>Learn</h5>
          <a href="#">Renter Rights</a>
          <a href="#">Deposit Laws</a>
          <a href="#">Lease Guide</a>
        </div>
        <div class="footer-col">
          <h5>Company</h5>
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 TenantTrust. Built for renters, by renters.</p>
        <p>All reviews are community-sourced and for informational purposes only.</p>
      </div>
    </div>
  </footer>`;
}

// ── Init on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initActiveNav();
  initScrollReveal();
});
