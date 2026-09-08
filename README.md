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

Hostinger / live MySQL environment variables:

```
MYSQL_HOST=your-hostinger-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=your-mysql-database
AUTH_SECRET=a-long-random-secret
ADMIN_EMAIL=amit.owninfotech@gmail.com
ADMIN_PASSWORD=Staff@123
TESTER_EMAIL=tester.owninfotech@gmail.com
TESTER_PASSWORD=Staff@123
FIXER_EMAIL=fixer.owninfotech@gmail.com
FIXER_PASSWORD=Staff@123
```

Default logins come from `.env`. Admin can also add more people from Team, each with their own password.

| Role | Email | Password |
|---|---|---|
| Admin | amit.owninfotech@gmail.com | Staff@123 |
| Tester | tester.owninfotech@gmail.com | Staff@123 |
| Fixer | fixer.owninfotech@gmail.com | Staff@123 |

