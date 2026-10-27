/* NFC tag set-up sheet (tags.html): every demo link with placement, copy button and QR code. */
(function () {
  const { esc, icon } = HG;
  const $ = s => document.querySelector(s);
  const KEY = 'hg-base-url';

  HG.mountHeader({ context: 'NFC tag set-up' });
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon[el.dataset.icon] || ''; });

  // ---------- Site address ----------
  // Default: this page's folder, e.g. https://name.github.io/hydroguard-demo/
  const pageBase = () => new URL('.', location.href).href;
  function normalise(raw) {
    let v = String(raw || '').trim();
    if (!v) return '';
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = 'https://' + v;
    try {
      const u = new URL(v);
      if (!/^(https?|file):$/.test(u.protocol)) return '';
      u.search = ''; u.hash = '';
      if (/\.[a-z0-9]+$/i.test(u.pathname)) u.pathname = u.pathname.replace(/[^/]*$/, ''); // drop a filename like tags.html
      if (!u.pathname.endsWith('/')) u.pathname += '/';
      return u.href;
    } catch (e) { return ''; }
  }
  function load() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }

  let base = normalise(load()) || pageBase();
  const input = $('#base-url');
  input.value = base;

  function hint() {
    const h = $('#base-hint');
    if (/^file:/i.test(base)) {
      h.innerHTML = '<strong>This is a file on your computer.</strong> Phones can’t open it. Publish to GitHub Pages (see README.md), then use the live address.';
    } else if (/^https?:\/\/(localhost|127\.|192\.168\.|10\.)/i.test(base)) {
      h.innerHTML = '<strong>This is a local test address.</strong> Only devices on this network can open it. Use your live GitHub Pages address for real tags.';
    } else {
      h.textContent = 'All links start with this address. If the site moves, change it and rewrite the tags.';
    }
  }

  $('#base-form').addEventListener('submit', e => {
    e.preventDefault();
    const v = normalise(input.value);
    if (!v) { input.setCustomValidity('Enter a web address, such as https://yourname.github.io/hydroguard-demo/'); input.reportValidity(); return; }
    input.setCustomValidity('');
    base = v; input.value = v; save(v);
    render(); hint();
    HG.toast('Address saved');
  });
  input.addEventListener('input', () => input.setCustomValidity(''));
  $('#base-reset').addEventListener('click', () => {
    base = pageBase(); input.value = base; save('');
    render(); hint();
    HG.toast('Address reset');
  });

  // ---------- Tag list ----------
  const R = HG.RESIDENTS;
  const S = HG.STAFF;
  const pos = n => `${n}’s`;
  const GROUPS = [
    {
      id: 'wrist', label: 'Wristbands', title: 'Resident wristbands', icon: 'people',
      note: 'Opens the resident’s profile: readings, contacts, Not for CPR or For CPR, and their room key.',
      items: R.map(r => ({ label: `${r.preferred} ${r.name.split(' ').slice(1).join(' ')}`, place: `Sticker on ${pos(r.preferred)} wristband`, path: `resident.html?id=${r.id}` })),
    },
    {
      id: 'door', label: 'Doors', title: 'Door readers', icon: 'key',
      note: 'Opens the door screen, as if the resident tapped their band to unlock it.',
      items: R.slice().sort((a, b) => a.wing.localeCompare(b.wing) || a.room - b.room).map(r => ({ label: `${HG.where(r)} door`, place: `Door reader (${pos(r.preferred)} room)`, path: `door.html?room=${encodeURIComponent(r.room)}` })),
    },
    {
      id: 'staff', label: 'Staff', title: 'Staff screens', icon: 'chart',
      note: 'For the nurses’ station and the nurse manager’s office.',
      items: [
        { label: 'Ward dashboard', place: `Nurses’ station, or the back of ${pos(S.priya.name.split(' ')[0])} ID badge`, path: 'nurse.html' },
        { label: 'Facility dashboard', place: `Nurse manager’s office door (${S.leanne.name})`, path: 'manager.html' },
        { label: 'Where everyone is', place: 'Floor plan on the wall at reception', path: 'manager.html#map' },
        { label: 'Demo home', place: 'Card on the demo table', path: 'index.html' },
      ],
    },
    {
      id: 'report', label: 'Reports', title: 'Health reports', icon: 'doc',
      note: 'Opens a printable health report to share with the GP or family.',
      items: R.map(r => ({ label: `${pos(r.preferred)} report`, place: `Inside ${pos(r.preferred)} care plan folder`, path: `report.html?id=${r.id}` })),
    },
    {
      id: 'extra', label: 'Extras', title: 'Extra links', icon: 'pin',
      note: 'Optional. Open a staff screen with one resident already picked.',
      items: R.flatMap(r => [
        { label: `${r.preferred} on the ward`, place: `Bedside chart, ${HG.where(r)}`, path: `nurse.html?id=${r.id}` },
        { label: `${r.preferred} on the floor plan`, place: `Staff room board, ${r.wing} wing`, path: `manager.html?id=${r.id}#map` },
      ]),
    },
  ];

  let filter = 'all';
  const seg = $('#tag-filter');
  seg.innerHTML = [{ id: 'all', label: 'All' }, ...GROUPS].map(g =>
    `<button type="button" data-f="${g.id}" aria-pressed="${g.id === filter}">${esc(g.label)}</button>`).join('');
  seg.addEventListener('click', e => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    filter = b.dataset.f;
    seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });

  const hasQR = typeof window.qrcode === 'function';
  function qrSvg(url) {
    if (!hasQR) return '<span class="qr-missing small">QR code unavailable offline</span>';
    try {
      const q = window.qrcode(0, 'M');
      q.addData(url);
      q.make();
      return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) { return '<span class="qr-missing small">Link too long for a QR code</span>'; }
  }

  // Big QR in a pop-up (the list shows a small one; the printed sheet shows full-size codes)
  const qrPop = HG.popup({ title: 'QR code', body: '' });
  let shownItems = [];

  function render() {
    const shown = GROUPS.filter(g => filter === 'all' || g.id === filter);
    shownItems = [];
    $('#tag-groups').innerHTML = shown.map(g => `
      <section class="section tag-group" aria-labelledby="g-${g.id}">
        <div class="section-head">
          <h2 id="g-${g.id}">${esc(g.title)}</h2>
          <span class="small muted">${g.items.length} tags</span>
        </div>
        <p class="small muted group-note">${esc(g.note)}</p>
        <ul class="tag-list">
          ${g.items.map(it => {
            const url = base + it.path;
            const i = shownItems.push({ ...it, url }) - 1;
            return `
            <li class="tag">
              <button class="tag-qr" type="button" data-qr="${i}" aria-label="Show QR code for ${esc(it.label)}">${qrSvg(url)}</button>
              <div class="tag-body">
                <h3 class="tag-label"><a href="${esc(url)}">${esc(it.label)}</a></h3>
                <p class="tag-place">${icon.pin}<span>${esc(it.place)}</span></p>
                <p class="tag-url"><a href="${esc(url)}">${esc(url)}</a></p>
              </div>
              <div class="tag-actions no-print">
                <button class="btn secondary" type="button" data-copy="${esc(url)}">Copy link</button>
              </div>
            </li>`;
          }).join('')}
        </ul>
      </section>`).join('');
  }

  // ---------- Copy ----------
  async function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return ok;
  }
  async function onTagClick(e) {
    const q = e.target.closest('[data-qr]');
    if (q) {
      const it = shownItems[Number(q.dataset.qr)];
      qrPop.setBody(`<div class="qr-big">${qrSvg(it.url)}</div>
        <p class="tag-place">${icon.pin}<span>${esc(it.place)}</span></p>
        <p class="tag-url"><a href="${esc(it.url)}">${esc(it.url)}</a></p>
        <button class="btn secondary" type="button" data-copy="${esc(it.url)}">Copy link</button>`);
      qrPop.el.querySelector('.popup-head h2').textContent = it.label;
      qrPop.el.setAttribute('aria-label', `QR code for ${it.label}`);
      qrPop.open();
      return;
    }
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    HG.toast(await copy(b.dataset.copy) ? 'Link copied' : 'Couldn’t copy. Press and hold the link to copy it.');
  }
  $('#tag-groups').addEventListener('click', onTagClick);
  qrPop.body.addEventListener('click', onTagClick);

  // ---------- Print ----------
  $('#print-btn').addEventListener('click', () => window.print());

  if (!hasQR) $('#qr-note').hidden = false;
  hint();
  render();
  HG.demoNote();
})();
