// Phone reader for the weekly decks (read.html?week=06).
// 1. Fetch week-NN.html (cover slide, stylesheets) and the markdown it loads.
// 2. Render it once with reveal.js off screen, so markdown, KaTeX and the lecture frame match the deck exactly.
// 3. Move every slide (and sub-slide) into its own panel, scaled from 1280 × 720 to the phone's width,
//    with its speaker notes in a fold underneath. Tap a slide for a full-screen view.

const list = document.getElementById('list');
const statusLine = document.getElementById('status');
const params = new URLSearchParams(location.search);
const week = (params.get('week') || '').replace(/\D/g, '').padStart(2, '0');
const storeKey = `reader:week-${week}`;
const cards = [];   // { card, view, label } in reading order
let margin = 0;     // the deck's reveal margin, as a fraction of the slide

function store(get, value) {   // localStorage can be missing or throw (private mode); the reader works without it
  try { return get ? localStorage.getItem(storeKey) : localStorage.setItem(storeKey, value); } catch (e) { return null; }
}

async function fetchText(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
}

function addStylesheet(href) {   // resolves once the sheet has loaded, so reveal lays slides out with it
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href;
    link.onload = link.onerror = resolve;
    document.head.appendChild(link);
  });
}

async function renderDeck() {
  const page = `week-${week}.html`;
  const html = await fetchText(page);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  document.title = doc.title.replace('NETS-7976 · ', '');
  document.getElementById('title').textContent = document.title.split(' · ')[0];   // "Week 6"; the cover has the rest

  // the deck's own (local) stylesheets: style.css, plus lecture.css from Week 4 on
  const sheets = [...doc.querySelectorAll('link[rel=stylesheet]')].map(l => l.getAttribute('href'));
  await Promise.all(sheets.filter(href => !/^https?:/.test(href)).map(addStylesheet));
  await document.fonts.ready;
  const framed = /wrapFrames/.test(html);
  // reveal's margin (Weeks 2 and 3 use 0.08): the white border round the slide comes from it, not from the slide
  margin = Number((html.match(/Reveal\.initialize\(\{[\s\S]*?\bmargin:\s*([\d.]+)/) || [])[1] || 0);
  list.style.setProperty('--m', margin);

  // copy the deck's slides; inline the markdown so its images can be held back (data-src) until a panel scrolls near
  const target = document.querySelector('#source .slides');
  for (const node of doc.querySelector('.reveal .slides').children) {
    const section = document.importNode(node, true);
    if (section.hasAttribute('data-markdown')) {
      const md = await fetchText(section.getAttribute('data-markdown'));
      section.setAttribute('data-markdown', '');
      const template = document.createElement('textarea');
      template.setAttribute('data-template', '');
      template.textContent = md.replace(/<img\b([^>]*?)\ssrc=/g, '<img$1 data-src=');
      section.appendChild(template);
    }
    target.appendChild(section);
  }

  const deck = new Reveal(document.querySelector('#source .reveal'), {
    embedded: true, width: 1280, height: 720, center: false, margin: 0,
    hash: false, history: false, keyboard: false, touch: false, controls: false, progress: false,
    slideNumber: false, transition: 'none', viewDistance: 1, mobileViewDistance: 1,
    plugins: [RevealMarkdown, RevealHighlight, RevealMath.KaTeX],
  });
  await deck.initialize();
  // the KaTeX plugin loads its scripts and typesets after 'ready'; wait for it before moving the slides out
  if (/\$|\\\(|\\\[/.test(document.getElementById('source').textContent)) {
    for (let t = 0; t < 300 && typeof renderMathInElement !== 'function'; t++) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 50));
  }
  if (framed) wrapFrames(document.getElementById('source'));
  return deck;
}

function buildPanels(deck) {
  const tops = [...document.querySelectorAll('#source .reveal .slides > section')];
  const jump = document.getElementById('jump');
  list.innerHTML = '';
  tops.forEach((top, h) => {
    const stack = [...top.querySelectorAll(':scope > section')];
    (stack.length ? stack : [top]).forEach((slide, v) => {
      const label = v === 0 ? `${h + 1}` : `${h + 1}.${v}`;
      const notes = slide.querySelector(':scope > aside.notes');
      if (notes) notes.remove();

      // undo reveal's per-slide state so the slide shows as it does when it is the current one
      ['style', 'hidden', 'aria-hidden'].forEach(a => slide.removeAttribute(a));
      slide.classList.remove('past', 'future', 'stack');
      slide.classList.add('present');
      slide.querySelectorAll('img[data-src]').forEach(img => {
        img.loading = 'lazy';
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });

      const card = document.createElement('article');
      card.className = 'card' + (v > 0 ? ' sub' : '') + (slide.classList.contains('divider') ? ' divider-card' : '');
      card.id = `s${label}`;
      const view = document.createElement('div');
      view.className = 'view';
      const wrap = document.createElement('div');
      wrap.className = 'reveal';
      const slides = document.createElement('div');
      slides.className = 'slides';
      slides.appendChild(slide);
      wrap.appendChild(slides);
      view.appendChild(wrap);
      card.appendChild(view);

      if (notes && notes.textContent.trim()) {
        const details = document.createElement('details');
        details.className = 'notes';
        details.innerHTML = `<summary><span class="num">${label}</span><span class="lab">Notes</span></summary>`;
        const body = document.createElement('div');
        body.className = 'body';
        body.append(...notes.childNodes);
        details.appendChild(body);
        card.appendChild(details);
      } else {
        card.insertAdjacentHTML('beforeend', `<div class="meta"><span class="num">${label}</span></div>`);
      }
      list.appendChild(card);
      const index = cards.push({ card, view, label, h, v }) - 1;
      view.addEventListener('click', () => openZoom(index));

      // jump list: the week cover and each paper's divider slide
      if (slide.classList.contains('cover')) {
        const heading = slide.querySelector('h1');
        const text = heading ? heading.textContent.trim() : `Slide ${label}`;
        if (text && ![...jump.options].some(o => o.textContent.endsWith(text))) {
          jump.add(new Option(`${label} · ${text}`, card.id));
        }
      }
    });
  });
  deck.destroy();
  document.getElementById('source').remove();
}

// ---- scale every panel to its width -------------------------------------------------------------------------
const resizer = new ResizeObserver(entries => {
  for (const e of entries) e.target.style.setProperty('--s', e.contentRect.width * (1 - margin) / 1280);
});

// ---- remember where reading stopped ----------------------------------------------------------------------------
function trackPosition() {
  let current = null;
  const seen = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) current = e.target.id;
  }, { rootMargin: '-60px 0px -70% 0px' });
  cards.forEach(c => seen.observe(c.card));
  let timer = null;
  addEventListener('scroll', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!current) return;
      store(false, current);
      history.replaceState(null, '', `${location.pathname}${location.search}#${current}`);
    }, 300);
  }, { passive: true });
}

