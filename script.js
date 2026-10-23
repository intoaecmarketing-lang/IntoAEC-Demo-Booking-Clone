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

  // TidyCal: the calendar box is already in the HTML (no CTA step). TidyCal's embed.js pulls in a heavy
  // iframe (GTM, GA, Meta pixel, Clarity, Stripe...) that would block the main thread during page load,
  // so it is injected on the visitor's first interaction, or IDLE_MS after the page has loaded.
  // Until the iframe itself has loaded, a status message shows; after SLOW_MS it offers a direct link.
  const TIDYCAL_JS = 'https://asset-tidycal.b-cdn.net/js/embed.js';
  const BOOK_URL = 'https://tidycal.com/book-a-demo/discovery-call';
  const SLOW_MS = 8000;
  const IDLE_MS = 6000;
  const box = $('#booking');
  const fallbackLink = '<a href="' + BOOK_URL + '" target="_blank" rel="noopener">Open the booking page in a new tab</a>';
  const wrap = box.querySelector('.book-embed');
  let started = false;
  let startedAt = 0;
  let iframeLoaded = false;
  let slowTimer = 0;

  const markSlow = () => {
    const st = $('#bookLoading');
    if (!st || iframeLoaded) return;
    st.innerHTML = '<span>Taking longer than usual.<br>' + fallbackLink + '</span>';
    pushEvent('book_demo_slow');
  };

  const showError = () => {
    clearTimeout(slowTimer);
    wrap.remove();
    box.classList.remove('loaded');
    if (!$('#bookError')) {
      const err = document.createElement('p');
      err.id = 'bookError';
      err.className = 'book-error';
      err.innerHTML = "The calendar couldn't load. Please check your connection or disable any ad blocker, then try again.<br>" + fallbackLink;
      box.appendChild(err);
    }
  };

  const startLoad = () => {
    if (started) return;
    started = true;
    INTERACTION.forEach((ev) => window.removeEventListener(ev, startLoad));
    startedAt = Date.now();
    const s = document.createElement('script');
    s.src = TIDYCAL_JS;
    s.async = true;
    // "Ready" = the iframe finished loading OR TidyCal's page has started talking to us
    // (its resize messages can arrive well before the iframe's load event)
    const markLoaded = () => {
      if (iframeLoaded) return;
      iframeLoaded = true;
      clearTimeout(slowTimer);
      const st = $('#bookLoading');
      if (st) st.remove();
      pushEvent('book_demo_loaded', { load_ms: Date.now() - startedAt });
    };
    window.addEventListener('message', (e) => { if (e.origin === 'https://tidycal.com') markLoaded(); });
    s.onload = () => {
      const frame = wrap.querySelector('iframe');
      if (frame) frame.addEventListener('load', markLoaded);
    };
    s.onerror = () => { s.remove(); showError(); };
    document.body.appendChild(s);
    slowTimer = setTimeout(markSlow, SLOW_MS);
  };

  // Load on the first real interaction, or IDLE_MS after the page has loaded for visitors who don't touch anything
  const INTERACTION = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'touchstart'];
  INTERACTION.forEach((ev) => window.addEventListener(ev, startLoad, { passive: true }));
  const startWhenIdle = () => setTimeout(startLoad, IDLE_MS);
  if (document.readyState === 'complete') startWhenIdle();
  else window.addEventListener('load', startWhenIdle);

  // Copyright year follows the visitor's clock (static HTML keeps a no-JS fallback)
  $('#year').textContent = new Date().getFullYear();

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
      say('Almost there, Check your inbox to confirm');
      pushEvent('newsletter_signup');
    } catch (err) {
      say('Something went wrong. Please try again.', true);
    } finally {
      btn.disabled = false;
    }
  });

})();
