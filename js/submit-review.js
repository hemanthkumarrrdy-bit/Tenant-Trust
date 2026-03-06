// ============================================================
// submit-review.js — Multi-step Review Form Logic
// ============================================================

let currentStep = 1;
const starRatings = { responsiveness: 0, maintenance: 0, fairness: 0, communication: 0 };
let recommendation = '';

// Step navigation
function goToStep(step) {
    if (step > currentStep && !validateStep(currentStep)) return;

    document.getElementById(`step-${currentStep}`)?.classList.add('hidden');
    const nextEl = document.getElementById(`step-${step}`);
    if (nextEl) {
        nextEl.classList.remove('hidden');
        nextEl.classList.add('animate-fade-up');
    }
    currentStep = step;

    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        dot.classList.remove('active', 'done');
        if (i < step) dot.classList.add('done'), dot.textContent = '\u2713';
        else if (i === step) dot.classList.add('active'), dot.textContent = i;
        else dot.textContent = i;
    }

    document.getElementById('progress-fill').style.width = (step / 4 * 100) + '%';
    if (step === 4) buildSummary();
    window.scrollTo({ top: 200, behavior: 'smooth' });
}

// Validation
function validateStep(step) {
    if (step === 1) {
        const landlord = document.getElementById('f-landlord').value.trim();
        const city = document.getElementById('f-city').value;
        const area = document.getElementById('f-area').value.trim();
        if (!landlord) { showToast('Please enter the landlord name', 'error'); return false; }
        if (!city) { showToast('Please select a city', 'error'); return false; }
        if (!area) { showToast('Please enter the area/locality', 'error'); return false; }
    }
    if (step === 2) {
        const any = Object.values(starRatings).some(v => v > 0);
        if (!any) { showToast('Please rate at least one category', 'error'); return false; }
    }
    if (step === 3) {
        const text = document.getElementById('f-review').value.trim();
        if (text.length < 30) { showToast('Please write at least 30 characters in your review', 'error'); return false; }
    }
    return true;
}

// Star rating interactions
function setStars(group, rating) {
    starRatings[group] = rating;
    updateStarDisplay(group, rating);
}

function hoverStars(group, rating) {
    updateStarDisplay(group, rating, true);
}

function resetStars(group) {
    updateStarDisplay(group, starRatings[group]);
}

function updateStarDisplay(group, rating, isHover = false) {
    const container = document.getElementById(`stars-${group}`);
    if (!container) return;
    const stars = container.querySelectorAll('.star-input-btn');
    stars.forEach((s, i) => {
        s.classList.toggle('selected', i < rating);
        s.style.color = i < rating ? '#ffca28' : isHover && i < rating ? '#ffca28' : 'rgba(255,202,40,0.22)';
    });
}

// Recommendation
function setRec(val) {
    recommendation = val;
    ['yes', 'maybe', 'no'].forEach(r => {
        document.getElementById(`rec-${r}`)?.classList.toggle('active', r === val);
    });
}

// Character count
document.addEventListener('DOMContentLoaded', () => {
    const reviewEl = document.getElementById('f-review');
    if (reviewEl) {
        reviewEl.addEventListener('input', () => {
            document.getElementById('char-count').textContent = `${reviewEl.value.length} / 800`;
        });
    }

    // Pre-fill landlord from URL
    const landlord = getParam('landlord');
    if (landlord) {
        const el = document.getElementById('f-landlord');
        if (el) el.value = decodeURIComponent(landlord);
    }
});

