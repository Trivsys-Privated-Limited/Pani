/* Shared helpers for Pani public pages */
(function () {
  const PX = (id, w = 1200) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
  // Photos from Pexels (free for commercial use, no attribution required)
  const IMG = {
    hero: PX(31737862, 2000),     // lit entrance of a modern residence at night
    water: PX(9155214, 1400),     // running water in a dim modern shower (household use)
    sea: PX(17268663, 2000),      // dark water surface
  };

  const ICON = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01Zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.01 4.54-3.68 8.23-8.22 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43s.17-.25.25-.41c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18s-.22-.16-.47-.28Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7s7 7.3 7 12.3a7 7 0 1 1-14 0c0-5 7-12.3 7-12.3Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    hose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20v-6a5 5 0 0 1 5-5h6M15 6v6l4-3z"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l4-4"/><path d="M3.3 17A10 10 0 1 1 20.7 17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
  };

  let _lg = 0;
  const LOGO_T = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2.5s10 10.4 10 17.5a10 10 0 1 1-20 0C6 12.9 16 2.5 16 2.5Z" fill="#163236"/><path d="M11 20.5c1.7-1.2 3.3-1.2 5 0s3.3 1.2 5 0" stroke="#4fb2d3" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const logoSvg = () => LOGO_T.replace(/__ID__/g, 'plg' + (++_lg));
  const LOGO = LOGO_T;

  const money = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
  const litres = (g) => Math.round(g * 3.785).toLocaleString('en-PK');

  function slotLabel(slot) {
    const f = (t) => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return m ? `${h}:${String(m).padStart(2, '0')} ${ap}` : `${h} ${ap}`; };
    const [a, b] = slot.split('-');
    const fa = f(a), fb = f(b);
    return fa.slice(-2) === fb.slice(-2) ? `${fa.slice(0, -3)} – ${fb}` : `${fa} – ${fb}`;
  }
  function dateLabel(d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
    const [y, m, dd] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, dd, 12)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
  }
  function addDays(d, n) { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); }

  let cfgPromise;
  function config() { return cfgPromise || (cfgPromise = fetch('/api/config').then((r) => r.json())); }

  function waLink(number, text) { return `https://wa.me/${String(number).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`; }
  function telLink(phone) { return 'tel:' + String(phone).replace(/[^\d+]/g, ''); }

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
  }

  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); } catch (_) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    if (btn) { const o = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('done'); setTimeout(() => { btn.textContent = o; btn.classList.remove('done'); }, 1600); }
    else toast('Copied');
  }

  // Fill common elements on every page
  function hydrate(cfg) {
    document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = logoSvg() + '<span>' + (cfg.business.name || 'Pani').toLowerCase() + '</span>'; });
    document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = ICON[el.dataset.icon] || ''; });
    document.querySelectorAll('[data-phone]').forEach((el) => { el.textContent = cfg.business.phone; });
    document.querySelectorAll('[data-tel]').forEach((el) => { el.href = telLink(cfg.business.phone); });
    document.querySelectorAll('[data-wa]').forEach((el) => {
      const msg = el.dataset.wa || `Hi ${cfg.business.name}, I'd like to book a water tanker in DHA.`;
      el.href = waLink(cfg.business.whatsapp, msg.replace('{size}', el.dataset.size || ''));
      el.target = '_blank'; el.rel = 'noopener';
    });
    document.querySelectorAll('[data-price]').forEach((el) => { el.textContent = money(cfg.prices[el.dataset.price]); });
    document.querySelectorAll('[data-name]').forEach((el) => { el.textContent = cfg.business.name; });
    document.querySelectorAll('[data-hours]').forEach((el) => { el.textContent = cfg.business.deliveryHours; });
    document.querySelectorAll('[data-advance]').forEach((el) => { el.textContent = cfg.minAdvanceHours; });
    document.querySelectorAll('[data-img]').forEach((el) => { el.src = IMG[el.dataset.img]; });
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function headerScroll() {
    const h = document.querySelector('.site-header'); if (!h) return;
    const on = () => h.classList.toggle('scrolled', window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
  }

  // Scroll reveals: .reveal (rise), .wipe (image unveils), .draw (lines). Siblings in a [data-stagger] group cascade.
  function reveal(root = document) {
    root.querySelectorAll('[data-stagger]').forEach((g) => {
      [...g.children].forEach((c, i) => c.style.setProperty('--d', (i * 0.09).toFixed(2) + 's'));
    });
    const els = [...root.querySelectorAll('.reveal:not(.in), .wipe:not(.in), .draw:not(.in)')];
    if (!('IntersectionObserver' in window) || reduced()) { els.forEach((e) => e.classList.add('in')); return; }
    // A wipe is clipped to nothing, so watch its parent box instead of the clipped element itself.
    const targets = new Map();
    els.forEach((e) => { const t = e.classList.contains('wipe') ? e.parentElement : e; (targets.get(t) || targets.set(t, []).get(t)).push(e); });
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { (targets.get(en.target) || []).forEach((e) => e.classList.add('in')); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((_, t) => io.observe(t));
  }

  // Light scroll motion: parallax on [data-parallax] photos, phone booking bar after the hero
  function motion() {
    const par = [...document.querySelectorAll('[data-parallax]')];
    const bar = document.querySelector('.mobile-bar');
    const hero = document.querySelector('.hero');
    const still = reduced();
    let ticking = false;
    function frame() {
      ticking = false;
      const vh = window.innerHeight;
      if (!still) par.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0, ${(p * (parseFloat(el.dataset.parallax) || 50)).toFixed(1)}px, 0)`;
      });
      if (bar) bar.classList.toggle('show', !hero || window.scrollY > hero.offsetHeight * 0.6);
    }
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    frame();
  }

  // FAQ: animate open and close instead of snapping
  function faqAnim() {
    if (reduced()) return;
    document.querySelectorAll('.faq details').forEach((d) => {
      const s = d.querySelector('summary'), body = d.querySelector('.ans');
      if (!s || !body) return;
      s.addEventListener('click', (e) => {
        e.preventDefault();
        if (d.open) {
          const a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' });
          a.onfinish = () => { d.open = false; };
        } else {
          d.open = true;
          body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
        }
      });
    });
  }

  window.Pani = { IMG, ICON, LOGO, money, litres, slotLabel, dateLabel, addDays, config, waLink, telLink, toast, copy, hydrate, reveal };

  function paintStatic(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = ICON[el.dataset.icon] || ''; });
    root.querySelectorAll('[data-img]').forEach((el) => { el.src = IMG[el.dataset.img]; });
    root.querySelectorAll('[data-logo]').forEach((el) => { if (!el.innerHTML.trim()) el.innerHTML = logoSvg() + '<span>pani</span>'; });
  }
  window.Pani.paintStatic = paintStatic;

  document.addEventListener('DOMContentLoaded', () => {
    paintStatic(); headerScroll(); reveal(); motion(); faqAnim();
    config().then(hydrate).catch(() => {});
  });
})();
