/* Pani home page: offer banner, live prices and areas, booking card, structured data for search */
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Light / dark theme. The head script already applied the saved choice or the device setting;
  // the button switches and remembers it. With no saved choice, follow the device as it changes.
  const root = document.documentElement, toggle = $('#theme-toggle');
  const setTheme = (t, save) => {
    root.dataset.theme = t;
    if (toggle) toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = t === 'dark' ? '#07131f' : '#0a2540';
    if (save) { try { localStorage.setItem('pani.theme', t); } catch (_) {} }
  };
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
  if (toggle) toggle.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => { let saved = null; try { saved = localStorage.getItem('pani.theme'); } catch (_) {} if (!saved) setTheme(e.matches ? 'dark' : 'light', false); });
  } catch (_) {}

  // "Book" buttons on the price cards: select that size in the booking card and scroll up to it
  document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    const r = document.querySelector(`#qform input[name=size][value="${b.dataset.pick}"]`);
    if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    document.getElementById('reserve').scrollIntoView({ behavior: 'smooth' });
  }));

  Pani.config().then(async (cfg) => {
    // Offer banner, set in Admin → Settings. Hidden when empty.
    const promo = cfg.promo || {};
    if (promo.text) {
      $('#promo-text').innerHTML = promo.link ? `<a href="${esc(promo.link)}">${esc(promo.text)}</a>` : esc(promo.text);
      $('#promo').hidden = false;
    }

    // Areas and facts from the live settings
    const list = $('#areas-list');
    list.innerHTML = cfg.phases.map((p) => `<span class="phase"><span data-icon="pin"></span>${esc(p)}</span>`).join('');
    Pani.paintStatic(list);
    $('#f-phases').textContent = cfg.phases.length;

    // Price per gallon on the price cards
    document.querySelectorAll('[data-pergal]').forEach((el) => {
      const g = +el.dataset.pergal, p = cfg.prices[g];
      if (p) el.textContent = 'Rs ' + (p / g).toFixed(2);
    });

    // Payment section
    if (cfg.bank.bankName) $('#pay-bank').textContent = cfg.bank.bankName + ' bank transfer';
    if (cfg.bank.extra) { $('#pay-extra').textContent = cfg.bank.extra; $('#pay-extra-row').hidden = false; }

    structuredData(cfg);
    quickForm(cfg);
    nextSlot(cfg);
  }).catch(() => {});

  // Search engines: business details and the FAQ, built from what is on the page so they never drift apart
  function structuredData(cfg) {
    const add = (obj) => { const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(obj); document.head.appendChild(s); };
    add({
      '@context': 'https://schema.org', '@type': 'LocalBusiness', name: cfg.business.name,
      description: 'Water tanker delivery in DHA Karachi. 3,000 and 6,000 gallon tankers, booked online.',
      telephone: cfg.business.phone, areaServed: cfg.phases.map((p) => p + ', Karachi'),
      address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressRegion: 'Sindh', addressCountry: 'PK' },
      makesOffer: Object.entries(cfg.prices).map(([g, p]) => ({ '@type': 'Offer', name: `${Number(g).toLocaleString('en')} gallon water tanker`, price: p, priceCurrency: 'PKR' })),
    });
    // Wait one tick so prices and other live values are already filled into the answers
    setTimeout(() => add({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: [...document.querySelectorAll('#faq-list details')].map((d) => ({
        '@type': 'Question', name: d.querySelector('summary').textContent.trim(),
        acceptedAnswer: { '@type': 'Answer', text: d.querySelector('.ans').textContent.trim() },
      })),
    }), 0);
  }

  async function nextSlot(cfg) {
    const el = $('#next-slot');
    for (let i = 0; i <= 7; i++) {
      const d = Pani.addDays(cfg.today, i);
      const r = await fetch('/api/availability?date=' + d).then((x) => x.json());
      const s = r.slots.find((x) => x.available);
      if (s) { el.textContent = (i === 0 ? 'today' : i === 1 ? 'tomorrow' : Pani.dateLabel(d, { weekday: 'short', day: 'numeric', month: 'short' })) + ', ' + Pani.slotLabel(s.slot); return; }
    }
    el.textContent = 'message us';
  }

  // Booking card: size, quantity, phase, date and slot, then on to /book with these filled in
  async function quickForm(cfg) {
    const form = $('#qform'), dateSel = $('#q-date'), slotSel = $('#q-slot');
    const cache = {};
    const day = async (d) => cache[d] || (cache[d] = (await fetch('/api/availability?date=' + d).then((x) => x.json())).slots);
    $('#q-phase').innerHTML = '<option value="">Select your phase</option>' + cfg.phases.map((p) => `<option>${esc(p)}</option>`).join('');

    // Address appears once a phase is chosen; returning customers get their saved phase and address back
    const addr = $('#q-addr');
    const showAddr = () => addr.classList.toggle('open', !!$('#q-phase').value);
    $('#q-phase').addEventListener('change', () => { showAddr(); if ($('#q-phase').value) setTimeout(() => $('#q-address').focus({ preventScroll: true }), 250); });
    try {
      const saved = JSON.parse(localStorage.getItem('pani.contact') || '{}');
      if (saved.phase && cfg.phases.includes(saved.phase)) $('#q-phase').value = saved.phase;
      if (saved.address) $('#q-address').value = saved.address;
    } catch (_) {}
    showAddr();

    // Quantity stepper, 1 to 5 tankers
    const qty = $('#q-qty'), out = $('#q-qty-out');
    const total = () => { const size = form.querySelector('input[name=size]:checked').value; $('#q-total').textContent = Pani.money(cfg.prices[size] * (+qty.value || 1)); };
    const setQty = (n) => { qty.value = Math.max(1, Math.min(5, n)); out.textContent = qty.value; $('#q-minus').disabled = qty.value <= 1; $('#q-plus').disabled = qty.value >= 5; total(); };
    $('#q-minus').onclick = () => setQty(+qty.value - 1);
    $('#q-plus').onclick = () => setQty(+qty.value + 1);
    form.addEventListener('change', total); setQty(1);

    const fillSlots = async (d) => {
      slotSel.disabled = true; slotSel.innerHTML = '<option value="">Loading…</option>';
      const slots = await day(d);
      slotSel.innerHTML = '<option value="">Select time</option>' + slots.map((s) => {
        const why = s.reason === 'full' ? ' (full)' : s.reason === 'cutoff' ? ' (closed)' : s.reason === 'too_far' ? ' (not open yet)' : '';
        return `<option value="${s.slot}" ${s.available ? '' : 'disabled'}>${Pani.slotLabel(s.slot)}${why}</option>`;
      }).join('');
      const first = slots.find((s) => s.available); if (first) slotSel.value = first.slot;
      slotSel.disabled = false;
    };

    const days = Math.min(cfg.maxDaysAhead, 14);
    const list = Array.from({ length: days + 1 }, (_, i) => Pani.addDays(cfg.today, i));
    await Promise.all(list.map(day));
    dateSel.innerHTML = '<option value="">Select date</option>' + list.map((d, i) => {
      const open = cache[d].some((s) => s.available);
      const name = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : Pani.dateLabel(d, { weekday: 'short', day: 'numeric', month: 'short' });
      return `<option value="${d}" ${open ? '' : 'disabled'}>${name}${open ? '' : ' (full)'}</option>`;
    }).join('');
    const firstOpen = list.find((d) => cache[d].some((s) => s.available));
    if (firstOpen) { dateSel.value = firstOpen; fillSlots(firstOpen); }
    dateSel.addEventListener('change', () => { if (dateSel.value) fillSlots(dateSel.value); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = new URLSearchParams();
      new FormData(form).forEach((v, k) => { if (v) p.set(k, v); });
      location.href = '/book?' + p.toString();
    });
  }
})();
