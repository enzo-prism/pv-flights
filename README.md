# Pole Vault Flights

Minimal MVP for searching pole-approved flight offers and listing approved airlines.

## Live deployment

- Production: https://pv-flights.vercel.app
- Vercel deployment URL: https://pv-flights-9hp6a86e6-enzo-design-prisms-projects.vercel.app

## Highlights

- Search Amadeus flight offers filtered to the internal pole-approved airline list.
- Passenger counts for adults, children, and infants with validation.
- Mock results when Amadeus credentials are missing so the UI still works.
- `/airlines` page that surfaces the current approved carrier list.
- Airport combobox seeded with major IATA airports.

## Local development

1. Install dependencies

```bash
npm install
```

2. Configure environment variables (optional for live Amadeus data)

```bash
cp .env.local.example .env.local
```

3. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

If the Amadeus credentials are missing, the app returns mock data labeled
"Mock data (missing API keys)" so the UI still works.

## Environment variables

Set these in `.env.local` (local) or in Vercel Project Settings > Environment Variables:

- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`
- `AMADEUS_HOST` (optional, defaults to `https://test.api.amadeus.com`)

## API route

`GET /api/flights?origin=SFO&destination=MNL&departDate=2026-02-10&returnDate=2026-02-18&adults=1&children=0&infants=0`

Returns a normalized list of recommended, pole-approved flights.

Optional query params:

- `returnDate` (YYYY-MM-DD)
- `adults` (integer, defaults to 1)
- `children` (integer, defaults to 0)
- `infants` (integer, defaults to 0)

## Updating data

- Approved airline list lives in `src/lib/poleAirlines.ts`.
- Airport combobox options live in `src/lib/airports.ts`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add the environment variables above in Vercel.
4. Deploy. No code changes required.

To update the production deployment, push to the `main` branch.
