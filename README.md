# Quizora

Quizora is an AI-powered quiz and assessment platform built with Next.js, Prisma, and PostgreSQL.

## Development

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

## Database seed

Configure `DATABASE_URL` for a development database and set `SEED_PASSWORD` to a password of at least eight characters. The seed refuses to run when `NODE_ENV=production`.

Run the idempotent seed command with:

```bash
npx prisma db seed
```

It creates one teacher, three students, and a draft sample quiz with examples of all six question types. Seed users use `teacher.seed@quizora.local` and `student001.seed@quizora.local` through `student003.seed@quizora.local`; their password is the `SEED_PASSWORD` value. Existing seed users keep their current password when reseeding.

Do not point the seed command at production data.
