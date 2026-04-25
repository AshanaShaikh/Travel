/* ═══════════════════════════════════════════════════════
   WANDERLUST — Travel Guide  |  app.js
   Full CRUD operations with MySQL via REST API
═══════════════════════════════════════════════════════ */

const API = '/api/destinations';

const categoryEmojis = {
  Adventure: '🏔️', Cultural: '🏛️', Beach: '🏖️',
  Mountain: '⛰️', City: '🌆', Wildlife: '🦁', Historical: '🏯'
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const cardGrid      = document.getElementById('cardGrid');
const emptyState    = document.getElementById('emptyState');
const searchInput   = document.getElementById('searchInput');
const filterCat     = document.getElementById('filterCategory');
const filterBudget  = document.getElementById('filterBudget');
const sortSelect    = document.getElementById('sortSelect');
const resultsInfo   = document.getElementById('resultsInfo');
const modalOverlay  = document.getElementById('modalOverlay');
const detailOverlay = document.getElementById('detailOverlay');
const confirmOverlay= document.getElementById('confirmOverlay');
const toast         = document.getElementById('toast');
const toastMsg      = document.getElementById('toastMsg');
const fImage        = document.getElementById('fImage');
const imgPreview    = document.getElementById('imgPreview');

// ── State ─────────────────────────────────────────────────────────────────────
let deleteTargetId = null;
let toastTimer     = null;

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadDestinations();
  loadStats();

  document.getElementById('btnOpenAdd').addEventListener('click', () => openModal());
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('detailClose').addEventListener('click', closeDetail);
  document.getElementById('btnConfirmDelete').addEventListener('click', confirmDelete);

  // Close on overlay click
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  detailOverlay.addEventListener('click', e => { if (e.target === detailOverlay) closeDetail(); });
  confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) closeConfirm(); });

  // Filters
  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(loadDestinations, 350);
  });
  filterCat.addEventListener('change', loadDestinations);
  filterBudget.addEventListener('change', loadDestinations);
  sortSelect.addEventListener('change', loadDestinations);

  // Image preview
  fImage.addEventListener('input', () => {
    const url = fImage.value.trim();
    if (url) {
      imgPreview.src = url;
      imgPreview.classList.remove('hidden');
      imgPreview.onerror = () => imgPreview.classList.add('hidden');
    } else {
      imgPreview.classList.add('hidden');
    }
  });

  // Keyboard ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeDetail(); closeConfirm(); }
  });
});

