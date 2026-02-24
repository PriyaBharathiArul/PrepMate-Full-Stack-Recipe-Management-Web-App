// recipe.js — Recipe detail page

let recipeId = null;
let currentRating = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  renderHeader();
  if (typeof initLoginModal === 'function') {
    initLoginModal();
  }

  const params = new URLSearchParams(window.location.search);
  recipeId = params.get('id');

  if (!recipeId) {
    document.getElementById('recipeDetailContainer').innerHTML = '<p style="padding:40px;color:var(--mid-gray);">No recipe specified.</p>';
    return;
  }

  await loadRecipe();
  await loadReviews();
  setupReviewUI();
});

async function loadRecipe() {
  const container = document.getElementById('recipeDetailContainer');
  try {
    const data = await apiRequest('GET', `/recipes/${recipeId}`);
    renderRecipeDetail(data.recipe || data);
  } catch {
    // Demo fallback
    renderRecipeDetail(getDemoRecipe());
  }
}

function getDemoRecipe() {
  return {
    _id: recipeId,
    title: 'French Onion Soup',
    category: 'soup',
    description: 'A rich and deeply satisfying classic that transforms humble onions into something extraordinary through the alchemy of low, slow caramelization.',
    imageUrl: null,
    author: { username: 'Chef Marie', _id: '999' },
    prepTime: 20,
    cookTime: 75,
    servings: 4,
    avgRating: 4.8,
    likeCount: 142,
    ingredients: [
      '4 large yellow onions, thinly sliced',
      '4 tbsp unsalted butter',
      '1 tbsp olive oil',
      '1 tsp sugar',
      '1 cup dry white wine',
      '6 cups beef stock',
      '2 sprigs fresh thyme',
      '1 bay leaf',
      'Salt and black pepper to taste',
      '8 thick slices baguette',
      '200g Gruyère, grated',
    ],
    steps: [
      'In a large heavy-bottomed pot over medium heat, melt butter with olive oil. Add onions and a pinch of salt, stirring to coat.',
      'Cook onions, stirring occasionally, for 45–60 minutes until deeply golden and caramelized. Add sugar halfway through to help browning.',
      'Add white wine and scrape up any browned bits from the bottom. Cook for 5 minutes until wine is mostly absorbed.',
      'Add beef stock, thyme, and bay leaf. Simmer for 20 minutes. Season with salt and pepper, then remove thyme and bay leaf.',
      'Preheat broiler. Ladle soup into oven-safe bowls. Top with baguette slices and a generous mound of Gruyère.',
      'Broil for 3–4 minutes until the cheese is bubbly and browned in spots. Serve immediately.',
    ],
  };
}

