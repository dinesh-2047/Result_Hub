# Campus Result Hub

Next.js JSX migration of the old static result website, prepared for Vercel deployment with MongoDB and serverless API routes.

## What this app includes

- Public homepage with navbar, hero, notice board, contact section, footer, sign-in, and theme toggle
- Public result search by roll number, course, semester, and optional exam year
- Wall of toppers page based on published results
- Admin dashboard for:
  - course creation
  - subject creation and subject-code mapping
  - single student creation
  - bulk student creation from roll numbers
  - manual result entry
  - spreadsheet result upload
  - private to public result publishing
  - notice publishing
- Student dashboard for profile updates, parent contact updates, password change, and semester-wise result history
- Legacy CSV preservation and bootstrap import from [assets/csvs](assets/csvs)

## Environment

Copy [.env.example](.env.example) to `.env.local` and set real values.

Required values:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Optional but recommended for email notifications:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm start
```

## Deployment notes

- Deploy on Vercel as a standard Next.js project
- Add the same environment variables in Vercel project settings
- MongoDB Atlas is the easiest hosted database option
- Existing CSV files remain in the repo and are imported by the bootstrap process