function goTo(id, smooth) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
}

// ---- full-screen view --------------------------------------------------------------------------------------------
const zoom = document.getElementById('zoom');
const zoomSlide = document.getElementById('zoom-slide');
let zoomIndex = -1;

function layoutZoom() {
  const W = innerWidth, H = innerHeight;
  const sideways = H > W;                     // upright phone: turn the slide so it fills the long side
  const s = (sideways ? Math.min(H / 1280, W / 720) : Math.min(W / 1280, H / 720)) * (1 - margin);
  zoom.classList.toggle('sideways', sideways);
  zoomSlide.style.transform = `translate(-50%, -50%) ${sideways ? 'rotate(90deg)' : ''} scale(${s})`;
}

function openZoom(index) {
  zoomIndex = Math.max(0, Math.min(cards.length - 1, index));
  const { view, label } = cards[zoomIndex];
  zoomSlide.replaceChildren(view.firstElementChild.cloneNode(true));
  zoomSlide.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
  document.getElementById('zoom-num').textContent = label;
  zoom.hidden = false;
  document.body.style.overflow = 'hidden';
  layoutZoom();
}

function closeZoom() {
  if (zoom.hidden) return;
  zoom.hidden = true;
  document.body.style.overflow = '';
  goTo(cards[zoomIndex].card.id, false);
}

document.getElementById('zoom-prev').addEventListener('click', e => { e.stopPropagation(); openZoom(zoomIndex - 1); });
document.getElementById('zoom-next').addEventListener('click', e => { e.stopPropagation(); openZoom(zoomIndex + 1); });
document.getElementById('zoom-close').addEventListener('click', e => { e.stopPropagation(); closeZoom(); });
zoomSlide.addEventListener('click', closeZoom);
addEventListener('resize', () => { if (!zoom.hidden) layoutZoom(); });
addEventListener('keydown', e => {
  if (zoom.hidden) return;
  if (e.key === 'Escape') closeZoom();
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); openZoom(zoomIndex + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); openZoom(zoomIndex - 1); }
});

// ---- top bar -------------------------------------------------------------------------------------------------
document.getElementById('jump').addEventListener('change', e => {
  if (e.target.value) goTo(e.target.value, false);
  e.target.selectedIndex = 0;
});
const notesAll = document.getElementById('notes-all');
notesAll.addEventListener('click', () => {
  const open = notesAll.getAttribute('aria-pressed') !== 'true';
  notesAll.setAttribute('aria-pressed', String(open));
  list.querySelectorAll('details.notes').forEach(d => { d.open = open; });
});

// ---- go -----------------------------------------------------------------------------------------------------------
(async () => {
  if (week === '00') { statusLine.textContent = 'No week given. Open this page from the list of weeks.'; return; }
  try {
    const deck = await renderDeck();
    buildPanels(deck);
  } catch (err) {
    statusLine.textContent = `Could not load week ${week} (${err.message}).`;
    console.error(err);
    return;
  }
  cards.forEach(c => resizer.observe(c.view));
  const fromLink = location.hash.slice(1);
  const saved = store(true);
  if (fromLink && document.getElementById(fromLink)) {
    requestAnimationFrame(() => goTo(fromLink, false));
  } else if (saved && saved !== cards[0].card.id && document.getElementById(saved)) {
    const resume = document.getElementById('resume');
    resume.textContent = `Continue at slide ${saved.slice(1)}`;
    resume.hidden = false;
    resume.addEventListener('click', () => { resume.hidden = true; goTo(saved, false); });
  }
  trackPosition();
})();
