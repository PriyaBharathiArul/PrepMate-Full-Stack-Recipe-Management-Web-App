# PrepMate

**Final Project Proposal**  
Course: INFO441 – Server Side Development  
By: Priya, Hongyan, Rui

---

## Overview

Our target audience is busy home cooks and meal planners who want a more organized and efficient way to manage their cooking routines. These users enjoy preparing meals but struggle with deciding what to cook, tracking ingredients. They may be young professionals living independently, parents planning weekly family meals, or anyone seeking a more structured alternative to endlessly browsing recipe websites.

Many existing recipe platforms prioritize content discovery over practical organization. While they offer large collections of recipes, they often include lengthy blog-style content, advertisements, and limited personalization tools. As a result, users frequently switch between multiple applications — one for recipes, another for ingredients, and another for meal planning.

PrepMate addresses this gap by combining recipe management, meal organization, and automatic ingredients generation into a single streamlined platform. By reducing manual effort and simplifying planning, the application lowers the cognitive load involved in preparing meals.

We are building this application because we have personally experienced the inefficiencies of managing recipes and meal preparation. From forgetting ingredients at the grocery store to spending excessive time navigating cluttered websites, we understand the problem firsthand.

This project allows us to solve a real-world challenge while strengthening our backend development skills, particularly in designing RESTful systems, managing structured data, and implementing secure authentication. Ultimately, we are motivated to create a practical tool that we would genuinely use in our own daily lives.

---

## Architectural Diagrams
![Architecture Diagram](pictures/architecture_diagram.png)

---

## Data Flow

![Data Flow](pictures/data_flow.png)

---

## Summary Table for User Stories

| Priority | User | Description | Technical Implementation |
|---------|------|-------------|------------------------|
| P0 | As a user | I want to create an account and log in/out so my saved content is private. | Implement secure authentication with password hashing (bcrypt) and token-based session handling (JWT). |
| P0 | As a user | I want to browse all recipes. | Retrieve recipe data from the database and return it through REST endpoints for display on the client. |
| P0 | As a user | I want to filter recipes by category. | Store category fields in recipes and apply query-based filtering on the server before returning results. |
| P0 | As a user | I want to create my own recipes. | Accept recipe data from authenticated users and store it linked to their user ID. |
| P0 | As a user | I want to edit or delete recipes I created. | Verify recipe ownership before allowing updates or deletions in the database. |
| P1 | As a user | I want to comment on recipes. | Store comments with references to both the recipe and the user, and retrieve them when viewing a recipe. |
| P1 | As a user | I want to get recipe details from selected recipes. | Retrieve user’s recipe data from the database. |
| P2 | As a user | I want to favorite recipes. | Store references to favorited recipes in the user profile and update favorite counts accordingly. |
| P2 | As a user | I want to view my profile and all recipes I created. | Query the database for recipes linked to the user’s ID and display them on a profile page. |
| P2 | As a user | I want to upload an image for my recipe. | Handle image uploads using Azure Blob Storage. |
| P3 | As a user | I want to search recipes by keywords. | Use database text search or keyword matching to return relevant recipes. |
| P3 | As a user | I want to see nutritional information. | Store optional nutrition fields and optionally integrate a third-party nutrition API. |
| P3 | As a user | I want to share meal plans with friends. | Store shared meal plan data and optionally implement real-time updates using Socket.io. |

---

## API Endpoints

### Authentication

```
POST /auth/register
POST /auth/login
GET  /auth/me
PUT  /users/me
```

### Recipes

```
GET    /recipes
GET    /recipes/:id
POST   /recipes
PUT    /recipes/:id
DELETE /recipes/:id
```

### Favorites

```
POST /recipes/:id/favorite
GET  /users/me/favorites
```

### Comments

```
GET    /recipes/:id/comments
POST   /recipes/:id/comments
DELETE /comments/:id
```

### User Content

```
GET /users/me/recipes
```

---

## Database Schema

### Users

```
_id (ObjectId)
title (string)
description (string)
category (string)
ingredients (JSON)
instructions (list of strings)
imageUrl (string)
createdBy (ObjectId)
favoritesCount (number)
createdAt (date)
```

### Recipes

```
_id (ObjectId)
title (string)
description (string)
category (string)
ingredients (JSON)
instructions (list of strings)
imageUrl (string)
createdBy (ObjectId)
favoritesCount (number)
createdAt (date)
```

### Comments

```
_id (ObjectId)
recipeId (ObjectId)
userId (ObjectId)
text (string)
createdAt (date)
```

---

## Database Details

We store our recipe ingredients as structured JSON in the database. Each recipe document looks like:

```json
{
  "title": "Chicken Teriyaki Bowl",
  "ingredients": [
    {
      "section": "Chicken",
      "items": [
        {
          "amount": 2,
          "unit": "lbs",
          "name": "boneless skinless chicken thighs",
          "grams": 908
        }
      ]
    }
  ]
}
```

This structure preserves recipe formatting while enabling computation and future features.