// Build summary
function buildSummary() {
    const landlord = document.getElementById('f-landlord')?.value || '\u2014';
    const city = document.getElementById('f-city')?.value || '\u2014';
    const area = document.getElementById('f-area')?.value || '\u2014';
    const bhk = document.getElementById('f-bhk')?.value || '\u2014';
    const rent = document.getElementById('f-rent')?.value;
    const reviewTxt = document.getElementById('f-review')?.value.trim() || '\u2014';
    const title = document.getElementById('f-title')?.value.trim() || '(No title)';

    const avgRating = Object.values(starRatings).filter(v => v > 0);
    const avg = avgRating.length ? (avgRating.reduce((a, b) => a + b, 0) / avgRating.length).toFixed(1) : '\u2014';

    const tags = [...document.querySelectorAll('#issue-tags .tag.active')].map(t => t.textContent.trim()).join(', ') || 'None selected';
    const recEmoji = { yes: '\ud83d\udc4d Yes', maybe: '\ud83e\udd14 Maybe', no: '\ud83d\udc4e No', '': '\u2014' }[recommendation] || '\u2014';

    document.getElementById('review-summary').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:14px">
      <div><span style="color:var(--text-muted);font-size:12px">LANDLORD</span><br><strong>${landlord}</strong></div>
      <div><span style="color:var(--text-muted);font-size:12px">LOCATION</span><br><strong>${area}, ${city}</strong></div>
      <div><span style="color:var(--text-muted);font-size:12px">PROPERTY</span><br><strong>${bhk}${rent ? ' \u00b7 \u20b9' + parseInt(rent).toLocaleString('en-IN') + '/mo' : ''}</strong></div>
      <div><span style="color:var(--text-muted);font-size:12px">AVG RATING</span><br><strong>${avg} / 5 \u2b50</strong></div>
      <div><span style="color:var(--text-muted);font-size:12px">ISSUES TAGGED</span><br><strong>${tags}</strong></div>
      <div><span style="color:var(--text-muted);font-size:12px">RECOMMEND?</span><br><strong>${recEmoji}</strong></div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:12px">
      <div style="color:var(--text-muted);font-size:12px;margin-bottom:4px">REVIEW</div>
      <div style="font-weight:600;margin-bottom:4px">${title}</div>
      <div style="color:var(--text-secondary)">${reviewTxt}</div>
    </div>`;
}

// Submit — real API call
async function submitReview() {
    // Require authentication
    const token = getToken();
    if (!token) {
        showToast('Please sign in to submit a review', 'error');
        setTimeout(() => { window.location.href = 'signin.html'; }, 1200);
        return;
    }

    const anonymous = document.getElementById('anonymous-toggle')?.checked || false;
    const landlordName = document.getElementById('f-landlord')?.value.trim();
    const city = document.getElementById('f-city')?.value;
    const area = document.getElementById('f-area')?.value.trim();
    const bhk = document.getElementById('f-bhk')?.value;
    const rent = document.getElementById('f-rent')?.value;
    const reviewText = document.getElementById('f-review')?.value.trim();
    const title = document.getElementById('f-title')?.value.trim();
    const tags = [...document.querySelectorAll('#issue-tags .tag.active')].map(t => t.textContent.trim());

    // Try to resolve the landlord name to an ID
    let landlordId = getParam('landlordId');
    if (!landlordId && landlordName) {
        const searchRes = await fetchData(`/api/search?q=${encodeURIComponent(landlordName)}&type=landlords`);
        const match = searchRes?.landlords?.find(l => l.name.toLowerCase().includes(landlordName.toLowerCase()));
        if (match) landlordId = match.id;
    }

    if (!landlordId) {
        showSuccessScreen();
        showToast('Review saved! Our team will review and add the landlord.', 'success');
        return;
    }

    const avgRating = Object.values(starRatings).filter(v => v > 0);
    const avg = avgRating.length ? avgRating.reduce((a, b) => a + b, 0) / avgRating.length : 3;

    const payload = {
        landlordId,
        rating: avg,
        text: reviewText || 'Review submitted via TenantTrust.',
        title: title || '',
        anonymous,
        ratingResponsiveness: starRatings.responsiveness || null,
        ratingMaintenance: starRatings.maintenance || null,
        ratingFairness: starRatings.fairness || null,
        ratingCommunication: starRatings.communication || null,
        bhk: bhk || null,
        rent: rent ? parseInt(rent) : null,
        city: city || null,
        area: area || null,
        tags,
        recommendation,
    };

    const result = await apiPost('/api/reviews', payload);

    if (result && result.error) {
        showToast(result.error, 'error');
        return;
    }

    showSuccessScreen();
    showToast('Review published successfully!', 'success');
}

function showSuccessScreen() {
    document.getElementById('step-4').classList.add('hidden');
    document.getElementById('step-indicator').classList.add('hidden');
    document.querySelector('.form-progress').classList.add('hidden');
    const success = document.getElementById('success-screen');
    success.style.display = 'block';
    success.classList.add('animate-fade-up');
}
