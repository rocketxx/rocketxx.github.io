(() => {
  const header = document.querySelector('.site-header');
  const list = document.getElementById('nav-list');

  /* Bordo della barra di navigazione dopo lo scroll */
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Sezione attiva nel menu (solo nella home, dove i link sono ancore) */
  if (list) {
    const links = new Map([...list.querySelectorAll('a[href^="#"]')].map(a => [a.hash.slice(1), a]));
    if (links.size) {
      const setCurrent = id => {
        links.forEach(a => a.removeAttribute('aria-current'));
        links.get(id)?.setAttribute('aria-current', 'true');
      };
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) setCurrent(entry.target.id); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      document.querySelectorAll('main section[id]').forEach(s => observer.observe(s));
    }
  }

  /* Menu mobile */
  const toggle = document.querySelector('.menu-toggle');
  if (toggle && list) {
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setMenu = open => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Chiudi' : 'Menu';
      list.classList.toggle('is-open', open);
      header.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setMenu(!isOpen()));
    list.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', e => { if (isOpen() && !e.target.closest('.nav')) setMenu(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 48em)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  /* Tema chiaro/scuro: segue il sistema finché non lo si sceglie a mano */
  const themeButton = document.querySelector('.theme-toggle');
  if (themeButton) {
    const root = document.documentElement;
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)');
    const current = () => root.dataset.theme || (prefersLight.matches ? 'light' : 'dark');
    const label = () => {
      const next = current() === 'dark' ? 'chiaro' : 'scuro';
      themeButton.setAttribute('aria-label', `Passa al tema ${next}`);
      themeButton.title = `Tema ${next}`;
    };
    themeButton.hidden = false;
    label();
    themeButton.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch { /* storage non disponibile */ }
      label();
    });
    prefersLight.addEventListener('change', label);
  }

  /* Filtri della galleria */
  const filters = document.querySelector('.filters');
  const cards = [...document.querySelectorAll('.gallery .card')];
  if (filters && cards.length) {
    const chips = [...filters.querySelectorAll('.chip')];
    chips.forEach(chip => {
      const key = chip.dataset.filter;
      const n = key === 'all' ? cards.length : cards.filter(c => c.dataset.tags.split(' ').includes(key)).length;
      const count = document.createElement('span');
      count.className = 'count';
      count.textContent = n;
      chip.append(count);
    });
    const status = document.getElementById('gallery-status');
    filters.hidden = false;
    filters.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const key = chip.dataset.filter;
      chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      let shown = 0;
      cards.forEach(card => {
        const match = key === 'all' || card.dataset.tags.split(' ').includes(key);
        card.hidden = !match;
        if (match) shown++;
      });
      if (status) status.textContent = `${shown} progetti mostrati`;
    });
  }

  /* Embed caricati solo al clic (niente cookie di terze parti prima) */
  document.querySelectorAll('[data-embed]').forEach(box => {
    const load = box.querySelector('.embed-load');
    load?.addEventListener('click', e => {
      e.preventDefault();
      const frame = document.createElement('iframe');
      frame.src = box.dataset.embed;
      frame.title = box.dataset.title || '';
      frame.allowFullscreen = true;
      box.style.background = '#fff';
      box.replaceChildren(frame);
      frame.focus();
    });
  });

  /* Lightbox per gli screenshot */
  const shots = document.querySelectorAll('a.shot');
  if (shots.length && 'HTMLDialogElement' in window) {
    const dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    const img = document.createElement('img');
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Chiudi';
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.append(img, close);
    document.body.append(dialog);
    shots.forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      img.src = a.href;
      img.alt = a.querySelector('img')?.alt || '';
      dialog.showModal();
    }));
  }

  /* Copia indirizzo email, con ripiego per i browser interni delle app come LinkedIn */
  const copy = document.querySelector('.copy');
  if (copy) {
    const status = document.getElementById('copy-status');
    const legacyCopy = text => {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.append(field);
      field.select();
      field.setSelectionRange(0, text.length);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      field.remove();
      return ok;
    };
    const copyText = async text => {
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); return true; } catch { /* prova il ripiego */ }
      }
      return legacyCopy(text);
    };
    copy.hidden = false;
    const label = copy.textContent;
    let timer;
    copy.addEventListener('click', async () => {
      const ok = await copyText(copy.dataset.copy);
      copy.textContent = ok ? 'Copiato' : 'Tieni premuto sull’indirizzo per copiarlo';
      if (status) status.textContent = ok ? 'Indirizzo email copiato' : '';
      clearTimeout(timer);
      timer = setTimeout(() => { copy.textContent = label; if (status) status.textContent = ''; }, ok ? 2000 : 4000);
    });
  }
})();
