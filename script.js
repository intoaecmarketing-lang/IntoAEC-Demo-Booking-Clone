(function () {
  const $ = (s) => document.querySelector(s);

  // GTM dataLayer events (use as Custom Event triggers in GTM)
  window.dataLayer = window.dataLayer || [];
  const pushEvent = (event, data) => window.dataLayer.push(Object.assign({ event }, data));

  // Announcement bar
  $('#announceClose').addEventListener('click', () => $('#announce').classList.add('hide'));

  // Mobile nav
  const burger = $('.burger');
  burger.addEventListener('click', () => {
    const open = $('#nav').classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  // Mobile nav dropdowns: first tap expands, second tap follows the link
  document.querySelectorAll('.dd > a').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (window.innerWidth > 900) return;
      const dd = a.parentElement;
      if (!dd.classList.contains('open')) {
        e.preventDefault();
        dd.classList.add('open');
      }
    })
  );

  // TidyCal: load the embed only when the visitor asks for it (keeps PageSpeed clean)
  const TIDYCAL_JS = 'https://asset-tidycal.b-cdn.net/js/embed.js';
  let warmed = false;
  let loaded = false;

  const warmUp = () => {
    if (warmed) return;
    warmed = true;
    ['https://asset-tidycal.b-cdn.net', 'https://tidycal.com'].forEach((href) => {
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = href;
      l.crossOrigin = '';
      document.head.appendChild(l);
    });
  };

  const loadBooking = () => {
    if (loaded) return;
    loaded = true;
    pushEvent('book_demo_open');
    const box = $('#booking');
    box.classList.add('loaded');
    box.innerHTML =
      '<div class="tidycal-embed" data-path="book-a-demo/discovery-call"></div>' +
      '<p class="book-loading" id="bookLoading">Loading calendar…</p>';
    const s = document.createElement('script');
    s.src = TIDYCAL_JS;
    s.async = true;
    s.onload = () => { const l = $('#bookLoading'); if (l) l.remove(); };
    s.onerror = () => { window.location.href = 'https://tidycal.com/book-a-demo/discovery-call'; };
    document.body.appendChild(s);
  };

  const cta = $('#loadBooking');
  ['pointerenter', 'focus', 'touchstart'].forEach((ev) => cta.addEventListener(ev, warmUp, { passive: true }));
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    loadBooking();
  });

  // Any "Book A Demo" link pointing at the booking box also opens the calendar
  document.querySelectorAll('a[href="#booking"]').forEach((a) => {
    a.addEventListener('pointerenter', warmUp, { passive: true });
    a.addEventListener('click', loadBooking);
  });

  // Footer accordions
  document.querySelectorAll('.acc button').forEach((b) =>
    b.addEventListener('click', () => b.classList.toggle('open'))
  );

  // Marquee: duplicate logos for seamless loop
  const track = $('.track');
  track.innerHTML += track.innerHTML;

  // Newsletter
  $('#nlForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#nlEmail').value.trim();
    const msg = $('#nlMsg');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    msg.className = 'nl-msg' + (ok ? '' : ' bad');
    msg.textContent = ok ? 'Thanks for subscribing!' : 'Please enter a valid email address.';
    if (ok) {
      $('#nlEmail').value = '';
      pushEvent('newsletter_signup');
    }
  });

})();
