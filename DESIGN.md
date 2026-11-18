# Pani design system

Layout (v15): a full home page for a professional local service. Offer banner (set in Admin →
Settings, hidden when empty), navy hero banner with the booking card, a facts strip, price cards,
a bulk/construction banner, four steps, six reasons, coverage, payment, FAQ, a call-to-action banner
and a full footer. Styles are scoped to `body.pro` at the end of `style.css`; the page script is
`public/assets/home.js`. Built from `index.html` directly (the tanker and skyline art are inline SVG).
Themes (v17): light and dark. A head script on the home, booking and tracking pages sets
`<html data-theme>` from the saved choice (`localStorage pani.theme`) or the device setting; the sun/moon
button in the home header switches it. Admin stays light. Section backgrounds: soft glows (prices, FAQ),
a dot grid (how it works), ripple contours (coverage), a navy glass band (payment), rings (CTA banner),
and a gradient footer with a پانی watermark.
Content rule: no invented reviews, customer counts or discounts. Offers come only from the Admin setting.

Direction (v13): **a signboard, not a template.** Pani should look like a real local water tanker
business: prices up front, phone and WhatsApp on every screen, plain direct copy. White ground,
tanker blue, and a truck-art yellow used for the rate strip and the shadow under the booking card.
No decorative labels, italic accent words, icon card grids or wavy dividers.

All tokens live in `:root` in `public/assets/style.css`; the v13 layer sits at the end of that
file. Token names (navy-*, gold-*) are kept so the booking pages and admin follow along.
The earlier navy-and-gold design is in `../public-backup-before-redesign`.

## Colour
| Token | Value | Role |
|---|---|---|
| `--bg` / `--bg-soft` | `#ffffff` / `#f4f5f2` | Page ground, alternate sections |
| `--ink` | `#111a1c` | Text, top bar, booking card header, "How it works" band, footer |
| `--tank` | `#0b5fa5` | Primary buttons, links, selected size, closing band |
| `--sun` | `#ffc629` | Rate strip, booking card shadow, phone booking button |

Green appears only for WhatsApp and availability.

## Type
- **Archivo** only. Headings at 78% width and weight 800, like painted sign lettering; body at normal width.
- **Noto Nastaliq Urdu** loaded only for the word پانی (logo and the tanker illustration).
- No tracked uppercase except the logo and the "BOOK A TANKER" card title.

## SEO
Target phrases: "water tanker", "water tanker in DHA". They appear in the title, meta description,
H1, section headings, FAQ questions and the footer line listing every phase. FAQPage structured data
is in the page head; LocalBusiness data is added from live settings by script.
The FAQ structured data is built from the FAQ on the page, so it always matches the live prices.
## Booking flow (built for conversions, phone first)
- The reservation form sits in the hero: size switch, date, time, DHA phase (the address
  field slides in once a phase is picked), tanker count, live total, one button.
- /book receives those choices and shows them as a short summary with "Change"; the customer
  only adds name, mobile and the payment screenshot. A sticky Confirm bar sits at the bottom on phones.
- Returning customers get their saved phase, address, name and mobile filled in.

## Shape
- 6px corners on inputs and buttons, 10px on the booking card. A solid 1.5px ink rule tops each list.

## Photography
Real photos on the home page (free licences, hotlinked from the Pexels and Unsplash CDNs):
- Hero: house gate with water tanks on stands (Unsplash, Divaris Shirichena)
- 3,000 gallon card: water tanks in a house courtyard (Unsplash, Divaris Shirichena)
- 6,000 gallon card: water tanker at a construction site (Pexels 17168925)
- Bulk banner: tanker spraying water on a site road (Unsplash, Evan Porter)
- Why Pani: rooftop water tank (Pexels 8556428)
Rejected: tankers with hazard placards (fuel), a tanker painted "água potável" (drinking water),
and trucks showing another company's name or a readable plate.
Replace these with photos of Pani's own tankers in DHA as soon as they exist: swap the image URLs in
`public/index.html` (search for "images."). Never show glasses or drinking.

## Motion
- Short fade-up on load and on scroll, nothing else. Respects `prefers-reduced-motion`.

## Cache busting
Static files are cached for 1 hour. After changing `style.css`, `app.js` or `admin.css`,
bump the `?v=` number on their links in every HTML page.
