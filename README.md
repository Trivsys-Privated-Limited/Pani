# Pani · Water tanker booking for DHA Karachi

Public website, booking form and admin panel in one small Node.js app.

- **Website** `/` : tanker sizes and prices, how it works, DHA phases, FAQ, WhatsApp and call buttons
- **Booking** `/book` : 4 steps (tanker, date and slot, address, bank transfer + screenshot upload). Only slots at least 24 hours away can be booked.
- **Tracking** `/track` : customers check status with booking number + mobile
- **Admin** `/admin` : dashboard, payment verification, orders, daily schedule, manual phone/WhatsApp orders, settings, CSV export

## Run locally

```bash
npm install
npm start          # http://localhost:3000
```

First run creates the admin login **admin / pani@1234**. Change it right away in Admin → Settings.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 3000 | Port to listen on |
| `DATA_DIR` | `./data` | SQLite database and receipt screenshots |
| `SESSION_SECRET` | random each start | Set this so admin logins survive restarts |
| `ADMIN_USER` / `ADMIN_PASS` | admin / pani@1234 | Only used to create the first admin |
| `COOKIE_SECURE` | off | Set to `1` once the site is on HTTPS |

## Deploy on a VPS (Ubuntu, nginx, pm2)

```bash
# Node 18+ required
cd /var/www && git clone <repo> pani && cd pani && npm install --omit=dev
SESSION_SECRET=$(openssl rand -hex 32) COOKIE_SECURE=1 PORT=3005 pm2 start server.js --name pani
pm2 save
```

nginx:

```nginx
server {
  server_name pani.pk www.pani.pk;
  client_max_body_size 10m;
  location / { proxy_pass http://127.0.0.1:3005; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; }
}
```

Then `certbot --nginx -d pani.pk -d www.pani.pk`.

**Back up `data/` regularly.** It holds every order and payment screenshot.

## Before going live (Admin → Settings)

1. Real WhatsApp number (format `923001234567`) and phone number
2. Real bank account title, number and IBAN
3. Check prices (defaults: 3,000 gal Rs 12,500 · 6,000 gal Rs 22,000)
4. Tankers per time slot (default 4) and time slots
5. Change admin password

## Photos

Tanker and water photos load from Pexels (free for commercial use). Swap them for photos of your own tankers in `public/assets/app.js` (the `IMG` object) when you have them.
