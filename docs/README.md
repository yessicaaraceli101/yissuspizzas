# DineBook — Restaurant Booking Template

> Polished documentation generated from the uploaded project.

## Overview
Multi‑page restaurant site with booking/reservation forms, menu pages, and contact/location sections.

## Tech Stack
- HTML5, CSS3, JavaScript
- jQuery/Bootstrap/Datepicker/etc. if referenced below

## Structure
```
restaurant-booking/
├─ admin
│  ├─ dashboard.html
│  ├─ login.html
│  ├─ menu.html
│  ├─ orders.html
│  └─ settings.html
├─ assets
│  ├─ script.js
│  └─ style.css
├─ data
│  └─ restaurants.json
├─ 404.html
├─ about.html
├─ checkout.html
├─ confirm.html
├─ contact.html
├─ faq.html
├─ index.html
├─ privacy.html
├─ restaurant.html
└─ terms.html
```

## Pages & Assets
- `404.html` — **Not Found – TableTime**
  - CSS: `assets/style.css`
  - JS: `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation
  - Counts: tables=0, forms=0
- `about.html` — **About – TableTime**
  - CSS: `assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation, Menu/Cuisine strings detected
  - Counts: tables=0, forms=0
- `admin/dashboard.html` — **Admin Dashboard – TableTime**
  - CSS: `../assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `../assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation, Menu/Cuisine strings detected
  - Counts: tables=0, forms=0
- `admin/login.html` — **Admin Login – TableTime**
  - CSS: `../assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `../assets/script.js`
  - Features: Booking/Reservation strings detected, Form(s)
  - Counts: tables=0, forms=1
- `admin/menu.html` — **Admin Menu – TableTime**
  - CSS: `../assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `../assets/script.js`
  - Features: Booking/Reservation strings detected, Form(s), Navigation, Menu/Cuisine strings detected
  - Counts: tables=0, forms=1
- `admin/orders.html` — **Admin Orders – TableTime**
  - CSS: `../assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `../assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation, Menu/Cuisine strings detected
  - Counts: tables=0, forms=0
- `admin/settings.html` — **Admin Settings – TableTime**
  - CSS: `../assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `../assets/script.js`
  - Features: Booking/Reservation strings detected, Form(s), Navigation, Menu/Cuisine strings detected
  - Counts: tables=0, forms=1
- `checkout.html` — **Checkout – TableTime**
  - CSS: `assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `assets/script.js`
  - Features: Booking/Reservation strings detected, Form(s), Navigation
  - Counts: tables=0, forms=1
- `confirm.html` — **Order Confirmed – TableTime**
  - CSS: `assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation
  - Counts: tables=0, forms=0
- `contact.html` — **Contact – TableTime**
  - CSS: `assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation
  - Counts: tables=0, forms=0
- `faq.html` — **FAQ – TableTime**
  - CSS: `assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation
  - Counts: tables=0, forms=0
- `index.html` — **TableTime – Find & Book Restaurants** (H1: Book a table or order delivery)
  - CSS: `assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation
  - Counts: tables=0, forms=0
- `privacy.html` — **Privacy – TableTime**
  - CSS: `assets/style.css`
  - JS: `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation
  - Counts: tables=0, forms=0
- `restaurant.html` — **Restaurant – TableTime**
  - CSS: `assets/style.css`
  - JS: `https://code.jquery.com/jquery-3.7.1.min.js`, `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation
  - Counts: tables=0, forms=0
- `terms.html` — **Terms – TableTime**
  - CSS: `assets/style.css`
  - JS: `assets/script.js`
  - Features: Booking/Reservation strings detected, Navigation
  - Counts: tables=0, forms=0

## Local Development
1. Open `index.html` directly or serve locally for accurate relative paths:

   - Python: `python3 -m http.server 5173`

   - Node: `npx serve .`

2. Visit `http://localhost:5173/`

## Dependencies (from asset paths)
- **jQuery** — e.g., `https://code.jquery.com/jquery-3.7.1.min.js`


## Notes
- Optimize hero and menu images; prefer modern formats when possible.

- If using a datepicker or maps, pin CDN versions and add SRI attributes.

- Run Lighthouse on home, menu, and booking pages for performance and a11y.


See **DEPLOYMENT.md** for hosting instructions.