function renderRecipeDetail(recipe) {
  const container = document.getElementById('recipeDetailContainer');
  const user = getUser();
  const emoji = getCategoryEmoji(recipe.category);

  const img = recipe.imageUrl
    ? `<img class="recipe-detail-hero" src="${recipe.imageUrl}" alt="${recipe.title}"/>`
    : `<div class="recipe-detail-hero-placeholder">${emoji}</div>`;

  const authorInitial = recipe.author ? recipe.author.username[0].toUpperCase() : 'C';
  const authorName = recipe.author ? recipe.author.username : 'Anonymous';

  const likeBtn = user
    ? `<button class="like-btn" id="likeBtn"><span class="heart">♥</span> <span id="likeCount">${recipe.likeCount || 0}</span></button>`
    : `<button class="like-btn" id="likeBtn" onclick="document.getElementById('loginModal').style.display='flex'"><span class="heart">♥</span> <span id="likeCount">${recipe.likeCount || 0}</span></button>`;

  container.innerHTML = `
    ${img}
    <div class="recipe-detail-tag">${recipe.category || 'Recipe'}</div>
    <h1 class="recipe-detail-title">${recipe.title}</h1>
    <div class="recipe-detail-author">
      <div class="avatar-sm">${authorInitial}</div>
      by <strong>${authorName}</strong>
    </div>
    <div class="recipe-detail-actions">
      ${likeBtn}
      <div class="recipe-stat-chips">
        ${recipe.prepTime ? `<div class="stat-chip"><strong>${recipe.prepTime}m</strong>Prep</div>` : ''}
        ${recipe.cookTime ? `<div class="stat-chip"><strong>${recipe.cookTime}m</strong>Cook</div>` : ''}
        ${recipe.servings ? `<div class="stat-chip"><strong>${recipe.servings}</strong>Servings</div>` : ''}
        ${recipe.avgRating ? `<div class="stat-chip"><strong>★ ${recipe.avgRating.toFixed(1)}</strong>Rating</div>` : ''}
      </div>
    </div>
    ${recipe.description ? `<p class="recipe-detail-desc">${recipe.description}</p>` : ''}
    <div class="recipe-two-col">
      <div>
        <h2 class="recipe-section-title">Ingredients</h2>
        <ul class="ingredients-list">
          ${(recipe.ingredients || []).map(ing => `<li>${ing}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h2 class="recipe-section-title">Instructions</h2>
        <ol class="steps-list">
          ${(recipe.steps || []).map((step, i) => `
            <li>
              <div class="step-num">${i + 1}</div>
              <div>${step}</div>
            </li>
          `).join('')}
        </ol>
      </div>
    </div>
  `;

  // Like button logic
  const likeButton = document.getElementById('likeBtn');
  if (likeButton && user) {
    // Check if already liked
    checkLiked(recipe._id).then(liked => {
      if (liked) likeButton.classList.add('liked');
    });

    likeButton.addEventListener('click', async () => {
      try {
        const liked = likeButton.classList.contains('liked');
        if (liked) {
          await apiRequest('DELETE', `/recipes/${recipe._id}/like`);
          likeButton.classList.remove('liked');
          const cnt = document.getElementById('likeCount');
          cnt.textContent = Math.max(0, parseInt(cnt.textContent) - 1);
        } else {
          const res = await apiRequest('POST', `/recipes/${recipe._id}/like`);
          likeButton.classList.add('liked');
          const cnt = document.getElementById('likeCount');
          cnt.textContent = parseInt(cnt.textContent) + 1;
        }
      } catch (err) {
        showToast('Could not update like: ' + err.message);
      }
    });
  }
}

async function checkLiked(recipeId) {
  try {
    const data = await apiRequest('GET', `/recipes/${recipeId}/liked`);
    return data.liked;
  } catch { return false; }
}

async function loadReviews() {
  const list = document.getElementById('reviewsList');
  try {
    const data = await apiRequest('GET', `/recipes/${recipeId}/reviews`);
    const reviews = data.reviews || data;
    if (!reviews.length) {
      list.innerHTML = '<p style="color:var(--mid-gray);font-style:italic;">No reviews yet. Be the first!</p>';
      return;
    }
    list.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <span class="review-user">${r.user?.username || 'Anonymous'}</span>
          <span class="review-stars">${renderStars(r.rating)}</span>
        </div>
        <div class="review-text">${r.comment || ''}</div>
        <div class="review-date">${formatDate(r.createdAt)}</div>
      </div>
    `).join('');
  } catch {
    // Demo reviews
    list.innerHTML = `
      <div class="review-card">
        <div class="review-header">
          <span class="review-user">Thomas R.</span>
          <span class="review-stars">★★★★★</span>
        </div>
        <div class="review-text">Made this last Sunday — absolute perfection. The key really is patience with the onions. Don't rush it!</div>
        <div class="review-date">Jan 14, 2026</div>
      </div>
      <div class="review-card">
        <div class="review-header">
          <span class="review-user">Sophie L.</span>
          <span class="review-stars">★★★★★</span>
        </div>
        <div class="review-text">My entire family asked me to make it again the very next weekend. This is a keeper.</div>
        <div class="review-date">Dec 28, 2025</div>
      </div>
    `;
  }
}

function setupReviewUI() {
  const user = getUser();
  const formWrap = document.getElementById('reviewFormWrap');
  const loginPrompt = document.getElementById('loginToReview');

  if (user) {
    if (formWrap) formWrap.style.display = 'block';
  } else {
    if (loginPrompt) loginPrompt.style.display = 'block';
    const link = document.getElementById('loginToReviewLink');
    if (link) link.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('loginModal').style.display = 'flex';
    });
  }

  // Star picker
  const stars = document.querySelectorAll('#starPicker .star');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val);
      stars.forEach((s, i) => s.classList.toggle('hover', i < val));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hover'));
      stars.forEach((s, i) => s.classList.toggle('active', i < currentRating));
    });
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.val);
      stars.forEach((s, i) => s.classList.toggle('active', i < currentRating));
    });
  });

  const submitBtn = document.getElementById('submitReview');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const comment = document.getElementById('reviewText').value.trim();
      if (!currentRating) { showToast('Please select a star rating.'); return; }
      try {
        await apiRequest('POST', `/recipes/${recipeId}/reviews`, { rating: currentRating, comment });
        showToast('Review posted! ⭐');
        document.getElementById('reviewText').value = '';
        currentRating = 0;
        stars.forEach(s => s.classList.remove('active'));
        await loadReviews();
      } catch (err) {
        showToast('Could not post review: ' + err.message);
      }
    });
  }
}
