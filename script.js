(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Horário real da casa, sempre calculado no fuso de São Paulo
  // (0 = domingo). Seg a qua até 22h, qui a dom até 23h.
  const HOURS = { 0: [6, 23], 1: [6, 22], 2: [6, 22], 3: [6, 22], 4: [6, 23], 5: [6, 23], 6: [6, 23] };
  const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function nowInSaoPaulo() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = type => parts.find(p => p.type === type).value;
    return { day: WEEKDAYS[get('weekday')], minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function updateStatus() {
    const { day, minutes } = nowInSaoPaulo();
    const [open, close] = HOURS[day];
    const isOpen = minutes >= open * 60 && minutes < close * 60;
    const hour = minutes / 60;

    let text;
    let short;
    if (isOpen) {
      text = `Aberta agora · fecha às ${close}h`;
      short = 'Aberta agora';
    } else if (minutes < open * 60) {
      text = `Fechada · abre às ${open}h`;
      short = `Abre às ${open}h`;
    } else {
      text = `Fechada · abre amanhã às ${HOURS[(day + 1) % 7][0]}h`;
      short = 'Abre amanhã às 6h';
    }

    document.querySelectorAll('[data-status]').forEach(el => {
      el.classList.toggle('is-open', isOpen);
      el.classList.toggle('is-closed', !isOpen);
    });
    document.querySelectorAll('.hero-card-status').forEach(el => {
      el.classList.toggle('is-open', isOpen);
      el.classList.toggle('is-closed', !isOpen);
    });
    document.querySelectorAll('[data-status-text]').forEach(el => { el.textContent = text; });
    document.querySelectorAll('[data-status-short]').forEach(el => { el.textContent = short; });
    document.querySelectorAll('[data-today-hours]').forEach(el => { el.textContent = `${open}h às ${close}h`; });

    document.querySelectorAll('.hours-table tr[data-day]').forEach(row => {
      row.classList.toggle('is-today', Number(row.dataset.day) === day);
    });

    document.querySelectorAll('.moment[data-from]').forEach(moment => {
      const from = Number(moment.dataset.from);
      const to = Math.min(Number(moment.dataset.to), close);
      moment.classList.toggle('is-now', isOpen && hour >= from && hour < to);
    });
  }

  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  // Menu
  const header = document.getElementById('site-header');
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      navToggle.focus();
    }
  });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
  });

  // Header e botão de topo
  const toTop = document.getElementById('to-top');
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 12);
    toTop.classList.toggle('is-visible', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    document.querySelector('.brand').focus({ preventScroll: true });
  });

  // Link ativo no menu
  const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  // O topo não tem link no menu: ao voltar para ele, nenhum item fica ativo.
  sections.push(document.getElementById('inicio'));
  if ('IntersectionObserver' in window) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => {
          const active = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => activeObserver.observe(s));
  }

  // Números animados
  const formatter = decimals => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  function countUp(el) {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const fmt = formatter(decimals);
    if (reducedMotion) {
      el.textContent = fmt.format(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt.format(target * eased);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = fmt.format(target);
    }
    requestAnimationFrame(frame);
  }

  // Revelação ao rolar
  const revealEls = document.querySelectorAll('.reveal, .reveal-img');
  const counters = document.querySelectorAll('[data-count]');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
    counters.forEach(el => { el.textContent = formatter(Number(el.dataset.decimals || 0)).format(Number(el.dataset.count)); });
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // Entrada do topo quando a página termina de carregar
  function markReady() { requestAnimationFrame(() => document.body.classList.add('is-ready')); }
  if (document.readyState === 'complete') markReady();
  else window.addEventListener('load', markReady);
  setTimeout(markReady, 1500);

  // Faixa animada com pausa
  const ticker = document.querySelector('.ticker');
  const tickerToggle = document.querySelector('.ticker-toggle');
  function setTickerPaused(paused) {
    ticker.classList.toggle('is-paused', paused);
    tickerToggle.setAttribute('aria-pressed', String(paused));
    tickerToggle.setAttribute('aria-label', paused ? 'Retomar faixa animada' : 'Pausar faixa animada');
  }
  if (reducedMotion) setTickerPaused(true);
  tickerToggle.addEventListener('click', () => setTickerPaused(!ticker.classList.contains('is-paused')));
})();
