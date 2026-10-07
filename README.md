# Bar Locator
Live Link: https://bar-locator-puce.vercel.app/

A map of bars in Redlands, CA. Click a bar and it shows everywhere you could drive from there in 10 minutes. I built it to learn the ArcGIS tools.

## Why I built it

- I wanted to play around with ArcGIS and see what interesting things could be done with it.

## What it does

- Shows 15 real Redlands bars on an ArcGIS map
- Lets you search for an address
- Click a bar to see its 10-minute drive-time area, which follows real roads instead of a circle

## What I used

- Next.js and React
- ArcGIS Maps SDK for JavaScript (map, search, and the service area tool)
- PostgreSQL with PostGIS
- Prisma 7

## Running it locally

1. Clone the repo and run `npm install`
2. Make a Postgres database called `bar_locator_dev` and turn on PostGIS
3. Add a `.env` file with `DATABASE_URL` and `ARCGIS_API_KEY`, and a `.env.local` file with `NEXT_PUBLIC_ARCGIS_API_KEY`
4. Run `npx prisma migrate dev`, `npx prisma generate`, and `npx tsx prisma/seed.mjs`
5. Run `npm run dev` and open http://localhost:3000

## Things that tripped me up

- Prisma 7 changed a lot from current tutorials.
- ArcGIS API key stopped working when I changed its referrer settings.

By David Tran · [GitHub](https://github.com/Moocifur) · [Portfolio](https://davidtran.netlify.app)