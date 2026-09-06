(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHATSAPP_NUMBER = '5511944815707';

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Cursor glow
  const cursorGlow = document.getElementById('cursor-glow');
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    });
  } else if (cursorGlow) {
    cursorGlow.style.display = 'none';
  }

  // Header scroll state + active link + back-to-top
  const header = document.getElementById('site-header');
  const backToTop = document.getElementById('back-to-top');
  const pageSections = document.querySelectorAll('main section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  function onScroll() {
    const scrollY = window.scrollY;
    header.classList.toggle('scrolled', scrollY > 20);
    backToTop.classList.toggle('show', scrollY > 600);

    let currentId = '';
    pageSections.forEach(section => {
      const top = section.offsetTop - 160;
      if (scrollY >= top) currentId = section.id;
    });
    navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${currentId}`));
  }

  let scrollScheduled = false;
  window.addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    setTimeout(() => { onScroll(); scrollScheduled = false; }, 50);
  });
  onScroll();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  // Scroll-triggered reveal
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.getAttribute('data-delay') || 0;
          entry.target.style.transitionDelay = `${delay * 90}ms`;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // Animated stat counters
  const statEls = document.querySelectorAll('.stat-number');
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const noCommify = el.dataset.nocommify === '1';
    const duration = 1400;
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = target * eased;
      const formatted = decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value).toLocaleString(noCommify ? undefined : 'pt-BR');
      el.textContent = (noCommify ? Math.round(value) : formatted) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    if (prefersReducedMotion) {
      el.textContent = (decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('pt-BR')) + suffix;
    } else {
      requestAnimationFrame(frame);
    }
  }

  if ('IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statEls.forEach(el => statObserver.observe(el));
  } else {
    statEls.forEach(animateCount);
  }

  // Product builder
  const tabs = document.querySelectorAll('.builder-tab');
  const panels = document.querySelectorAll('.builder-panel');
  const builderList = document.getElementById('builder-list');
  const builderEmpty = document.getElementById('builder-empty');
  const builderSend = document.getElementById('builder-send');
  const selectedItems = new Set();

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.builder-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });

  function renderBuilderList() {
    builderList.querySelectorAll('li:not(#builder-empty)').forEach(li => li.remove());
    if (selectedItems.size === 0) {
      builderEmpty.style.display = 'block';
    } else {
      builderEmpty.style.display = 'none';
      selectedItems.forEach(item => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = item;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('aria-label', `Remover ${item}`);
        removeBtn.addEventListener('click', () => {
          selectedItems.delete(item);
          document.querySelectorAll(`.item-chip[data-item="${CSS.escape(item)}"]`).forEach(chip => chip.classList.remove('selected'));
          renderBuilderList();
        });
        li.appendChild(span);
        li.appendChild(removeBtn);
        builderList.appendChild(li);
      });
    }
    updateBuilderLink();
  }

  function updateBuilderLink() {
    if (selectedItems.size === 0) {
      builderSend.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vi o site da Saint Tropez Confeitaria e gostaria de mais informações.')}`;
      return;
    }
    const list = Array.from(selectedItems).map(item => `- ${item}`).join('\n');
    const message = `Olá! Vi o site da Saint Tropez Confeitaria e gostaria de saber mais sobre estes itens:\n${list}\n\nPoderiam me ajudar com disponibilidade e preços?`;
    builderSend.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  document.querySelectorAll('.item-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const item = chip.dataset.item;
      if (selectedItems.has(item)) {
        selectedItems.delete(item);
        chip.classList.remove('selected');
      } else {
        selectedItems.add(item);
        chip.classList.add('selected');
      }
      renderBuilderList();
    });
  });

  renderBuilderList();
})();
