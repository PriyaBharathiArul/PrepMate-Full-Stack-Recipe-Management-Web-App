// edit.js — Edit recipe page: Fetch the recipe by the id in the URL and populate the form, submit the form by PUT to update the recipe

let recipeId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  renderHeader();

  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  recipeId = params.get('id');
  if (!recipeId) {
    showToast('No recipe specified.');
    setTimeout(() => window.location.href = 'index.html', 800);
    return;
  }

  setupImageUpload();
  setupDynamicLists();
  window.removeIngredient = removeIngredient;
  window.removeStep = removeStep;

  try {
    const data = await apiRequest('GET', `/recipes/${recipeId}`);
    const recipe = data.recipe || data;
    if (recipe.author && user._id.toString() !== recipe.author._id.toString()) {
      showToast('You can only edit your own recipe.');
      setTimeout(() => window.location.href = 'index.html', 1000);
      return;
    }
    populateForm(recipe);
  } catch (err) {
    showToast('Could not load recipe: ' + err.message);
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  setupForm();
});

function populateForm(recipe) {
  document.getElementById('recipeTitle').value = recipe.title || '';
  document.getElementById('recipeCategory').value = recipe.category || '';
  document.getElementById('recipeDescription').value = recipe.description || '';
  document.getElementById('prepTime').value = recipe.prepTime || '';
  document.getElementById('cookTime').value = recipe.cookTime || '';
  document.getElementById('servings').value = recipe.servings || '';
  document.getElementById('imageUrl').value = recipe.imageUrl || '';

  if (recipe.imageUrl) {
    const preview = document.getElementById('imagePreview');
    const dropContent = document.getElementById('dropContent');
    preview.src = recipe.imageUrl;
    preview.style.display = 'block';
    dropContent.style.display = 'none';
  }

  const ingredientsList = document.getElementById('ingredientsList');
  ingredientsList.innerHTML = '';
  const ingredients = recipe.ingredients || [];
  if (ingredients.length === 0) {
    addEmptyIngredientRow(ingredientsList);
  } else {
    ingredients.forEach(ing => {
      const row = document.createElement('div');
      row.className = 'ingredient-row';
      row.innerHTML = `
        <input type="text" placeholder="e.g. 1 cup of milk" class="ingredient-input" value="${escapeHtml(ing)}"/>
        <button type="button" class="remove-btn" onclick="removeIngredient(this)">✕</button>
      `;
      ingredientsList.appendChild(row);
    });
  }

  const stepsList = document.getElementById('stepsList');
  stepsList.innerHTML = '';
  const steps = recipe.steps || recipe.instructions || [];
  if (steps.length === 0) {
    addEmptyStepRow(stepsList);
  } else {
    steps.forEach((step, i) => {
      const row = document.createElement('div');
      row.className = 'step-row';
      row.innerHTML = `
        <div class="step-number">${i + 1}</div>
        <textarea placeholder="Describe this step…" class="step-input" rows="2">${escapeHtml(step)}</textarea>
        <button type="button" class="remove-btn" onclick="removeStep(this)">✕</button>
      `;
      stepsList.appendChild(row);
    });
  }
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addEmptyIngredientRow(container) {
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  row.innerHTML = `
    <input type="text" placeholder="e.g. 1 cup of milk" class="ingredient-input"/>
    <button type="button" class="remove-btn" onclick="removeIngredient(this)">✕</button>
  `;
  container.appendChild(row);
}

function addEmptyStepRow(container) {
  const list = container;
  const num = list.querySelectorAll('.step-row').length + 1;
  const row = document.createElement('div');
  row.className = 'step-row';
  row.innerHTML = `
    <div class="step-number">${num}</div>
    <textarea placeholder="Describe this step…" class="step-input" rows="2"></textarea>
    <button type="button" class="remove-btn" onclick="removeStep(this)">✕</button>
  `;
  list.appendChild(row);
}

function setupImageUpload() {
  const dropZone = document.getElementById('imageDropZone');
  const input = document.getElementById('imageInput');
  const preview = document.getElementById('imagePreview');
  const dropContent = document.getElementById('dropContent');
  const urlInput = document.getElementById('imageUrl');

  dropZone.addEventListener('click', () => input.click());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--clay)';
    dropZone.style.background = 'var(--parchment)';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '';
    dropZone.style.background = '';
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    dropZone.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) showPreview(file);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) showPreview(input.files[0]);
  });

  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      dropContent.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  urlInput.addEventListener('blur', () => {
    if (urlInput.value.trim()) {
      preview.src = urlInput.value.trim();
      preview.style.display = 'block';
      dropContent.style.display = 'none';
    }
  });
}

