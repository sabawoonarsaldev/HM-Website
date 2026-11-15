/* ===== Theme ===== */
(function () {
  const saved = localStorage.getItem('hm_theme');
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved || (dark ? 'dark' : 'light');
})();

/* ===== Auth (فقط برای ادمین) ===== */
const Auth = {
  token: () => localStorage.getItem('hm_token'),
  user: () => JSON.parse(localStorage.getItem('hm_user') || 'null'),
  isAdmin() { const u = this.user(); return !!(this.token() && u && u.role === 'admin'); },
  save(token, user) {
    localStorage.setItem('hm_token', token);
    localStorage.setItem('hm_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('hm_token');
    localStorage.removeItem('hm_user');
  },
  logout() { this.clear(); location.href = '/index.html'; }
};

const IS_LOGIN = location.pathname.endsWith('login.html');

/* ===== API helper ===== */
async function api(url, opts = {}) {
  opts.headers = { ...(opts.headers || {}) };
  if (Auth.token()) opts.headers.Authorization = 'Bearer ' + Auth.token();
  const res = await fetch(url, opts);
  if (res.status === 401) {
    Auth.clear();
    if (location.pathname.endsWith('admin.html')) location.href = '/login.html';
    throw new Error('Session expired. Please login again.');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

/* ===== معلومات شرکت از دیتابیس (روی COMPANY می‌نشیند) ===== */
const siteReady = (async () => {
  if (typeof COMPANY === 'undefined') return;
  try {
    const d = await (await fetch('/api/site')).json();
    const s = d.settings || {};
    if (s.email) COMPANY.email = s.email;
    if (s.address) COMPANY.address = s.address;
    if (s.hours) COMPANY.hours = s.hours;
    if (s.owner_name) COMPANY.owner = s.owner_name;
    if (s.owner_title) COMPANY.ownerTitle = s.owner_title;
    COMPANY.phones = (d.phones || []).map(p => ({ label: p.label, display: p.number, wa: p.wa }));
    COMPANY.branches = (d.branches || []).map(b => ({ city: b.name, address: b.address, phone: b.phone, manager: b.manager }));
    COMPANY.brands = (d.brands || []).map(b => b.name);
  } catch (e) { /* اگر سرور جواب نداد، معلومات config.js می‌ماند */ }
})();

/* ===== Helpers ===== */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#dcfce7"/><text x="50%" y="52%" font-size="60" text-anchor="middle" fill="#22c55e" font-family="Arial" font-weight="bold">HM</text></svg>');
const imgUrl = f => !f ? PLACEHOLDER
  : /^https:\/\/res\.cloudinary\.com\//.test(f) ? f
  : '/uploads/' + encodeURIComponent(f);
  
const card = (p, i = 0) => `
  <a class="card" href="/product.html?id=${p.id}" style="animation-delay:${i * 0.05}s">
    <div class="card-img">
      <img loading="lazy" src="${imgUrl(p.image)}" alt="${esc(p.name)}">
      ${p.category_name ? `<span class="badge">${esc(p.category_name)}</span>` : ''}
    </div>
    <div class="card-body">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.short_desc || '')}</p>
      <div class="card-foot"><strong>${money(p.price)}</strong><span class="btn-sm">Details</span></div>
    </div>
  </a>`;



const emptyBox = t => `<div class="empty">${t}</div>`;

/* ===== Icons ===== */
const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.19a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
};
const icon = n => `<svg class="i" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const logoHtml = () => (typeof COMPANY !== 'undefined' && COMPANY.logo)
  ? `<div class="logo"><img src="${COMPANY.logo}" alt="logo"></div>` : '<div class="logo">HM</div>';

/* ===== Theme toggle ===== */
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('hm_theme', next);
  const b = document.getElementById('themeBtn');
  if (b) b.innerHTML = icon(next === 'dark' ? 'sun' : 'moon');
}

/* ===== Navbar ===== */
function buildNavbar() {
  const nav = document.getElementById('navbar');
  const u = Auth.user() || {};
  const admin = Auth.isAdmin();
  const path = location.pathname === '/' ? '/index.html' : location.pathname;
  const links = [
    ['/index.html', 'Home'], ['/products.html', 'Products'],
    ['/about.html', 'About Us'], ['/contact.html', 'Contact Us']
  ];
  const q = new URLSearchParams(location.search).get('search') || '';
  const searchForm = cls => `
    <form class="search search-form ${cls}">
      ${icon('search')}<input type="search" placeholder="Search products..." value="${esc(q)}">
    </form>`;
  const adminLink = admin
    ? `<a href="/admin.html" class="${path === '/admin.html' ? 'active' : ''}">Admin Panel</a>`
    : `<a href="/login.html" class="admin-link">${icon('shield')} Login to Admin</a>`;
  const dark = document.documentElement.dataset.theme === 'dark';



  nav.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="/index.html">
        ${logoHtml()}
        <div class="brand-t"><b>${esc(COMPANY.name)}</b><small>${esc(COMPANY.tagline)}</small></div>
      </a>
      <nav class="menu" id="menu">
        ${searchForm('mobile-only')}
        ${links.map(([h, l]) => `<a href="${h}" class="${path === h ? 'active' : ''}">${l}</a>`).join('')}
        ${adminLink}
      </nav>
      <div class="nav-actions">
        ${searchForm('desktop-only')}
                <div class="lang" id="lang">
          <button class="icon-btn lang-btn" id="langBtn" title="Language" aria-label="Language">${icon('globe')}</button>
          <div class="lang-menu" id="langMenu">
            <button class="${LANG === 'en' ? 'on' : ''}" onclick="setLang('en')">English</button>
            <button class="${LANG === 'ps' ? 'on' : ''}" onclick="setLang('ps')">پښتو</button>
          </div>
        </div>
        <button class="icon-btn" id="themeBtn" title="Dark / Light" onclick="toggleTheme()">${icon(dark ? 'sun' : 'moon')}</button>
        ${admin ? `
          <div class="user-chip" title="${esc(u.email || '')}">
            <div class="avatar">${esc((u.name || 'A')[0].toUpperCase())}</div><span>${esc((u.name || '').split(' ')[0])}</span>
          </div>
          <button class="icon-btn" title="Logout" onclick="Auth.logout()">${icon('logout')}</button>` : ''}
        <button class="icon-btn menu-btn" id="menuBtn">${icon('menu')}</button>
      </div>
    </div>`;

  document.querySelectorAll('.search-form').forEach(f => f.onsubmit = e => {
    e.preventDefault();
    const v = f.querySelector('input').value.trim();
    location.href = '/products.html' + (v ? '?search=' + encodeURIComponent(v) : '');
  });
  const menu = document.getElementById('menu'), mb = document.getElementById('menuBtn');
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  mb.onclick = () => {
        const open = menu.classList.toggle('open');
    mb.innerHTML = icon(open ? 'close' : 'menu');
  };
    const langBox = document.getElementById('lang');
  document.getElementById('langBtn').onclick = e => { e.stopPropagation(); langBox.classList.toggle('open'); };
  document.addEventListener('click', () => langBox.classList.remove('open'));

}

let _latest;
const getLatest = () => (_latest ||= api('/api/products?limit=12'));

/* ===== Slider (همه صفحه‌ها) ===== */
async function mountSlider() {
  const mount = document.getElementById('sliderMount');
  if (!mount || document.body.hasAttribute('data-noslider')) return;
  let items = [];
  try { items = (await getLatest()).products.slice(0, 5); } catch (e) { return; }
    if (!items.length) return;

  const compact = false;
  mount.className = 'slider-wrap';
  mount.innerHTML = `
    <section class="slider ${compact ? 'compact' : ''}" id="slider">
      <div class="slides" id="slides">
        ${items.map(p => `
          <a class="slide" href="/product.html?id=${p.id}">                      <div>
              <span class="badge">★ ${esc(p.category_name || 'New Arrival')}</span>              <h1>${esc(p.name)}</h1>
              <p>${esc(p.short_desc || '')}</p>
              <div class="slide-price">${money(p.price)}</div>
              <span class="btn">View Details</span>
            </div>
            <div class="slide-img"><img src="${imgUrl(p.image)}" alt="${esc(p.name)}" onload="this.classList.toggle('framed', !/\\.png$|\\.webp$/i.test(this.src))"></div>
                      </a>`).join('')}
      </div>
      <button class="arrow prev">‹</button><button class="arrow next">›</button>
      <div class="dots" id="dots">${items.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div>
    </section>`;

  const box = document.getElementById('slider'), slides = document.getElementById('slides'), dots = document.getElementById('dots');
  let i = 0, timer;
  const go = n => {
    i = (n + items.length) % items.length;
    const sign = document.documentElement.dir === 'rtl' ? 1 : -1;
    slides.style.transform = `translateX(${sign * i * 100}%)`;
    dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === i));
  };  const start = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 3000); };
  dots.onclick = e => { if (e.target.dataset.k) { go(+e.target.dataset.k); start(); } };
  box.querySelector('.prev').onclick = () => { go(i - 1); start(); };
  box.querySelector('.next').onclick = () => { go(i + 1); start(); };
  box.onmouseenter = () => clearInterval(timer);
  box.onmouseleave = start;
  go(0); start();
}

