// index.js — Homepage logic

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  renderHeader();
  setupFilters();
  await loadRecipes('all');
});

let allRecipes = [];
let activeFilter = 'all';

async function loadRecipes(filter) {
  const grid = document.getElementById('recipesGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--mid-gray);font-style:italic;">Loading recipes…</div>';

  try {
    const params = filter && filter !== 'all' ? `?category=${filter}` : '';
    const data = await apiRequest('GET', `/recipes${params}`);
    allRecipes = data.recipes || data;
    renderGrid(allRecipes);
  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--mid-gray);">Could not load recipes. Make sure the server is running.</div>`;

    // Demo mode: show placeholder cards if API not available
    renderDemoCards(filter);
  }
}

function renderDemoCards(filter) {
  const demoData = [
    { _id: '1', title: 'French Onion Soup', category: 'soup', description: 'A rich and hearty classic with caramelized onions and gruyère croutons.', prepTime: 20, cookTime: 60, servings: 4, avgRating: 4.8 },
    { _id: '2', title: 'Braised Short Ribs', category: 'meat', description: 'Fall-off-the-bone tender ribs slow-braised in red wine and herbs.', prepTime: 30, cookTime: 180, servings: 4, avgRating: 4.9 },
    { _id: '3', title: 'Cacio e Pepe', category: 'pasta', description: 'Roman perfection — just pasta, pecorino, and black pepper.', prepTime: 10, cookTime: 15, servings: 2, avgRating: 4.7 },
    { _id: '4', title: 'Roasted Cauliflower', category: 'vegetarian', description: 'Golden cauliflower with tahini, pomegranate, and fresh herbs.', prepTime: 15, cookTime: 35, servings: 4 },
    { _id: '5', title: 'Crème Brûlée', category: 'dessert', description: 'Silky vanilla custard with a perfectly crackled caramel top.', prepTime: 20, cookTime: 45, servings: 6, avgRating: 5.0 },
    { _id: '6', title: 'Seared Salmon', category: 'seafood', description: 'Pan-seared salmon with lemon butter sauce and capers.', prepTime: 10, cookTime: 12, servings: 2, avgRating: 4.6 },
    { _id: '7', title: 'Ribollita', category: 'soup', description: 'A hearty Tuscan bread soup with kale, cannellini beans, and day-old bread.', prepTime: 30, cookTime: 60, servings: 6 },
    { _id: '8', title: 'Beef Tartare', category: 'meat', description: 'Hand-cut tenderloin with capers, cornichons, egg yolk, and Dijon.', prepTime: 20, cookTime: 0, servings: 2, avgRating: 4.5 },
  ];

  const filtered = filter === 'all' ? demoData : demoData.filter(r => r.category === filter);
  renderGrid(filtered);
}

function renderGrid(recipes) {
  const grid = document.getElementById('recipesGrid');

  if (!recipes.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--mid-gray);font-style:italic;">No recipes found for this category.</div>';
    return;
  }

  grid.innerHTML = recipes.map((r, i) => {
    const card = buildRecipeCard(r);
    // stagger animation
    return card.replace('class="recipe-card"', `class="recipe-card" style="animation-delay:${i * 0.06}s"`);
  }).join('');
}

function setupFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', async () => {

      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      await loadRecipes(activeFilter);
    });
  });
}
