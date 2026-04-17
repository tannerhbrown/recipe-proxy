# GnomeChef 🥗

GnomeChef is a healthy recipe discovery and cooking assistant application. It helps users find curated healthy recipes based on various dietary needs and provides a focused cooking experience with integrated tools.

## Features

- **Curated Recipe Discovery**: discovery of healthy recipes across 13 dietary categories including:
  - Paleo
  - Low Carb
  - Anti-Inflammatory
  - Whole30
  - Air Fryer
  - Mediterranean
  - High Protein
  - And more...
- **Personal Cookbook**: Bookmark favorite recipes to save them locally for quick access using browser `localStorage`.
- **Focused Cooking Mode**: A specialized, distraction-free UI for following recipes step-by-step.
- **Dynamic Serving Scaling**: Automatically adjusts ingredient quantities when you change the serving size.
- **Integrated Kitchen Timer**: Built-in timer with presets (5m, 10m, 15m, 20m, 30m) to help you track your cooking progress without leaving the app.
- **Dark Mode Support**: Seamless support for both light and dark themes based on your system preferences.

## Tech Stack

- **Frontend**: React 18 (loaded via CDN), Babel standalone for in-browser JSX compilation, and custom CSS-in-JS.
- **Backend**: Node.js (Vercel Serverless Functions).
- **Data Source**: [Spoonacular API](https://spoonacular.com/food-api).

## Project Structure

- `index.html`: Main application entry point containing the React frontend.
- `api/recipes.js`: Serverless function that handles recipe fetching, filtering, and preferred source prioritization.
- `vercel.json`: Configuration for deployment and routing on Vercel.
- `GT-Favicon.png` & `GT-Logo.png`: Brand assets.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed.
- [Vercel CLI](https://vercel.com/docs/cli) installed (`npm install -g vercel`).
- A Spoonacular API Key (you can get one at [spoonacular.com/food-api](https://spoonacular.com/food-api)).

### Configuration

1. Obtain your Spoonacular API key.
2. Set the environment variable `SPOONACULAR_API_KEY`. You can do this by creating a `.env` file in the root directory for local development:
   ```env
   SPOONACULAR_API_KEY=your_api_key_here
   ```

### Local Development

Run the following command in the root directory to start the development server:

```bash
vercel dev
```

The application will be available at `http://localhost:3000`.

## Deployment

To deploy the application to Vercel, run:

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

---
*Created by the minds behind GnomeTracker™*
