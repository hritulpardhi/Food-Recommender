# Food Recommender

AI-powered snack recommendation app built with Next.js.  
The main application lives in `snack-ai/`.
<img width="2557" height="1300" alt="image" src="https://github.com/user-attachments/assets/0c07e260-4bba-42e6-a8e6-69527447688e" />


## Features

- Generate snack recipes from preferences:
  - goal
  - time
  - cooking method
  - hunger level
- AI recipe generation via Groq chat completions API
- Nutrition estimation using USDA FoodData Central API
- Fallback to LLM-estimated macros when nutrition API is unavailable
- Recent recipe history cached in browser local storage

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion

## Project Structure

```text
.
|- README.md
`- snack-ai/
   |- app/
   |  |- api/
   |  |  |- route.js
   |  |  `- snack/route.js
   |  |- page.tsx
   |  `- ...
   |- package.json
   `- ...
```

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm

## Setup

1. Install dependencies:

```bash
cd snack-ai
npm install
```

2. Create `.env.local` in `snack-ai/`:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
GROQ_MODEL_FALLBACKS=groq/compound,openai/gpt-oss-20b

# USDA nutrition API
USDA_API_KEY=your_usda_api_key
# Optional alias used by the app:
NUTRITION_API_KEY=your_usda_api_key
NUTRITION_API_URL=https://api.nal.usda.gov/fdc/v1/foods/search
```

3. Start development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Scripts

Run from `snack-ai/`:

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run ESLint

## API Endpoints

- `POST /api/snack` (also exported through `app/api/snack/route.js`)
  - Input JSON:
    - `goal`
    - `time`
    - `cooking`
    - `hunger`
  - Output JSON:
    - recipe name
    - ingredients + table
    - steps
    - macros
    - nutrition item breakdown (when available)

## Notes

- The UI warns that recipes are AI-generated and may be inaccurate.
- Always verify ingredients, allergens, and food safety.
