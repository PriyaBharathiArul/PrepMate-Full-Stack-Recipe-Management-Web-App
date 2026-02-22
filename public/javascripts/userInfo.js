// userInfo.js — Profile page

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  renderHeader();

  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // Populate profile header
  const avatar = document.getElementById('avatarCircle');
  if (avatar) avatar.textContent = user.username[0].toUpperCase();

  const usernameEl = document.getElementById('profileUsername');
  if (usernameEl) usernameEl.textContent = user.username;

  const joinedEl = document.getElementById('profileJoined');
  if (joinedEl) joinedEl.textContent = `Member since ${formatDate(user.createdAt) || 'recently'}`;

  // Setup tabs
  setupTabs();

  // Load data
  await Promise.all([loadMyRecipes(), loadLikedRecipes(), loadMyReviews()]);
});

function setupTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${target}`)?.classList.add('active');
    });
  });
}

async function loadMyRecipes() {
  const grid = document.getElementById('myRecipesGrid');
  const empty = document.getElementById('myRecipesEmpty');

  try {
    const data = await apiRequest('GET', '/users/me/recipes');
    const recipes = data.recipes || data;
    renderMyRecipes(recipes, grid, empty);
  } catch {
    // Demo
    renderMyRecipes([
      { _id: 'r1', title: 'Roasted Garlic Hummus', category: 'vegetarian', prepTime: 10, servings: 6 },
      { _id: 'r2', title: 'Lamb Tagine', category: 'meat', prepTime: 25, cookTime: 120, servings: 4, avgRating: 4.7 },
    ], grid, empty);
  }
}

function renderMyRecipes(recipes, grid, empty) {
  if (!recipes.length) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = recipes.map(r => buildRecipeCard(r,
    `<button class="card-action-btn" onclick="deleteMyRecipe('${r._id}', event)">Delete</button>`
  )).join('');
}

async function deleteMyRecipe(id, e) {
  e.preventDefault();
  e.stopPropagation();
  if (!confirm('Delete this recipe? This cannot be undone.')) return;
  try {
    await apiRequest('DELETE', `/recipes/${id}`);
    showToast('Recipe deleted.');
    await loadMyRecipes();
  } catch (err) {
    showToast('Could not delete: ' + err.message);
  }
}

async function loadLikedRecipes() {
  const grid = document.getElementById('likedGrid');
  const empty = document.getElementById('likedEmpty');

  try {
    const data = await apiRequest('GET', '/users/me/liked');
    const recipes = data.recipes || data;
    renderLikedRecipes(recipes, grid, empty);
  } catch {
    renderLikedRecipes([
      { _id: 'r3', title: 'Crème Brûlée', category: 'dessert', prepTime: 20, cookTime: 45, servings: 6, avgRating: 5.0 },
      { _id: 'r4', title: 'Cacio e Pepe', category: 'pasta', prepTime: 10, cookTime: 15, servings: 2, avgRating: 4.7 },
    ], grid, empty);
  }
}

function renderLikedRecipes(recipes, grid, empty) {
  if (!recipes.length) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = recipes.map(r => buildRecipeCard(r,
    `<button class="card-action-btn" onclick="unlikeRecipe('${r._id}', event)">Unlike</button>`
  )).join('');
}

async function unlikeRecipe(id, e) {
  e.preventDefault();
  e.stopPropagation();
  try {
    await apiRequest('DELETE', `/recipes/${id}/like`);
    showToast('Removed from liked recipes.');
    await loadLikedRecipes();
  } catch (err) {
    showToast('Could not unlike: ' + err.message);
  }
}

async function loadMyReviews() {
  const list = document.getElementById('myReviewsList');
  const empty = document.getElementById('reviewsEmpty');

  try {
    const data = await apiRequest('GET', '/users/me/reviews');
    const reviews = data.reviews || data;
    renderMyReviews(reviews, list, empty);
  } catch {
    renderMyReviews([
      { _id: 'v1', recipe: { _id: 'r1', title: 'French Onion Soup' }, rating: 5, comment: 'Absolutely incredible. Made it twice already.', createdAt: '2026-01-14' },
      { _id: 'v2', recipe: { _id: 'r2', title: 'Braised Short Ribs' }, rating: 5, comment: 'Best short ribs I\'ve ever had at home.', createdAt: '2025-12-20' },
    ], list, empty);
  }
}

function renderMyReviews(reviews, list, empty) {
  if (!reviews.length) {
    list.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  list.innerHTML = reviews.map(r => `
    <div class="profile-review-card">
      ${r.recipe ? `<a href="recipe.html?id=${r.recipe._id}" class="profile-review-recipe">${r.recipe.title}</a>` : ''}
      <div class="review-header">
        <span class="review-stars">${renderStars(r.rating)}</span>
        <span style="font-size:12px;color:var(--mid-gray)">${formatDate(r.createdAt)}</span>
      </div>
      <div class="review-text">${r.comment || ''}</div>
    </div>
  `).join('');
}