/* ===== Footer ===== */
function buildFooter() {
  const f = document.getElementById('footer');
  if (!f) return;
  f.className = 'footer';
  f.innerHTML = `
    <div class="footer-grid">
      <div>
        <div class="brand">${logoHtml()}<div class="brand-t"><b>${esc(COMPANY.name)}</b><small>${esc(COMPANY.tagline)}</small></div></div>
        <p>${esc(COMPANY.about).slice(0, 150)}...</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <a href="/index.html">Home</a><a href="/products.html">Products</a>
        <a href="/about.html">About Us</a><a href="/contact.html">Contact Us</a>
      </div>
      <div>
        <h4>Contact</h4>
                ${COMPANY.phones.map(p => `<span>${icon('phone')} ${esc(p.display)}</span>`).join('')}
        <span>${icon('mail')} ${esc(COMPANY.email)}</span>
        <span>${icon('pin')} ${esc(COMPANY.address)}</span>
      </div>
    </div>
    <div class="copy">© ${new Date().getFullYear()} ${esc(COMPANY.name)}. All rights reserved.</div>`;
}

/* ===== Product Modal (جزئیات + کامنت) ===== */
function specsTable(text) {
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  const rows = lines.map(l => {
    const i = l.indexOf(':');
    return i > 0
      ? `<tr><td>${esc(l.slice(0, i))}</td><td>${esc(l.slice(i + 1).trim())}</td></tr>`
      : `<tr><td colspan="2">${esc(l)}</td></tr>`;
  }).join('');
  return `<div class="block"><h3>Specifications</h3><table class="specs">${rows}</table></div>`;
}

