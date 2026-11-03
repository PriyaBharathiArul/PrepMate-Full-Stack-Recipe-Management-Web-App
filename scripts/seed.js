// Adds example recipes to the database. Safe to run more than once:
// recipes whose title already exists are skipped.
// Usage: npm run seed  (optionally SEED_USER_EMAIL=you@uw.edu npm run seed)
import mongoose from 'mongoose';
import models from '../models.js';

const img = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`;

const recipes = [
  {
    title: 'Roasted Tomato Basil Soup',
    category: 'soup',
    description: 'Velvety tomato soup made with oven-roasted tomatoes, garlic, and fresh basil.',
    imageUrl: img('1547592166-23ac45744acd'),
    prepTime: 15, cookTime: 45, servings: 4,
    ingredients: ['2 lb ripe tomatoes, halved', '1 onion, quartered', '6 garlic cloves', '3 tbsp olive oil', '2 cups vegetable broth', '1/2 cup fresh basil', '1/4 cup heavy cream', 'Salt and pepper'],
    steps: ['Heat the oven to 425°F.', 'Toss tomatoes, onion, and garlic with olive oil, salt, and pepper on a sheet pan.', 'Roast for 35 minutes until caramelized.', 'Transfer to a pot, add broth, and simmer for 10 minutes.', 'Add basil and blend until smooth.', 'Stir in cream and season to taste.'],
  },
  {
    title: 'Slow-Roasted Beef Brisket',
    category: 'meat',
    description: 'Tender, smoky brisket with a peppery crust, sliced thin against the grain.',
    imageUrl: img('1529692236671-f1f6cf9683ba'),
    prepTime: 20, cookTime: 300, servings: 8,
    ingredients: ['4 lb beef brisket', '2 tbsp kosher salt', '2 tbsp coarse black pepper', '1 tbsp smoked paprika', '1 tbsp garlic powder', '1 cup beef broth'],
    steps: ['Mix salt, pepper, paprika, and garlic powder and rub all over the brisket.', 'Rest at room temperature for 1 hour.', 'Roast fat-side up at 275°F for 3 hours.', 'Add broth, cover tightly with foil, and roast 2 more hours until tender.', 'Rest 30 minutes, then slice against the grain.'],
  },
  {
    title: 'Grilled Chicken Skewers',
    category: 'meat',
    description: 'Juicy marinated chicken skewers charred on the grill with a garlicky yogurt sauce.',
    imageUrl: img('1555939594-58d7cb561ad1'),
    prepTime: 20, cookTime: 15, servings: 4,
    ingredients: ['2 lb chicken thighs, cubed', '1/2 cup plain yogurt', '2 tbsp lemon juice', '3 garlic cloves, minced', '1 tsp cumin', '1 tsp smoked paprika', 'Salt and pepper', 'Wooden skewers, soaked'],
    steps: ['Whisk yogurt, lemon juice, garlic, cumin, paprika, salt, and pepper.', 'Coat the chicken and marinate for at least 1 hour.', 'Thread chicken onto skewers.', 'Grill over medium-high heat for 12–15 minutes, turning often.', 'Serve with extra yogurt sauce.'],
  },
  {
    title: 'Creamy Parmesan Risotto',
    category: 'vegetarian',
    description: 'Classic Italian risotto stirred slowly until creamy, finished with parmesan and herbs.',
    imageUrl: img('1476124369491-e7addf5db371'),
    prepTime: 10, cookTime: 30, servings: 4,
    ingredients: ['1 1/2 cups arborio rice', '5 cups warm vegetable broth', '1 shallot, minced', '1/2 cup dry white wine', '3 tbsp butter', '3/4 cup grated parmesan', 'Fresh chives'],
    steps: ['Melt 1 tbsp butter and cook the shallot until soft.', 'Add rice and toast for 2 minutes.', 'Pour in wine and stir until absorbed.', 'Add broth one ladle at a time, stirring until each is absorbed, about 20 minutes.', 'Stir in remaining butter and parmesan.', 'Top with chives and serve immediately.'],
  },
  {
    title: 'Shoyu Ramen',
    category: 'noodles',
    description: 'Comforting soy-based ramen with jammy eggs, shrimp, and crisp vegetables.',
    imageUrl: img('1569718212165-3a8278d5f624'),
    prepTime: 20, cookTime: 25, servings: 2,
    ingredients: ['2 portions fresh ramen noodles', '4 cups chicken broth', '3 tbsp soy sauce', '1 tbsp mirin', '1 tsp sesame oil', '2 soft-boiled eggs', '8 shrimp', 'Snow peas and scallions'],
    steps: ['Simmer broth with soy sauce, mirin, and sesame oil.', 'Poach shrimp in the broth for 3 minutes, then remove.', 'Cook noodles according to the package and drain.', 'Divide noodles between bowls and ladle broth over them.', 'Top with halved eggs, shrimp, snow peas, and scallions.'],
  },
  {
    title: 'Vegetable Lo Mein',
    category: 'noodles',
    description: 'Quick stir-fried noodles tossed with crunchy vegetables in a savory sauce.',
    imageUrl: img('1585032226651-759b368d7246'),
    prepTime: 15, cookTime: 10, servings: 3,
    ingredients: ['8 oz lo mein noodles', '2 tbsp soy sauce', '1 tbsp oyster sauce', '1 tsp sugar', '1 tbsp vegetable oil', '1 carrot, julienned', '1 bell pepper, sliced', '2 cups cabbage, shredded', '2 garlic cloves'],
    steps: ['Cook noodles and drain.', 'Mix soy sauce, oyster sauce, and sugar.', 'Stir-fry garlic and vegetables in hot oil for 3 minutes.', 'Add noodles and sauce and toss for 2 minutes.', 'Serve hot.'],
  },
  {
    title: 'Spicy Garlic Noodles',
    category: 'noodles',
    description: 'Chewy noodles in a sizzling chili-garlic oil, ready in 15 minutes.',
    imageUrl: img('1612929633738-8fe44f7ec841'),
    prepTime: 5, cookTime: 10, servings: 2,
    ingredients: ['8 oz wheat noodles', '4 garlic cloves, minced', '1 tbsp chili flakes', '3 tbsp neutral oil', '2 tbsp soy sauce', '1 tbsp black vinegar', '1 tsp sugar', 'Scallions'],
    steps: ['Cook noodles and drain.', 'Put garlic and chili flakes in a heatproof bowl.', 'Heat oil until shimmering and pour over the garlic.', 'Stir in soy sauce, vinegar, and sugar.', 'Toss with noodles and top with scallions.'],
  },
  {
    title: 'Strawberry Panna Cotta',
    category: 'dessert',
    description: 'Silky vanilla panna cotta topped with fresh macerated strawberries.',
    imageUrl: img('1488477181946-6428a0291777'),
    prepTime: 15, cookTime: 5, servings: 6,
    ingredients: ['2 cups heavy cream', '1 cup milk', '1/3 cup sugar', '2 1/4 tsp gelatin', '1 tsp vanilla extract', '2 cups strawberries, diced', '1 tbsp honey'],
    steps: ['Sprinkle gelatin over milk and let it bloom for 5 minutes.', 'Warm cream and sugar until the sugar dissolves.', 'Stir in the milk mixture and vanilla until smooth.', 'Pour into jars and chill for at least 4 hours.', 'Toss strawberries with honey and spoon on top.'],
  },
  {
    title: 'Strawberry Layer Cake',
    category: 'dessert',
    description: 'Light sponge layered with whipped cream and fresh strawberries.',
    imageUrl: img('1565958011703-44f9829ba187'),
    prepTime: 30, cookTime: 30, servings: 10,
    ingredients: ['2 cups cake flour', '1 1/2 cups sugar', '4 eggs', '1/2 cup butter, softened', '1 cup milk', '2 tsp baking powder', '2 cups heavy cream, whipped', '2 cups strawberries, sliced'],
    steps: ['Heat the oven to 350°F and line two 8-inch pans.', 'Cream butter and sugar, then beat in eggs one at a time.', 'Alternate adding flour mixture and milk.', 'Bake for 25–30 minutes and cool completely.', 'Layer cakes with whipped cream and strawberries.'],
  },
  {
    title: 'Farfalle Primavera',
    category: 'pasta',
    description: 'Bow-tie pasta with cherry tomatoes, fresh herbs, and a light olive oil dressing.',
    imageUrl: img('1473093295043-cdd812d0e601'),
    prepTime: 10, cookTime: 15, servings: 4,
    ingredients: ['1 lb farfalle', '2 cups cherry tomatoes, halved', '2 cups baby spinach', '3 tbsp olive oil', '2 garlic cloves', '1/4 cup parmesan', 'Fresh basil'],
    steps: ['Cook pasta until al dente and reserve 1/2 cup pasta water.', 'Sauté garlic in olive oil for 1 minute.', 'Add tomatoes and cook until just softened.', 'Toss in pasta, spinach, and a splash of pasta water.', 'Finish with parmesan and basil.'],
  },
  {
    title: 'Garlic Shrimp Spaghetti',
    category: 'pasta',
    description: 'Spaghetti tossed with garlicky shrimp, cherry tomatoes, and a hint of chili.',
    imageUrl: img('1563379926898-05f4575a45d8'),
    prepTime: 10, cookTime: 15, servings: 4,
    ingredients: ['1 lb spaghetti', '1 lb shrimp, peeled', '5 garlic cloves, sliced', '1 cup cherry tomatoes', '1/2 tsp chili flakes', '3 tbsp butter', '2 tbsp olive oil', 'Parsley and lemon'],
    steps: ['Cook spaghetti and reserve some pasta water.', 'Sear shrimp in olive oil for 2 minutes per side and set aside.', 'Melt butter with garlic and chili flakes.', 'Add tomatoes and cook until they burst.', 'Toss in pasta, shrimp, and pasta water; finish with lemon and parsley.'],
  },
  {
    title: 'Pan-Seared Salmon',
    category: 'seafood',
    description: 'Crispy-skinned salmon with a bright cucumber-tomato salsa.',
    imageUrl: img('1467003909585-2f8a72700288'),
    prepTime: 10, cookTime: 12, servings: 2,
    ingredients: ['2 salmon fillets, skin on', '1 tbsp olive oil', '1 small cucumber, diced', '1 tomato, diced', '1 tbsp lemon juice', 'Fresh dill', 'Salt and pepper'],
    steps: ['Pat salmon dry and season with salt and pepper.', 'Sear skin-side down in hot oil for 5–6 minutes.', 'Flip and cook 2–3 minutes more.', 'Mix cucumber, tomato, lemon juice, and dill.', 'Spoon the salsa over the salmon.'],
  },
  {
    title: 'Coconut Shrimp Curry',
    category: 'seafood',
    description: 'Fragrant coconut curry with plump shrimp, served over steamed rice.',
    imageUrl: img('1559847844-5315695dadae'),
    prepTime: 15, cookTime: 20, servings: 4,
    ingredients: ['1 lb shrimp, peeled', '1 can coconut milk', '2 tbsp curry paste', '1 onion, diced', '2 garlic cloves', '1 tbsp ginger, grated', '1 tbsp fish sauce', 'Cilantro and steamed rice'],
    steps: ['Sauté onion, garlic, and ginger until soft.', 'Stir in curry paste and cook for 1 minute.', 'Add coconut milk and simmer for 10 minutes.', 'Add shrimp and cook until pink, about 4 minutes.', 'Season with fish sauce and serve over rice with cilantro.'],
  },
];

const email = process.env.SEED_USER_EMAIL;
const owner = email ? await models.User.findOne({ email }) : await models.User.findOne().sort({ createdAt: 1 });
if (!owner) {
  console.error('No user found. Sign in to the app once first, then run the seed again.');
  process.exit(1);
}

let added = 0;
for (const recipe of recipes) {
  if (await models.Recipe.exists({ title: recipe.title })) continue;
  await models.Recipe.create({ ...recipe, createdBy: owner._id });
  added++;
}

console.log(`Added ${added} recipe(s), skipped ${recipes.length - added} existing, owner: ${owner.email}`);
await mongoose.disconnect();
