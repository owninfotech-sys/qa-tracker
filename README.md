# QA Tracker

Internal test + fix tracker for Own InfoTech staff.

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3002](http://localhost:3002)

Default password: `Staff@123`

MySQL database: `qatracker` (`mysql://root@127.0.0.1:3306/qatracker`).

If MySQL is stopped, run `npm run db:start` or start MariaDB from the XAMPP control panel.

| Role | Email | Access |
|---|---|---|
| Admin | amit.owninfotech@gmail.com | Full control, including adding fixer / tester / admin accounts |
| Tester | tester.owninfotech@gmail.com | Add testing points and execute assigned points |
| Fixer | Added by admin from Team | Update fix status and feedback. Cannot change the original testing point |
