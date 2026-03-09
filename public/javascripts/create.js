
// Creating recipe page
// global variable to store the uploaded image URL
let uploadedImageUrl = null; 

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  renderHeader();

  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  setupImageUpload();
  setupDynamicLists();
  setupForm();
});

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
    if (file && file.type.startsWith('image/')) uploadAndPreview(file);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) uploadAndPreview(input.files[0]);
  });

  async function uploadAndPreview(file) {
    // preview locally
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      dropContent.style.display = 'none';
    };
    reader.readAsDataURL(file);

    // upload to server (local /api/upload or can be changed to Azure Blob)
    showToast('Uploading image…');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      uploadedImageUrl = data.url;
      urlInput.value = data.url;
      showToast('Image uploaded!');
    } catch (err) {
      showToast('Image upload failed: ' + err.message);
      uploadedImageUrl = null;
    }
  }

  urlInput.addEventListener('blur', () => {
    if (urlInput.value.trim()) {
      uploadedImageUrl = urlInput.value.trim();
      preview.src = urlInput.value.trim();
      preview.style.display = 'block';
      dropContent.style.display = 'none';
    }
  });
}

function setupDynamicLists() {
  // Ingredients
  document.getElementById('addIngredient').addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.innerHTML = `
      <input type="text" placeholder="e.g. 1 cup of milk" class="ingredient-input"/>
      <button type="button" class="remove-btn" onclick="removeIngredient(this)">✕</button>
    `;
    document.getElementById('ingredientsList').appendChild(row);
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
    submitBtn.textContent = 'Publishing…';
    submitBtn.disabled = true;

    try {
      const data = await apiRequest('POST', '/recipes', payload);
      showToast('Recipe published! 🎉');
      const id = data.recipe?._id || data._id;
      setTimeout(() => window.location.href = id ? `recipe.html?id=${id}` : 'index.html', 1000);
    } catch (err) {
      showToast('Could not publish: ' + err.message);
      submitBtn.textContent = 'Publish Recipe';
      submitBtn.disabled = false;
    }
  });
}
