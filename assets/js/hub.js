/* Demo hub (index.html): what HydroGuard is, plus a link to every view, grouped by who uses it. */
(function () {
  const { esc, icon } = HG;
  const $ = s => document.querySelector(s);

  HG.mountHeader({ context: `${HG.FACILITY.name} demo`, wordmark: true });

  // On wide screens there is room beside the live reading, so show "What it does" open
  if (matchMedia('(min-width: 900px)').matches) $('.hub-more').open = true;

  // Fill decorative icons
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon[el.dataset.icon] || ''; });

  const residents = HG.RESIDENTS.slice().sort((a, b) =>
    HG.LEVELS[a.risk.level].rank - HG.LEVELS[b.risk.level].rank || b.risk.total - a.risk.total);
  const lastName = r => r.name.split(' ').slice(1).join(' ');
  const shortName = r => `${r.preferred} ${lastName(r)}`;
  const possessive = n => `${n}’s`;
  const tone = s => (s >= 2 ? 'high' : s === 1 ? 'watch' : 'low');

  // ---------- Live wristband reading for the highest-risk resident ----------
  const top = residents[0];
  const latest = top.readings[top.readings.length - 1];
  const rows = [
    { key: 'temp', icon: 'thermo' },
    { key: 'hr', icon: 'heart' },
    { key: 'hyd', icon: 'drop' },
  ].map(({ key, icon: ic }) => {
    const rule = HG.RULES[key];
    const sc = top.risk.parts[key];
    return `
      <div class="callout live-row">
        <span class="label">${icon[ic]}${rule.label}</span>
        <span class="line ${tone(sc)}" aria-hidden="true"></span>
        <span class="reading">${HG.fmtValue(key, latest[key])}<span class="unit">${rule.unit}</span></span>
      </div>`;
  }).join('');

  $('#live').innerHTML = `
    <article class="block live" aria-label="Latest wristband reading for ${esc(shortName(top))}">
      <div class="live-band">
        <span class="live-id">${icon.nfc}<span>Band ${esc(top.band)}</span></span>
        <span class="live-time">Read at ${HG.fmtTime(latest.time)}</span>
      </div>
      <div class="live-who">
        ${HG.avatar(top, 'lg')}
        <div>
          <h2 class="live-name">${esc(shortName(top))}</h2>
          <p class="live-meta">Room ${esc(top.room)}, ${esc(top.wing)} wing. Now in the ${esc(HG.ZONES[top.location].label.toLowerCase())}.</p>
          <span class="chip ${top.risk.level}">${HG.LEVELS[top.risk.level].label}, score ${top.risk.total} of 9</span>
        </div>
      </div>
      <div class="live-rows">${rows}</div>
      <p class="live-advice">${esc(HG.LEVELS[top.risk.level].advice)}</p>
      <div class="live-actions">
        <a class="btn" href="resident.html?id=${top.id}">Open ${esc(possessive(top.preferred))} profile</a>
        <a class="btn secondary" href="nurse.html?id=${top.id}">See it on the ward</a>
      </div>
    </article>`;

  // ---------- Residents ----------
  $('#res-grid').innerHTML = residents.map(r => `
    <li>
      <a class="res-link" href="resident.html?id=${r.id}">
        ${HG.avatar(r)}
        <span class="res-text">
          <span class="res-name">${esc(r.preferred)}</span>
          <span class="res-sub">${esc(r.name)}, room ${esc(r.room)}</span>
          ${HG.riskChip(r.risk.level)}
        </span>
      </a>
    </li>`).join('');

  // ---------- Other views: one compact row of links per group ----------
  const pill = (href, ic, label, cls = '', aria = '') =>
    `<a class="more-btn ${cls}" href="${href}"${aria ? ` aria-label="${esc(aria)}"` : ''}>${ic ? icon[ic] : ''}<span>${esc(label)}</span></a>`;
  const doorPeople = ['margaret', 'ravi', 'bill', 'kev'].map(HG.resident).filter(Boolean);
  const groups = [
    { label: 'Staff', links: [
      pill('nurse.html', 'people', 'Ward', '', 'Ward dashboard'),
      pill('manager.html', 'chart', 'Manager', '', 'Manager dashboard'),
      pill('manager.html#map', 'map', 'Floor plan'),
    ] },
    { label: 'Doors', links: doorPeople.map(r => pill(`door.html?room=${encodeURIComponent(r.room)}`, '', `Room ${r.room}`, 'me', `Room ${r.room} door`)) },
    { label: 'Reports', links: residents.slice(0, 3).map(r => pill(`report.html?id=${r.id}`, 'doc', r.preferred, '', `${possessive(r.preferred)} health report`)) },
  ];
  $('#other-list').innerHTML = groups.map(g => `
    <li><span class="other-label small muted">${esc(g.label)}</span><span class="more-row">${g.links.join('')}</span></li>`).join('');

  HG.demoNote();
})();
