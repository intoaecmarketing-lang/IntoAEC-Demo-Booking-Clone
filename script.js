(function () {
  const $ = (s) => document.querySelector(s);

  // GTM dataLayer events (use as Custom Event triggers in GTM)
  window.dataLayer = window.dataLayer || [];
  const pushEvent = (event, data) => window.dataLayer.push(Object.assign({ event }, data));

  // Announcement bar
  const announceClose = $('#announceClose');
  if (announceClose) announceClose.addEventListener('click', () => $('#announce').classList.add('hide'));

  // Mobile nav
  const burger = $('.burger');
  burger.addEventListener('click', () => {
    const open = $('#nav').classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  // Navbar switches to the burger layout at 1100px (keep in sync with styles.css)
  const isMobileNav = () => window.innerWidth <= 1100;

  // Mobile nav dropdowns: first tap expands, second tap follows the link
  document.querySelectorAll('.dd > a').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (!isMobileNav()) return;
      const dd = a.parentElement;
      if (!dd.classList.contains('open')) {
        e.preventDefault();
        dd.classList.add('open');
      }
    })
  );

  // Products mega menu: hover/focus swaps the panel on desktop, tap toggles it on mobile
  const tabs = document.querySelectorAll('.mtab');
  const setTab = (tab, on) => {
    tab.classList.toggle('active', on);
    tab.setAttribute('aria-expanded', on);
    document.getElementById(tab.getAttribute('aria-controls')).classList.toggle('active', on);
  };
  const showTab = (tab) => tabs.forEach((t) => setTab(t, t === tab));
  const productsDd = document.querySelector('.mtab').closest('.dd');
  productsDd.addEventListener('mouseleave', () => { if (!isMobileNav()) showTab(tabs[0]); });
  tabs.forEach((tab) => {
    ['mouseenter', 'focus'].forEach((ev) =>
      tab.addEventListener(ev, () => { if (!isMobileNav()) showTab(tab); })
    );
    tab.addEventListener('click', () => {
      if (isMobileNav() && tab.classList.contains('active')) setTab(tab, false);
      else showTab(tab);
    });
  });

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
    s.onerror = () => {
      loaded = false;
      s.remove();
      box.classList.remove('loaded');
      box.innerHTML =
        '<div class="book-cta"><p>The calendar couldn\'t load. Please check your connection or disable any ad blocker, then try again.</p>' +
        '<a class="btn btn-primary btn-block" id="loadBooking" href="#booking">Try Again</a></div>';
      $('#loadBooking').addEventListener('click', (e) => { e.preventDefault(); loadBooking(); });
    };
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
  // Subscribers go to /api/subscribe (api/subscribe.js), which adds them to MailerLite server-side
  const nlForm = $('#nlForm');
  nlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = $('#nlEmail').value.trim();
    const msg = $('#nlMsg');
    const btn = nlForm.querySelector('button[type="submit"]');
    const say = (text, bad) => {
      msg.className = 'nl-msg' + (bad ? ' bad' : '');
      msg.textContent = text;
    };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return say('Please enter a valid email address.', true);

    btn.disabled = true;
    say('Subscribing…');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v }),
      });
      const data = await res.json();
      if (!data.success) return say(data.error || 'Something went wrong. Please try again.', true);
      $('#nlEmail').value = '';
      say('Thanks for subscribing!');
      pushEvent('newsletter_signup');
    } catch (err) {
      say('Something went wrong. Please try again.', true);
    } finally {
      btn.disabled = false;
    }
  });

})();