function closeProduct() {
  const m = document.getElementById('pmodal');
  if (!m) return;
  m.classList.remove('show');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
    setTimeout(() => m.remove(), 250);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProduct(); });

async function openProduct(id, ev) {
  // اجازه بده Ctrl+Click در تب جدید باز شود
  if (ev && (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button === 1)) return true;
  if (ev) ev.preventDefault();

  closeProduct();
  const bg = document.createElement('div');
  bg.className = 'pmodal'; bg.id = 'pmodal';
  bg.innerHTML = `<div class="pmodal-box"><button class="pm-close" onclick="closeProduct()" aria-label="Close">${icon('close')}</button>
    <div class="pm-body"><div class="empty">Loading...</div></div></div>`;
  bg.addEventListener('mousedown', e => { if (e.target === bg) closeProduct(); });
  document.body.appendChild(bg);
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => bg.classList.add('show'));

  const body = bg.querySelector('.pm-body');
  try {
    const p = await api('/api/products/' + id);
    const pics = [p.image, ...p.images.map(x => x.image)].filter(Boolean);
    body.innerHTML = `
      <div class="detail" style="box-shadow:none;border:0;padding:0">
        <div>
          <div class="gallery-main"><img id="pmMain" src="${imgUrl(pics[0])}" alt="${esc(p.name)}"></div>
          ${pics.length > 1 ? `<div class="thumbs" id="pmThumbs">${pics.map((f, k) =>
            `<img src="${imgUrl(f)}" class="${k === 0 ? 'on' : ''}" alt="">`).join('')}</div>` : ''}
        </div>
        <div class="info">
          ${p.category_name ? `<span class="badge">${esc(p.category_name)}</span>` : ''}
          <h1>${esc(p.name)}</h1>
          <div class="price">${money(p.price)}</div>
          <p class="short">${esc(p.short_desc || '')}</p>
          <a class="btn" href="/contact.html?product=${encodeURIComponent(p.name)}">Contact us about this product</a>
          ${p.description ? `<div class="block"><h3>Description</h3><p>${esc(p.description)}</p></div>` : ''}
          ${specsTable(p.specs)}
        </div>
      </div>
      <div class="comments" id="comments"></div>`;

    const th = document.getElementById('pmThumbs');
    if (th) th.onclick = e => {
      if (e.target.tagName !== 'IMG') return;
      document.getElementById('pmMain').src = e.target.src;
      th.querySelectorAll('img').forEach(i => i.classList.toggle('on', i === e.target));
    };
    loadComments(id);
  } catch (e) {
    body.innerHTML = emptyBox(esc(e.message));
  }
  return false;
}

