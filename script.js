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

  // TidyCal: the embed is preloaded in the background once the page has finished loading,
  // so it is usually ready by the time the visitor clicks. Clicking only reveals it.
  // Until the iframe itself has loaded, a status message shows; after SLOW_MS it offers a direct link.
  const TIDYCAL_JS = 'https://asset-tidycal.b-cdn.net/js/embed.js';
  const BOOK_URL = 'https://tidycal.com/book-a-demo/discovery-call';
  const SLOW_MS = 8000;
  const box = $('#booking');
  const bookCta = $('#bookCta');
  const cta = $('#loadBooking');
  const fallbackLink = '<a href="' + BOOK_URL + '" target="_blank" rel="noopener">Open the booking page in a new tab</a>';
  let wrap = null;
  let startedAt = 0;
  let iframeLoaded = false;
  let revealed = false;
  let slowTimer = 0;

  const markSlow = () => {
    const st = $('#bookLoading');
    if (!st || iframeLoaded) return;
    st.innerHTML = '<span>Taking longer than usual.<br>' + fallbackLink + '</span>';
    pushEvent('book_demo_slow');
  };

  const showError = () => {
    clearTimeout(slowTimer);
    if (wrap) wrap.remove();
    wrap = null;
    box.classList.remove('loaded');
    bookCta.hidden = false;
    if (revealed && !$('#bookError')) {
      const err = document.createElement('p');
      err.id = 'bookError';
      err.className = 'book-error';
      err.innerHTML = "The calendar couldn't load. Please check your connection or disable any ad blocker, then try again.<br>" + fallbackLink;
      cta.parentNode.insertBefore(err, cta);
      cta.textContent = 'Try Again';
    }
    revealed = false;
  };

  const startLoad = () => {
    if (wrap) return;
    startedAt = Date.now();
    iframeLoaded = false;
    wrap = document.createElement('div');
    wrap.className = 'book-embed';
    wrap.innerHTML =
      '<div class="book-loading" id="bookLoading" role="status">Loading calendar…</div>' +
      '<div class="tidycal-embed" data-path="book-a-demo/discovery-call"></div>' +
      '<p class="book-note">Trouble loading? ' + fallbackLink + '</p>';
    box.appendChild(wrap);
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
      const frame = wrap && wrap.querySelector('iframe');
      if (frame) frame.addEventListener('load', markLoaded);
    };
    s.onerror = () => { s.remove(); showError(); };
    document.body.appendChild(s);
  };

  const reveal = () => {
    startLoad();
    if (revealed) return;
    revealed = true;
    pushEvent('book_demo_open');
    const err = $('#bookError');
    if (err) err.remove();
    box.classList.add('loaded');
    bookCta.hidden = true;
    wrap.classList.add('show');
    if (!iframeLoaded) slowTimer = setTimeout(markSlow, SLOW_MS);
  };

  // Preload once the page is idle; hover/focus/touch on the button starts it sooner
  const preload = () => (window.requestIdleCallback ? requestIdleCallback(startLoad, { timeout: 3000 }) : setTimeout(startLoad, 1500));
  if (document.readyState === 'complete') preload();
  else window.addEventListener('load', preload);
  ['pointerenter', 'focus', 'touchstart'].forEach((ev) => cta.addEventListener(ev, startLoad, { passive: true }));
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    reveal();
  });

  // Any "Book A Demo" link pointing at the booking box also opens the calendar
  document.querySelectorAll('a[href="#booking"]').forEach((a) => {
    a.addEventListener('pointerenter', startLoad, { passive: true });
    a.addEventListener('click', reveal);
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