function setupDynamicLists() {
  document.getElementById('addIngredient').addEventListener('click', () => {
    const list = document.getElementById('ingredientsList');
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.innerHTML = `
      <input type="text" placeholder="e.g. 1 cup of milk" class="ingredient-input"/>
      <button type="button" class="remove-btn" onclick="removeIngredient(this)">✕</button>
    `;
    list.appendChild(row);
  });

  document.getElementById('addStep').addEventListener('click', () => {
    const list = document.getElementById('stepsList');
    const num = list.querySelectorAll('.step-row').length + 1;
    const row = document.createElement('div');
    row.className = 'step-row';
    row.innerHTML = `
      <div class="step-number">${num}</div>
      <textarea placeholder="Describe this step…" class="step-input" rows="2"></textarea>
      <button type="button" class="remove-btn" onclick="removeStep(this)">✕</button>
    `;
    list.appendChild(row);
  });
}

function removeIngredient(btn) {
  const list = document.getElementById('ingredientsList');
  if (list.querySelectorAll('.ingredient-row').length > 1) {
    btn.closest('.ingredient-row').remove();
  }
}

function removeStep(btn) {
  const list = document.getElementById('stepsList');
  if (list.querySelectorAll('.step-row').length > 1) {
    btn.closest('.step-row').remove();
    list.querySelectorAll('.step-number').forEach((el, i) => el.textContent = i + 1);
  }
}

function setupForm() {
  document.getElementById('createRecipeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('recipeTitle').value.trim();
    const category = document.getElementById('recipeCategory').value;
    const description = document.getElementById('recipeDescription').value.trim();
    const prepTime = parseInt(document.getElementById('prepTime').value) || 0;
    const cookTime = parseInt(document.getElementById('cookTime').value) || 0;
    const servings = parseInt(document.getElementById('servings').value) || 0;
    const imageUrl = document.getElementById('imageUrl').value.trim() || null;

    const ingredients = [...document.querySelectorAll('.ingredient-input')]
      .map(el => el.value.trim()).filter(Boolean);

    const steps = [...document.querySelectorAll('.step-input')]
      .map(el => el.value.trim()).filter(Boolean);

    if (!title || !category) { showToast('Please fill in required fields.'); return; }
    if (!ingredients.length) { showToast('Add at least one ingredient.'); return; }
    if (!steps.length) { showToast('Add at least one step.'); return; }

    const payload = { title, category, description, prepTime, cookTime, servings, imageUrl, ingredients, steps };

    const submitBtn = e.target.querySelector('[type="submit"]');
    submitBtn.textContent = 'Saving…';
    submitBtn.disabled = true;

    try {
      await apiRequest('PUT', `/recipes/${recipeId}`, payload);
      showToast('Recipe updated.');
      setTimeout(() => window.location.href = `recipe.html?id=${recipeId}`, 1000);
    } catch (err) {
      showToast('Could not save: ' + err.message);
      submitBtn.textContent = 'Save Changes';
      submitBtn.disabled = false;
    }
  });

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) cancelBtn.href = `recipe.html?id=${recipeId}`;
}