/* ===== Comments ===== */
async function loadComments(pid) {
  const box = document.getElementById('comments');
  if (!box) return;
  let list = [];
  try { list = await api('/api/comments/' + pid); } catch (e) {}
  const admin = Auth.isAdmin();
  box.innerHTML = `
    <h3>Comments (${list.length})</h3>
    <div class="c-form">
      <div class="msg" id="cMsg"></div>
      <div class="row2">
        <div class="field"><label>Your name</label><input id="cName" maxlength="80" placeholder="Your name"></div>
      </div>
      <div class="field"><label>Your comment</label><textarea id="cText" rows="3" maxlength="1000" placeholder="Write your comment..."></textarea></div>
      <button class="btn" id="cSend">Post Comment</button>
    </div>
    <div class="c-list">
      ${list.length ? list.map(c => `
        <div class="c-item">
          <div class="avatar">${esc(c.name[0].toUpperCase())}</div>
          <div class="c-main">
            <div class="c-head"><b>${esc(c.name)}</b><small>${new Date(c.created_at).toLocaleString()}</small></div>
            <p>${esc(c.comment)}</p>
          </div>
          ${admin ? `<button class="btn-sm danger" onclick="delComment(${c.id},${pid})">Delete</button>` : ''}
        </div>`).join('') : '<p class="c-empty">No comments yet. Be the first to comment!</p>'}
    </div>`;

  const saved = localStorage.getItem('hm_cname');
  if (saved) document.getElementById('cName').value = saved;

  document.getElementById('cSend').onclick = async () => {
    const name = document.getElementById('cName').value.trim();
    const comment = document.getElementById('cText').value.trim();
    const msg = document.getElementById('cMsg');
    if (!name || !comment) { msg.textContent = 'Please enter your name and comment.'; msg.className = 'msg err'; return; }
    const btn = document.getElementById('cSend'); btn.disabled = true;
    try {
      await api('/api/comments/' + pid, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, comment })
      });
      localStorage.setItem('hm_cname', name);
      loadComments(pid);
    } catch (e) { msg.textContent = e.message; msg.className = 'msg err'; btn.disabled = false; }
  };
}

async function delComment(id, pid) {
  if (!confirm('Delete this comment?')) return;
  try { await api('/api/comments/' + id, { method: 'DELETE' }); loadComments(pid); }
  catch (e) { alert(e.message); }
}

/* ===== انتقال نرم بین صفحه‌ها ===== */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || a.target === '_blank') return;
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname === location.pathname && url.search === location.search) return;
  if (url.hash && url.pathname === location.pathname) return;
  e.preventDefault();
  document.body.classList.add('leaving');
  setTimeout(() => { location.href = url.href; }, 180);
});
window.addEventListener('pageshow', () => document.body.classList.remove('leaving'));

document.addEventListener('DOMContentLoaded', async () => {
  if (IS_LOGIN) return;
  try { await siteReady; } catch (e) { console.error('siteReady:', e); }
  for (const fn of [buildNavbar, buildFooter, mountSlider]) {
    try { await fn(); } catch (e) { console.error(fn.name + ' failed:', e); }
  }
});