// ── LOAD DESTINATIONS (READ) ──────────────────────────────────────────────────
async function loadDestinations() {
  showSkeletons();
  try {
    const params = new URLSearchParams({
      search:   searchInput.value.trim(),
      category: filterCat.value,
      budget:   filterBudget.value,
      sort:     sortSelect.value,
    });
    const res  = await fetch(`${API}?${params}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    renderCards(json.data);
    resultsInfo.textContent = json.count === 0
      ? 'No destinations found.'
      : `Showing ${json.count} destination${json.count !== 1 ? 's' : ''}`;
  } catch (err) {
    cardGrid.innerHTML = '';
    showToast('❌ Failed to load: ' + err.message, true);
  }
}

function showSkeletons() {
  cardGrid.innerHTML = Array(6).fill(0).map(() => `
    <div class="card">
      <div class="skeleton" style="height:210px;border-radius:var(--radius) var(--radius) 0 0;"></div>
      <div class="card-body">
        <div class="skeleton" style="height:22px;width:60%;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:14px;width:40%;margin-bottom:14px;"></div>
        <div class="skeleton" style="height:12px;margin-bottom:6px;"></div>
        <div class="skeleton" style="height:12px;width:80%;"></div>
      </div>
    </div>
  `).join('');
}

// ── RENDER CARDS ──────────────────────────────────────────────────────────────
function renderCards(destinations) {
  emptyState.classList.add('hidden');

  if (!destinations.length) {
    cardGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  cardGrid.innerHTML = destinations.map((d, i) => `
    <div class="card" style="animation-delay:${i * 0.07}s">
      <div class="card-img-wrap">
        ${d.image_url
          ? `<img class="card-img" src="${escHtml(d.image_url)}" alt="${escHtml(d.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="card-img-placeholder" style="display:none">${categoryEmojis[d.category] || '🌍'}</div>`
          : `<div class="card-img-placeholder">${categoryEmojis[d.category] || '🌍'}</div>`
        }
        <span class="card-badge">${escHtml(d.category)}</span>
        ${d.rating > 0 ? `<span class="card-rating"><span class="star">★</span>${parseFloat(d.rating).toFixed(1)}</span>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${escHtml(d.name)}</h3>
        <p class="card-country">📍 ${escHtml(d.country)}</p>
        ${d.description ? `<p class="card-desc">${escHtml(d.description)}</p>` : ''}
        <div class="card-meta">
          ${d.best_season ? `<span class="meta-tag">🗓️ ${escHtml(d.best_season)}</span>` : ''}
          <span class="meta-tag budget-${d.budget?.toLowerCase().replace('-','')}">${budgetIcon(d.budget)} ${escHtml(d.budget)}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-icon btn-view"   onclick="viewDestination(${d.id})">👁 View</button>
        <button class="btn-icon btn-edit"   onclick="editDestination(${d.id})">✏️ Edit</button>
        <button class="btn-icon btn-delete" onclick="askDelete(${d.id}, '${escHtml(d.name).replace(/'/g,"\\'")}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

function budgetIcon(b) {
  return { Budget: '💰', 'Mid-range': '💳', Luxury: '💎' }[b] || '💳';
}

// ── LOAD STATS ────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch('/api/stats');
    const json = await res.json();
    if (json.success) {
      document.getElementById('statTotal').textContent    = json.data.total;
      document.getElementById('statCountries').textContent= json.data.total_countries;
      document.getElementById('statRating').textContent   = json.data.avg_rating || '—';
    }
  } catch {}
}

// ── VIEW DETAIL ───────────────────────────────────────────────────────────────
async function viewDestination(id) {
  try {
    const res  = await fetch(`${API}/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    const d = json.data;

    document.getElementById('detailContent').innerHTML = `
      ${d.image_url
        ? `<img class="detail-img" src="${escHtml(d.image_url)}" alt="${escHtml(d.name)}" onerror="this.outerHTML='<div class=detail-img-placeholder>${categoryEmojis[d.category]||'🌍'}</div>'">`
        : `<div class="detail-img-placeholder">${categoryEmojis[d.category] || '🌍'}</div>`
      }
      <div class="detail-body">
        <p class="detail-category">${escHtml(d.category)}</p>
        <h2 class="detail-title">${escHtml(d.name)}</h2>
        <p class="detail-country">📍 ${escHtml(d.country)}</p>
        ${d.description ? `<p class="detail-desc">${escHtml(d.description)}</p>` : ''}
        <div class="detail-meta-grid">
          <div class="detail-meta-item">
            <div class="dmv">${d.rating > 0 ? '★ ' + parseFloat(d.rating).toFixed(1) : '—'}</div>
            <div class="dml">Rating</div>
          </div>
          <div class="detail-meta-item">
            <div class="dmv">${budgetIcon(d.budget)}</div>
            <div class="dml">${escHtml(d.budget)}</div>
          </div>
          <div class="detail-meta-item">
            <div class="dmv" style="font-size:.88rem">${d.best_season ? escHtml(d.best_season) : '—'}</div>
            <div class="dml">Best Season</div>
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn-primary" onclick="closeDetail();editDestination(${d.id})">✏️ Edit</button>
          <button class="btn-secondary" onclick="closeDetail();askDelete(${d.id},'${escHtml(d.name).replace(/'/g,"\\'")}')">🗑 Delete</button>
        </div>
      </div>
    `;
    detailOverlay.classList.remove('hidden');
  } catch (err) {
    showToast('❌ ' + err.message, true);
  }
}

// ── OPEN / CLOSE MODAL ────────────────────────────────────────────────────────
function openModal(data = null) {
  resetForm();
  if (data) {
    document.getElementById('modalTitle').textContent = 'Edit Destination';
    document.getElementById('btnSubmit').textContent  = 'Update Destination';
    document.getElementById('editId').value    = data.id;
    document.getElementById('fName').value     = data.name || '';
    document.getElementById('fCountry').value  = data.country || '';
    document.getElementById('fCategory').value = data.category || '';
    document.getElementById('fBudget').value   = data.budget || 'Mid-range';
    document.getElementById('fSeason').value   = data.best_season || '';
    document.getElementById('fRating').value   = data.rating || '';
    document.getElementById('fDesc').value     = data.description || '';
    document.getElementById('fImage').value    = data.image_url || '';
    if (data.image_url) {
      imgPreview.src = data.image_url;
      imgPreview.classList.remove('hidden');
    }
  } else {
    document.getElementById('modalTitle').textContent = 'Add Destination';
    document.getElementById('btnSubmit').textContent  = 'Save Destination';
  }
  modalOverlay.classList.remove('hidden');
  document.getElementById('fName').focus();
}

function closeModal() { modalOverlay.classList.add('hidden'); resetForm(); }
function closeDetail() { detailOverlay.classList.add('hidden'); }
function closeConfirm() { confirmOverlay.classList.add('hidden'); deleteTargetId = null; }

function resetForm() {
  document.getElementById('destForm').reset();
  document.getElementById('editId').value = '';
  imgPreview.classList.add('hidden');
  imgPreview.src = '';
}

// ── EDIT ──────────────────────────────────────────────────────────────────────
async function editDestination(id) {
  try {
    const res  = await fetch(`${API}/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    openModal(json.data);
  } catch (err) {
    showToast('❌ ' + err.message, true);
  }
}

// ── SUBMIT FORM (CREATE or UPDATE) ────────────────────────────────────────────
async function submitForm() {
  const id = document.getElementById('editId').value;

  const payload = {
    name:        document.getElementById('fName').value.trim(),
    country:     document.getElementById('fCountry').value.trim(),
    category:    document.getElementById('fCategory').value,
    budget:      document.getElementById('fBudget').value,
    best_season: document.getElementById('fSeason').value.trim(),
    rating:      document.getElementById('fRating').value || 0,
    description: document.getElementById('fDesc').value.trim(),
    image_url:   document.getElementById('fImage').value.trim(),
  };

  if (!payload.name || !payload.country || !payload.category) {
    showToast('Name, Country and Category are required', true);
    return;
  }

  const btnSubmit = document.getElementById('btnSubmit');
  btnSubmit.textContent = 'Saving…'; btnSubmit.disabled = true;

  try {
    const isEdit = Boolean(id);
    const res = await fetch(isEdit ? `${API}/${id}` : API, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    closeModal();
    showToast(isEdit ? 'Destination updated!' : 'Destination added!');
    loadDestinations();
    loadStats();
  } catch (err) {
    showToast('❌ ' + err.message, true);
  } finally {
    btnSubmit.textContent = id ? 'Update Destination' : 'Save Destination';
    btnSubmit.disabled = false;
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function askDelete(id, name) {
  deleteTargetId = id;
  document.getElementById('confirmMsg').textContent = `"${name}" will be permanently removed.`;
  confirmOverlay.classList.remove('hidden');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('btnConfirmDelete');
  btn.textContent = 'Deleting…'; btn.disabled = true;
  try {
    const res  = await fetch(`${API}/${deleteTargetId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    closeConfirm();
    showToast(' Destination deleted.');
    loadDestinations();
    loadStats();
  } catch (err) {
    showToast('❌ ' + err.message, true);
  } finally {
    btn.textContent = 'Delete'; btn.disabled = false;
  }
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  toast.classList.remove('hidden', 'error');
  if (isError) toast.classList.add('error');
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ── HTML escape helper ────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
