// utils.js — Shared utility functions

const API_BASE = '/api';

// ---- Auth  ----
let _currentUser = null;

async function initAuth() {
  try {
    const res = await fetch('/auth/me');
    if (res.ok) {
      const data = await res.json();
      _currentUser = data.user;
    } else {
      _currentUser = null;
    }
  } catch {
    _currentUser = null;
  }
}
function getUser() {
  return _currentUser;
}

// ---- API fetch wrapper ----
async function apiRequest(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', 
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : null;
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

// ---- Header renderer ----
function renderHeader() {
  const user = getUser();
  const el = document.getElementById('headerRight');
  if (!el) return;

  if (user) {
    el.innerHTML = `
      <a href="create.html" class="btn-create">+ Create Recipe</a>
      <a href="userInfo.html" class="btn-profile">
        <div class="avatar-sm">${user.username[0].toUpperCase()}</div>
        ${user.username}
      </a>
      <button class="btn-logout" id="logoutBtn">Log out</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', logout);
  } else {
    el.innerHTML = `<button class="btn-login" id="openLoginBtn">Log In</button>`;
    document.getElementById('openLoginBtn').addEventListener('click', () => {
      window.location.href = '/auth/signin';
    });
  }
}

function logout() {
  _currentUser = null;
  window.location.href = '/auth/signout';
}
// ---- Toast ----
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ---- Format date ----
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---- Stars ----
function renderStars(rating) {
  const full = Math.round(rating || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// ---- Category emoji ----
const CATEGORY_EMOJI = {
  soup: '🍲', meat: '🥩', vegetarian: '🥦',
  dessert: '🍮', pasta: '🍝', seafood: '🦞'
};

function getCategoryEmoji(cat) {
  return CATEGORY_EMOJI[cat] || '🍽️';
}

// ---- Build recipe card ----
function buildRecipeCard(recipe, extraActions = '') {
  const emoji = getCategoryEmoji(recipe.category);
  const img = recipe.imageUrl
    ? `<img class="recipe-card-image" src="${recipe.imageUrl}" alt="${recipe.title}" loading="lazy"/>`
    : `<div class="recipe-card-image-placeholder">${emoji}</div>`;

  return `
    <div class="recipe-card-wrap">
      <a href="recipe.html?id=${recipe._id}" class="recipe-card">
        ${img}
        <div class="recipe-card-body">
          <div class="recipe-card-tag">${recipe.category || 'Recipe'}</div>
          <div class="recipe-card-title">${recipe.title}</div>
          ${recipe.description ? `<div class="recipe-card-desc">${recipe.description}</div>` : ''}
        </div>
        <div class="recipe-card-footer">
          <div class="recipe-meta">
            ${recipe.prepTime ? `<span>⏱ ${recipe.prepTime}m prep</span>` : ''}
            ${recipe.servings ? `<span>🍽 ${recipe.servings} servings</span>` : ''}
          </div>
          ${recipe.avgRating ? `<div class="recipe-rating">★ ${recipe.avgRating.toFixed(1)}</div>` : ''}
        </div>
      </a>
      ${extraActions ? `<div class="card-actions-overlay">${extraActions}</div>` : ''}
    </div>
  `;
}
