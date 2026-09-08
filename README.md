# QA Tracker

Internal test + fix tracker for Own InfoTech staff. Data is stored **directly in local MySQL**.

Database: **`qa-trackerdb`** on `127.0.0.1:3306` (XAMPP / phpMyAdmin).

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3002](http://localhost:3002)

`npm run db:setup` starts MySQL if needed, creates `qa-trackerdb`, applies all tables, and upserts the login accounts. Existing projects and tasks are kept.

You can also import `scripts/qa-trackerdb.sql` in phpMyAdmin.

Default password: `Staff@123`

| Role | Email | Access |
|---|---|---|
| Admin | amit.owninfotech@gmail.com | Full control, including adding fixer / tester / admin accounts |
| Tester | tester.owninfotech@gmail.com | Comment, change status, view work items |
| Fixer | fixer.owninfotech@gmail.com | Rearrange, change status, comment on assigned work |

