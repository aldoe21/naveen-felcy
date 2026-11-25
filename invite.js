/* Naveen & Felcy: church wedding invitation engine (Round 3).
   All wedding details live in CONFIG below. Times are India Standard Time (+05:30).
   site.html sets window.THEME before loading this file. */

window.CONFIG = window.CONFIG || {
  groom: 'Naveen Gerald', groomShort: 'Naveen',
  groomFull: 'St. Hubert Naveen Gerald',      // used only in the invitation wording at the top
  bride: 'Felcy Agnes Mary', brideShort: 'Felcy',
  initials: ['N', 'F'],                       // left door, right door
  groomParents: 'Mr. St. Hubert Charles Saraphion & Mrs. Josephine',
  brideParents: 'Mr. Antony Kulandai Rajan & Mrs. Christine',
  groomSibling: 'St. Hubert Marie Nishanth', groomSiblingRole: 'Brother of',
  brideSibling: 'Francis Martin Aldoe', brideSiblingRole: 'Sister of',
  groomFamily: 'The House of Hubert Charles',
  brideFamily: 'The House of Antony Rajan',
  verse: { text: '“And the two shall become one.”', ref: 'Ephesians 5:31' },
  portraits: {
    groom: { src: 'photos/groom.jpg', alt: 'Naveen in a cream suit with a rose buttonhole' },
    bride: { src: 'photos/bride.jpg', alt: 'Felcy in a lace bridal gown and veil, holding white roses' }
  },

  /* time: null means "to be announced"; the calendar then saves an all-day entry */
  events: [
    { key: 'engagement', title: 'Engagement', kicker: 'Betrothal & ring ceremony',
      start: '2026-12-13T18:00:00+05:30', end: '2026-12-13T21:00:00+05:30', time: '6:00 – 9:00 PM',
      venue: 'Crystal Banquet Hall', place: 'Hotel Atithi, Puducherry',
      map: 'https://maps.app.goo.gl/bBqVibmzXv14oN6T7', ll: [11.9421441, 79.830922], icon: 'rings' },
    { key: 'wedding', title: 'Holy Matrimony', kicker: 'Nuptial Holy Mass',
      start: '2027-01-20T16:00:00+05:30', end: '2027-01-20T18:00:00+05:30', time: '4:00 – 6:00 PM', heroTime: '4:00 PM',
      venue: 'Je Suis L’Immaculée Conception Church', place: 'Nellithope, Puducherry',
      map: 'https://maps.app.goo.gl/LL6hFemdPkvHNiAm8', ll: [11.9302799, 79.8108388], icon: 'church' },
    { key: 'reception', title: 'Wedding Reception', kicker: 'Dinner & celebration',
      start: '2027-01-20T18:30:00+05:30', end: '2027-01-20T21:00:00+05:30', time: '6:30 – 9:00 PM',
      venue: 'Shubam Hall', place: 'The Sunway Manor, Puducherry',
      map: 'https://maps.app.goo.gl/Fmg9etebDLopjPgX7', ll: [11.9172533, 79.8098145], icon: 'toast' }
  ],
  countdownTo: 'wedding',

  rsvp: [
    { side: 'Bride’s family', name: 'Francis', phone: '916382078006', display: '+91 63820 78006' },
    { side: 'Groom’s family', name: 'Charles', phone: '919894646369', display: '+91 98946 46369' }
  ],
  rsvpBy: '2026-12-06',                       // one week before the engagement

  /* thumb: the 4:5 tile; src: what the photo viewer shows (defaults to thumb) */
  photos: [
    { thumb: 'photos/gallery-1.jpg', alt: 'Naveen and Felcy smiling together in a selfie' },
    { thumb: 'photos/gallery-2.jpg', alt: 'Felcy and Naveen in a green garden, his arm around her shoulder' },
    { thumb: 'photos/gallery-3.jpg', src: 'photos/gallery-3-full.jpg', alt: 'Naveen and Felcy, in a green silk saree, at a party with balloons' }
  ]
};

(() => {
  'use strict';
  const T = window.THEME;
  const C = window.CONFIG;
  const S = T.scene;
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Dates (all venues are in IST) ---------- */
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = iso => {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
    const y = +m[1], mo = +m[2], d = +m[3];
    return { y, mo, d, wd: new Date(Date.UTC(y, mo - 1, d)).getUTCDay(), timed: m[4] != null };
  };
  const longDate = iso => { const p = parts(iso); return `${DAYS[p.wd]}, ${p.d} ${MONTHS[p.mo - 1]} ${p.y}`; };
  const instant = iso => new Date(parts(iso).timed ? iso : iso + 'T00:00:00+05:30');
  const ymd = iso => iso.slice(0, 10).replace(/-/g, '');
  const nextDay = iso => { const p = parts(iso); const d = new Date(Date.UTC(p.y, p.mo - 1, p.d + 1)); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
  const utcStamp = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const evByKey = k => C.events.find(e => e.key === k);
  const wedding = evByKey('wedding') || C.events[0];

  /* ---------- World geometry (SVG units) ---------- */
  const DX = 450, DY = 840, DW = 100, DH = 160, GROUND = 1000;

  function archPath(x, y, w, h, type) {
    if (type === 'round') {
      const r = w / 2;
      return `M${x},${y + h} V${y + r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h} Z`;
    }
    const k = w * 0.75, r = w * 0.85;
    return `M${x},${y + h} V${y + k} A${r},${r} 0 0 1 ${x + w / 2},${y} A${r},${r} 0 0 1 ${x + w},${y + k} V${y + h} Z`;
  }

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const cross = (cx, top, h, fill, extra = '') => {
    const w = h * 0.16, bar = h * 0.62, by = top + h * 0.24;
    return `<path d="M${cx - w / 2},${top} h${w} v${by - top} h${(bar - w) / 2} v${w} h${-(bar - w) / 2} v${top + h - by - w} h${-w} v${-(top + h - by - w)} h${-(bar - w) / 2} v${-w} h${(bar - w) / 2} Z" fill="${fill}" ${extra}/>`;
  };

  const lancet = (x, y, w, h, opts = {}) => {
    const d = archPath(x, y, w, h, opts.type || 'pointed');
    return `<path d="${d}" fill="${opts.fill || 'url(#glass)'}" stroke="${opts.stroke || S.trim}" stroke-width="${opts.sw || 1.4}"/>` +
      `<path class="shine" d="${d}" fill="url(#winShine)"/>` +
      (opts.mullion === false ? '' : `<line x1="${x + w / 2}" y1="${y + w * 0.5}" x2="${x + w / 2}" y2="${y + h}" stroke="${opts.stroke || S.trim}" stroke-width="1"/>`);
  };

  const cypress = (x, base, h, fill) => {
    const w = h * 0.13;
    return `<path d="M${x},${base} C${x - w},${base - h * 0.3} ${x - w * 0.6},${base - h * 0.85} ${x},${base - h} C${x + w * 0.6},${base - h * 0.85} ${x + w},${base - h * 0.3} ${x},${base} Z" fill="${fill}"/>`;
  };

  /* Our Lady of the Immaculate Conception: white figure, blue sash, crown of twelve stars, crescent at her feet */
  const mary = (x, y, h) => {
    const k = h / 30;
    let stars = '';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      stars += `<circle cx="${(Math.cos(a) * 6.2).toFixed(2)}" cy="${(-25 + Math.sin(a) * 6.2).toFixed(2)}" r=".75" fill="${S.star}"/>`;
    }
    return `<g transform="translate(${x},${y}) scale(${k.toFixed(3)})">
      <ellipse cx="0" cy="-14" rx="11" ry="18" fill="url(#spillG)" opacity=".35"/>
      <path d="M-3.8,-25 C-5.5,-18 -6.2,-8 -6.6,0 L6.6,0 C6.2,-8 5.5,-18 3.8,-25 C3,-29.6 -3,-29.6 -3.8,-25 Z" fill="${S.statue}"/>
      <ellipse cx="0" cy="-24.4" rx="2.1" ry="2.5" fill="${S.face}"/>
      <path d="M-4.1,-14.4 Q0,-13.4 4.1,-14.4 M-.6,-14 Q-1.4,-9 -2.2,-4.5 M.6,-14 Q1.6,-9.5 2.4,-5.5" stroke="${S.sash}" stroke-width=".8" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="-18.4" rx="1.6" ry="2.2" fill="${S.statue}" stroke="${S.statueLine}" stroke-width=".3"/>
      <path d="M-7.5,.4 Q0,5.2 7.5,.4 Q0,3 -7.5,.4 Z" fill="${S.moon}"/>
      <g class="tw-slow">${stars}</g>
    </g>`;
  };

  /* ---------- Common scene layers ---------- */
  function defs() {
    const g = S.glass;
    return `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.sky1}"/><stop offset="1" stop-color="${S.sky2}"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset=".5" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></linearGradient>
      <radialGradient id="glassR"><stop offset="0" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[0]}"/></radialGradient>
      <radialGradient id="winShine"><stop offset="0" stop-color="${S.shine}" stop-opacity=".95"/><stop offset="1" stop-color="${S.shine}" stop-opacity="0"/></radialGradient>
      <radialGradient id="inside" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="${S.light1}"/><stop offset=".6" stop-color="${S.light2}"/><stop offset="1" stop-color="${S.light3}"/></radialGradient>
      <radialGradient id="spillG"><stop offset="0" stop-color="${S.light1}" stop-opacity=".95"/><stop offset="1" stop-color="${S.light1}" stop-opacity="0"/></radialGradient>
      <radialGradient id="lampG"><stop offset="0" stop-color="#FF5A4A" stop-opacity=".9"/><stop offset="1" stop-color="#FF5A4A" stop-opacity="0"/></radialGradient>
      <clipPath id="doorClip"><path d="${archPath(DX, DY, DW, DH, T.arch)}"/></clipPath>
      <filter id="glowF" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;
  }

  function backdrop() {
    return `<rect x="-4000" y="-3000" width="9000" height="${3000 + GROUND}" fill="url(#sky)"/>` +
      `<rect x="-4000" y="${GROUND}" width="9000" height="3000" fill="${S.ground}"/>` +
      `<path d="M${DX - 58},${GROUND + 26} L${DX + DW + 58},${GROUND + 26} L${DX + DW + 260},${GROUND + 400} L${DX - 260},${GROUND + 400} Z" fill="${S.path}"/>`;
  }

  function doorway() {
    const a = T.arch;
    let o = `<ellipse class="spill" cx="500" cy="${GROUND + 20}" rx="190" ry="46" fill="url(#spillG)"/>`;
    o += `<path d="${archPath(DX - 14, DY - 16, DW + 28, DH + 16, a)}" fill="${S.frame}" stroke="${S.trim}" stroke-width="2"/>`;
    o += `<path d="${archPath(DX - 6, DY - 7, DW + 12, DH + 7, a)}" fill="${S.frame2}" stroke="${S.trim}" stroke-width="1.2"/>`;
    /* inside: the nave, pews, the altar with crucifix and candles, the red sanctuary lamp */
    o += `<g clip-path="url(#doorClip)">
      <rect x="${DX}" y="${DY}" width="${DW}" height="${DH}" fill="url(#inside)"/>
      <path d="M${DX + 45},${DY + 104} L${DX + 55},${DY + 104} L${DX + DW - 8},${DY + DH} L${DX + 8},${DY + DH} Z" fill="${S.aisle}" opacity=".85"/>`;
    for (let i = 0; i < 5; i++) {
      const y = DY + 110 + i * 10, spread = 6 + i * 5;
      o += `<rect x="${DX + 40 - spread - 12}" y="${y}" width="${12 + i * 2}" height="3" fill="${S.pew}" opacity=".55"/>`;
      o += `<rect x="${DX + 60 + spread - i * 2}" y="${y}" width="${12 + i * 2}" height="3" fill="${S.pew}" opacity=".55"/>`;
    }
    o += `<rect x="${DX + 38}" y="${DY + 96}" width="24" height="9" fill="${S.pew}" opacity=".75"/><rect x="${DX + 36}" y="${DY + 94}" width="28" height="2.4" fill="#FFFFFF" opacity=".8"/>`;
    o += cross(500, DY + 58, 30, S.pew);
    o += `<circle cx="${DX + 36}" cy="${DY + 90}" r="5" fill="url(#spillG)"/><circle cx="${DX + 64}" cy="${DY + 90}" r="5" fill="url(#spillG)"/>`;
    o += `<circle class="flicker" cx="${DX + 74}" cy="${DY + 70}" r="6" fill="url(#lampG)"/><circle cx="${DX + 74}" cy="${DY + 70}" r="1.4" fill="#FF6B5A"/>`;
    o += `</g>`;
    for (let i = 0; i < 3; i++) {
      o += `<rect x="${DX - 26 - i * 16}" y="${GROUND + i * 9}" width="${DW + 52 + i * 32}" height="9" fill="${i % 2 ? S.step2 : S.step}" stroke="${S.stoneLine}" stroke-width=".6"/>`;
    }
    return o;
  }

  /* ---------- The church: twin bell towers, rose window, Marian niche, Lourdes grotto ---------- */
  function church() {
    const r = rng(21);
    let o = '';
    for (let i = 0; i < 120; i++) {
      const x = -600 + r() * 2200, y = -300 + r() * 1150;
      o += `<circle class="tw" style="animation-delay:${(r() * 3.2).toFixed(2)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="${S.star}"/>`;
    }
    o += `<mask id="moonM"><rect x="560" y="280" width="300" height="250" fill="#fff"/><circle cx="728" cy="384" r="29" fill="#000"/></mask>`;
    o += `<circle cx="712" cy="396" r="64" fill="${S.star}" opacity=".08"/><circle cx="712" cy="396" r="33" fill="${S.moon}" mask="url(#moonM)"/>`;
    o += `<path d="M-600,${GROUND} C-200,930 100,960 300,940 C420,930 460,960 500,960 C560,960 640,925 760,935 C960,950 1200,920 1600,${GROUND} Z" fill="${S.hill}"/>`;
    o += cypress(708, GROUND, 170, S.tree) + cypress(736, GROUND, 120, S.tree2);

    /* bell towers */
    for (const x of [345, 585]) {
      o += `<rect x="${x}" y="580" width="70" height="${GROUND - 580}" fill="${S.stone}" stroke="${S.stoneLine}" stroke-width="1.4"/>`;
      o += `<path d="${archPath(x + 19, 592, 32, 42, 'pointed')}" fill="${S.belfry}" stroke="${S.stoneLine}" stroke-width="1.2"/>`;
      o += `<g class="sway" style="animation-delay:${x === 345 ? 0 : -1.7}s"><line x1="${x + 35}" y1="604" x2="${x + 35}" y2="611" stroke="${S.trim}" stroke-width="1.4"/><path d="M${x + 26},629 Q${x + 26},611 ${x + 35},611 Q${x + 44},611 ${x + 44},629 L${x + 47},632 L${x + 23},632 Z" fill="${S.bell}"/></g>`;
      o += `<rect x="${x - 4}" y="638" width="78" height="6" fill="${S.stoneShade}" stroke="${S.stoneLine}" stroke-width=".8"/>`;
      o += `<path d="M${x - 6},584 L${x + 35},462 L${x + 76},584 Z" fill="${S.roof}" stroke="${S.stoneLine}" stroke-width="1.4"/>`;
      o += cross(x + 35, 426, 36, S.trim);
      o += `<g filter="url(#glowF)">${lancet(x + 22, 680, 26, 66, { stroke: S.stoneLine })}${lancet(x + 22, 800, 26, 80, { stroke: S.stoneLine })}</g>`;
    }
    /* nave gable, rose window, and the niche with Our Lady above the door */
    o += `<path d="M415,${GROUND} V736 L500,642 L585,736 V${GROUND} Z" fill="${S.stone}" stroke="${S.stoneLine}" stroke-width="1.4"/>`;
    o += `<path d="M410,740 L500,636 L590,740" fill="none" stroke="${S.trim}" stroke-width="2.4" stroke-linejoin="round" opacity=".7"/>`;
    o += `<g filter="url(#glowF)"><circle cx="500" cy="700" r="24" fill="url(#glassR)" stroke="${S.stoneLine}" stroke-width="2"/></g>`;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      o += `<line x1="500" y1="700" x2="${(500 + Math.cos(a) * 24).toFixed(1)}" y2="${(700 + Math.sin(a) * 24).toFixed(1)}" stroke="${S.stoneLine}" stroke-width="1"/>`;
    }
    o += `<circle cx="500" cy="700" r="6" fill="${S.stoneLine}"/><circle class="shine" cx="500" cy="700" r="24" fill="url(#winShine)"/>`;
    o += `<path d="${archPath(485, 738, 30, 70, 'pointed')}" fill="${S.belfry}" stroke="${S.stoneLine}" stroke-width="1.2"/>`;
    o += mary(500, 802, 50);
    o += `<rect x="486" y="802" width="28" height="4" fill="${S.stoneShade}" stroke="${S.stoneLine}" stroke-width=".6"/>`;

    /* Lourdes grotto with a candle rack, to the left of the church */
    const g = rng(9);
    o += `<path d="M232,${GROUND} C226,958 236,900 268,878 C292,862 318,866 330,892 C342,918 340,960 338,${GROUND} Z" fill="${S.rock}"/>`;
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * (0.08 + g() * 0.84), rr = 0.35 + g() * 0.6;
      const cx = 284 + Math.cos(a) * 54 * rr, cy = GROUND - Math.sin(a) * 120 * rr;
      o += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(9 + g() * 9).toFixed(1)}" ry="${(6 + g() * 6).toFixed(1)}" fill="${S.rock2}" stroke="${S.stoneLine}" stroke-width=".7" opacity=".9"/>`;
    }
    o += `<path d="M258,${GROUND} C258,972 270,950 286,950 C302,950 314,972 314,${GROUND} Z" fill="${S.cave}"/>`;
    o += `<ellipse cx="304" cy="900" rx="14" ry="20" fill="${S.cave}"/>`;
    o += mary(304, 918, 30);
    for (let i = 0; i < 5; i++) {
      const cx = 268 + i * 9;
      o += `<circle class="flicker" style="animation-delay:${(-i * .45).toFixed(2)}s" cx="${cx}" cy="984" r="7" fill="url(#spillG)" opacity=".8"/><rect x="${cx - 1.6}" y="986" width="3.2" height="9" fill="${S.candle}"/>`;
    }
    o += `<rect x="262" y="994" width="50" height="3" fill="${S.stoneLine}"/>`;

    /* lanterns by the steps */
    for (const x of [424, 576]) {
      o += `<rect x="${x - 1.5}" y="924" width="3" height="${GROUND - 924}" fill="${S.stoneLine}"/>`;
      o += `<circle class="flicker" cx="${x}" cy="918" r="24" fill="url(#spillG)" opacity=".8"/>`;
      o += `<rect x="${x - 5}" y="910" width="10" height="15" rx="2" fill="${S.light2}" stroke="${S.stoneLine}"/>`;
    }
    return { svg: o, bounds: { x: 226, y: 410, w: 548, h: 620 } };
  }

  /* ---------- Door leaves (HTML layer) ----------
     Each leaf draws the whole monogram in shared door coordinates (0–100 wide) and
     shows only its own half, so the design is whole when closed and splits as it opens. */
  function monogram() {
    const D = T.door, [L, R] = C.initials.map(esc);
    const [y, mo, d] = wedding.start.slice(0, 10).split('-');
    return `${cross(50, 24, 18, D.trim)}
        <g fill="none" stroke-linecap="round">
          <circle cx="60" cy="70" r="15" stroke="${D.trim}" stroke-width="2.4"/>
          <circle cx="40" cy="70" r="15" stroke="${D.trim}" stroke-width="2.4"/>
          <path d="M47.71,61.39 A15,15 0 0 1 52.5,57.01" stroke="${D.wood2}" stroke-width="5"/>
          <path d="M47.4,61.75 A15,15 0 0 1 52.8,56.85" stroke="${D.trim}" stroke-width="2.4"/>
        </g>
        <path d="M60,49.6 l2.6,3.2 l-2.6,3.6 l-2.6,-3.6 Z" fill="${D.gem}" stroke="${D.trim}" stroke-width=".5"/>
        <text x="36.5" y="76" text-anchor="middle" font-size="15" fill="${D.ink}" style="font-family:${T.doorFont}">${L}</text>
        <text x="63.5" y="76" text-anchor="middle" font-size="15" fill="${D.ink}" style="font-family:${T.doorFont}">${R}</text>
        <text x="50" y="100" text-anchor="middle" font-size="4.6" letter-spacing="1.2" fill="${D.trim}" style="font-family:${T.doorSmall}">${d} · ${mo} · ${y}</text>`;
  }

  function leafSVG(side) {
    const D = T.door, id = 'w' + side, mirror = side === 'r' ? 'transform="translate(50,0) scale(-1,1)"' : '';
    const leaf = T.arch === 'round' ? 'M0,160 V50 A50,50 0 0 1 50,0 V160 Z' : 'M0,160 V75 A85,85 0 0 1 50,0 V160 Z';
    let g = `<path d="${leaf}" fill="url(#${id})" stroke="${D.trim}" stroke-width="1.2"/>`;
    g += `<rect x="7" y="106" width="36" height="44" rx="2" fill="none" stroke="${D.line}" stroke-width="1"/><rect x="10" y="109" width="30" height="38" rx="1.5" fill="none" stroke="${D.line}" stroke-width=".5" opacity=".7"/>`;
    for (const y of [44, 132]) g += `<path d="M0,${y} H30 q5,0 5,4 q0,4 -5,4 H0 Z" fill="${D.metal}"/>`;
    for (let y = 116; y <= 144; y += 14) for (let x = 15; x <= 35; x += 10) g += `<circle cx="${x}" cy="${y}" r="1.1" fill="${D.metal}"/>`;
    g += `<rect x="48.6" y="0" width="1.4" height="160" fill="${D.line}"/>`;
    g += `<circle cx="43" cy="122" r="3.6" fill="none" stroke="${D.metal}" stroke-width="1.3"/><circle cx="43" cy="117.6" r="1.2" fill="${D.metal}"/>`;
    return `<svg viewBox="0 0 50 160" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${D.wood1}"/><stop offset="1" stop-color="${D.wood2}"/></linearGradient></defs>
      <g ${mirror}>${g}</g>
      <g ${side === 'r' ? 'transform="translate(-50,0)"' : ''}>${monogram()}</g>
    </svg>`;
  }

  /* ---------- Sparkle canvas ---------- */
  const FX = (() => {
    if (reduce) return { burst() {}, ambient() {} };
    const cv = document.createElement('canvas');
    cv.id = 'fx'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const size = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);

    const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
    const starPath = (g, cx, cy, r) => { g.beginPath(); g.moveTo(cx, cy - r); g.quadraticCurveTo(cx, cy, cx + r, cy); g.quadraticCurveTo(cx, cy, cx, cy + r); g.quadraticCurveTo(cx, cy, cx - r, cy); g.quadraticCurveTo(cx, cy, cx, cy - r); g.closePath(); };
    const sprites = T.sparkle.map(col => {
      const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
      const g = c.getContext('2d'), m = s / 2;
      const gr = g.createRadialGradient(m, m, 0, m, m, m);
      gr.addColorStop(0, rgba(col, .9)); gr.addColorStop(.3, rgba(col, .22)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      g.fillStyle = T.sparkleCore || col; starPath(g, m, m, m * .82); g.fill();
      g.globalAlpha = .7; g.translate(m, m); g.rotate(Math.PI / 4); starPath(g, 0, 0, m * .36); g.fill();
      return c;
    });

    const MAX = coarse ? 180 : 360;
    const parts = [];
    let ambientOn = false, raf = 0;
    const amb = [];
    const AMB_N = coarse ? 10 : 16;

    function add(x, y, power) {
      if (parts.length >= MAX) parts.shift();
      const a = Math.random() * Math.PI * 2, sp = (0.3 + Math.random() * 1.4) * power;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.4 * power, grav: .035, age: 0, life: 50 + Math.random() * 50, size: 7 + Math.random() * 12, rot: Math.random() * 6, vr: (Math.random() - .5) * .1, k: (Math.random() * sprites.length) | 0, tw: Math.random() * 6 });
    }
    function burst(x, y, n = 24) { for (let i = 0; i < n; i++) add(x, y, 2.6); kick(); }
    function trail(x, y, dist) {
      const n = Math.min(4, Math.max(1, dist / 10));
      for (let i = 0; i < n; i++) add(x + (Math.random() - .5) * 8, y + (Math.random() - .5) * 8, .55);
      kick();
    }

    const newAmb = initial => ({ x: Math.random() * W, y: initial ? Math.random() * H : -20, s: .5 + Math.random() * .8, ph: Math.random() * 6.28 });
    function drawAmb(p, t) {
      const al = .25 + .55 * Math.abs(Math.sin(t / 900 + p.ph)), sz = 7 * p.s;
      ctx.globalAlpha = al; ctx.drawImage(sprites[0], p.x - sz, p.y - sz, sz * 2, sz * 2);
    }

    function frame(t) {
      raf = 0;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = T.blend;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age++; p.x += p.vx; p.y += p.vy; p.vx *= .965; p.vy = p.vy * .965 + p.grav; p.rot += p.vr;
        const k = 1 - p.age / p.life;
        if (k <= 0) { parts.splice(i, 1); continue; }
        const sz = p.size * (.35 + .65 * k);
        ctx.globalAlpha = Math.min(1, k * 1.6) * (.65 + .35 * Math.sin(p.age * .35 + p.tw));
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.rotate(p.rot); ctx.drawImage(sprites[p.k], -sz, -sz, sz * 2, sz * 2);
        ctx.restore();
      }
      if (ambientOn) for (const p of amb) drawAmb(p, t);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (parts.length || ambientOn) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    function ambient(on) {
      ambientOn = on;
      if (on && !amb.length) for (let i = 0; i < AMB_N; i++) amb.push(newAmb(true));
      if (on) kick();
    }

    let lx = null, ly = null;
    const move = (x, y) => {
      if (lx === null) { lx = x; ly = y; }
      const d = Math.hypot(x - lx, y - ly);
      if (d > 3) { trail(x, y, d); lx = x; ly = y; }
    };
    addEventListener('pointermove', e => move(e.clientX, e.clientY), { passive: true });
    addEventListener('touchmove', e => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
    addEventListener('pointerdown', e => { lx = e.clientX; ly = e.clientY; burst(e.clientX, e.clientY, 14); }, { passive: true });
    return { burst, ambient };
  })();

  /* ---------- Custom cursor: two silver wedding rings with a diamond ---------- */
  if (finePointer && !reduce) {
    const cur = document.createElement('div');
    cur.id = 'cursor'; cur.className = 'no-rot';
    cur.innerHTML = `<svg class="g" viewBox="-16 -16 32 32" aria-hidden="true" style="filter:drop-shadow(0 0 4px ${T.cursorGlow})"><g fill="none" stroke="${T.cursorColor}" stroke-width="2.2"><circle cx="-3.6" cy="1.5" r="6.4"/><circle cx="3.6" cy="-1.5" r="6.4"/></g><path d="M3.6,-11.6 l2,2.4 l-2,2.6 l-2,-2.6 Z" fill="${T.cursorEdge}"/></svg>`;
    document.body.appendChild(cur);
    html.classList.add('custom-cursor');
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      cur.classList.add('on');
      cur.classList.toggle('hot', !!(e.target.closest && e.target.closest('a,button,summary,[role="button"]')));
    }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  }

  /* ---------- Text from CONFIG ---------- */
  function texts() {
    return {
      groom: C.groom, groomFull: C.groomFull || C.groom, bride: C.bride, groomShort: C.groomShort, brideShort: C.brideShort,
      groomInitial: C.initials[0], brideInitial: C.initials[1],
      groomParents: C.groomParents, brideParents: C.brideParents,
      groomSibling: C.groomSibling, brideSibling: C.brideSibling,
      groomSiblingRole: C.groomSiblingRole, brideSiblingRole: C.brideSiblingRole,
      groomFamily: C.groomFamily, brideFamily: C.brideFamily,
      verse: C.verse.text, verseRef: C.verse.ref,
      dateText: longDate(wedding.start), heroTime: wedding.heroTime ? `at ${wedding.heroTime}` : '',
      churchName: wedding.venue, churchPlace: wedding.place
    };
  }
  function fillText() {
    const t = texts();
    $$('[data-k]').forEach(el => { const v = t[el.dataset.k]; if (v != null) el.textContent = v; });
  }

  /* ---------- Events ---------- */
  const ICONS = {
    rings: '<circle cx="19" cy="27" r="9"/><circle cx="29" cy="27" r="9"/><path d="M29 14 l2.5 3 -2.5 3.2 -2.5 -3.2 Z"/>',
    church: '<path d="M24 6 v8 M20.5 9.5 h7"/><path d="M14 42 V25 L24 15 L34 25 V42 Z"/><path d="M20.5 42 v-7 a3.5 3.5 0 0 1 7 0 v7"/><circle cx="24" cy="25.5" r="2.6"/>',
    toast: '<path d="M14 9 h8 l-1 10 a3 3 0 0 1 -6 0 Z"/><path d="M18 22 v13 M14 35 h8"/><path d="M26 9 h8 l-1 10 a3 3 0 0 1 -6 0 Z"/><path d="M30 22 v13 M26 35 h8"/><path d="M24 4 v3 M20 5.5 l1.2 1.6 M28 5.5 l-1.2 1.6"/>'
  };
  const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
  function calLinks(ev) {
    const title = `${ev.title} · ${C.groomShort} & ${C.brideShort}`;
    const loc = `${ev.venue}, ${ev.place}`;
    const details = `${ev.kicker}\n${ev.time ? ev.time + ' (IST)' : 'Time to be announced'}\nMap: ${ev.map}`;
    const timed = parts(ev.start).timed;
    const gDates = timed ? `${utcStamp(new Date(ev.start))}/${utcStamp(new Date(ev.end))}` : `${ymd(ev.start)}/${nextDay(ev.start)}`;
    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gDates}&location=${encodeURIComponent(loc)}&details=${encodeURIComponent(details)}`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Naveen and Felcy//Wedding//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${ev.key}-${ymd(ev.start)}@naveen-felcy`, `DTSTAMP:${utcStamp(new Date())}`,
      timed ? `DTSTART:${utcStamp(new Date(ev.start))}` : `DTSTART;VALUE=DATE:${ymd(ev.start)}`,
      timed ? `DTEND:${utcStamp(new Date(ev.end))}` : `DTEND;VALUE=DATE:${nextDay(ev.start)}`,
      `SUMMARY:${icsEsc(title)}`, `LOCATION:${icsEsc(loc)}`, `DESCRIPTION:${icsEsc(details)}`, `URL:${ev.map}`,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return { google, ics };
  }
  function renderEvents() {
    const wrap = $('#events');
    if (!wrap) return;
    wrap.className = 'events ev-a';
    wrap.innerHTML = C.events.map((ev, i) => {
      const p = parts(ev.start);
      const { google } = calLinks(ev);
      const time = ev.time ? `<p class="ev-time">${esc(ev.time)}</p>` : `<p class="ev-time tbc">Time to be announced</p>`;
      return `<article class="event rv ev-${esc(ev.key)}" style="--d:${(i * .12).toFixed(2)}s">
        <div class="ev-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[ev.icon] || ''}</svg></div>
        <p class="ev-when"><span class="ev-wd">${DAYS[p.wd]}</span> <span class="ev-day">${p.d}</span> <span class="ev-mon">${MONTHS[p.mo - 1].slice(0, 3)} ${p.y}</span></p>
        <div class="ev-body">
          <p class="ev-kicker">${esc(ev.kicker)}</p>
          <h3>${esc(ev.title)}</h3>
          ${time}
          <p class="ev-venue"><strong>${esc(ev.venue)}</strong><br>${esc(ev.place)}</p>
          <div class="ev-actions">
            <a class="btn btn-sm" href="${esc(ev.map)}" target="_blank" rel="noopener">Directions</a>
            <details class="cal"><summary class="btn btn-sm btn-ghost">Add to calendar</summary>
              <div class="cal-menu"><a href="${esc(google)}" target="_blank" rel="noopener">Google Calendar</a><button type="button" data-ics="${i}">Apple or Outlook (.ics file)</button></div>
            </details>
          </div>
        </div>
      </article>`;
    }).join('');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-ics]');
    if (!b) return;
    const ev = C.events[+b.dataset.ics];
    const blob = new Blob([calLinks(ev).ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${ev.key}-naveen-felcy.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  /* close an open calendar menu when tapping elsewhere */
  document.addEventListener('click', e => { $$('details.cal[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }); });

  /* ---------- Countdown ---------- */
  function countdown() {
    const cd = $('#cd');
    if (!cd) return;
    const ev = evByKey(C.countdownTo) || wedding;
    const target = instant(ev.start).getTime();
    const units = ['d', 'h', 'm', 's'].map(u => cd.querySelector(`[data-u="${u}"]`));
    const pad = n => String(n).padStart(2, '0');
    const note = $('#cd-note');
    const first = C.events.find(e => e !== ev && instant(e.start) > Date.now() && instant(e.start) < target);
    if (note) note.textContent = first ? `First comes the ${first.title.toLowerCase()} on ${longDate(first.start)}.` : '';
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { cd.hidden = true; const done = $('#cd-done'); if (done) done.hidden = false; return; }
      units[0].textContent = Math.floor(diff / 864e5);
      units[1].textContent = pad(Math.floor(diff / 36e5) % 24);
      units[2].textContent = pad(Math.floor(diff / 6e4) % 60);
      units[3].textContent = pad(Math.floor(diff / 1e3) % 60);
      setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
  }

  /* ---------- Venue map (drawn from the real coordinates) ---------- */
  function venueMap() {
    const box = $('#map');
    if (!box) return;
    const evs = C.events.filter(e => e.ll);
    const lat0 = evs.reduce((s, e) => s + e.ll[0], 0) / evs.length, kx = Math.cos(lat0 * Math.PI / 180);
    const km = (a, b) => { const R = 6371, dLat = (b[0] - a[0]) * Math.PI / 180, dLon = (b[1] - a[1]) * Math.PI / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
    const pts = evs.map(e => ({ e, x: e.ll[1] * kx, y: -e.ll[0] }));
    const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
    const VW = 600, VH = 420, pad = 70;
    const s = Math.min((VW - pad * 2.6) / (maxX - minX || 1), (VH - pad * 2) / (maxY - minY || 1));
    const ox = (VW - (maxX - minX) * s) / 2, oy = (VH - (maxY - minY) * s) / 2;
    pts.forEach(p => { p.sx = ox + (p.x - minX) * s; p.sy = oy + (p.y - minY) * s; });
    const kmPerUnit = 111.32 / s;
    const scaleKm = 0.5, scalePx = scaleKm / kmPerUnit;
    let o = '';
    for (let x = 0; x <= VW; x += 40) o += `<line x1="${x}" y1="0" x2="${x}" y2="${VH}" class="m-grid"/>`;
    for (let y = 0; y <= VH; y += 40) o += `<line x1="0" y1="${y}" x2="${VW}" y2="${y}" class="m-grid"/>`;
    const byKey = k => pts.find(p => p.e.key === k);
    const legs = [['wedding', 'reception'], ['engagement', 'wedding']];
    for (const [a, b] of legs) {
      const A = byKey(a), B2 = byKey(b);
      if (!A || !B2) continue;
      const d = km(A.e.ll, B2.e.ll);
      const mx = (A.sx + B2.sx) / 2, my = (A.sy + B2.sy) / 2;
      o += `<line x1="${A.sx.toFixed(1)}" y1="${A.sy.toFixed(1)}" x2="${B2.sx.toFixed(1)}" y2="${B2.sy.toFixed(1)}" class="m-leg"/>`;
      o += `<text x="${(mx + 10).toFixed(1)}" y="${(my + 4).toFixed(1)}" class="m-dist">${d.toFixed(1)} km</text>`;
    }
    pts.forEach((p, i) => {
      const right = p.sx < VW * .62;
      const tx = right ? p.sx + 22 : p.sx - 22, anchor = right ? 'start' : 'end';
      o += `<a href="${esc(p.e.map)}" target="_blank" rel="noopener" class="m-pin" aria-label="${esc(p.e.title)}: open ${esc(p.e.venue)} in Google Maps">
        <circle cx="${p.sx.toFixed(1)}" cy="${p.sy.toFixed(1)}" r="16" class="m-halo"/>
        <circle cx="${p.sx.toFixed(1)}" cy="${p.sy.toFixed(1)}" r="6.5" class="m-dot m-${esc(p.e.key)}"/>
        <text x="${tx.toFixed(1)}" y="${(p.sy - 5).toFixed(1)}" text-anchor="${anchor}" class="m-title">${esc(p.e.title)}</text>
        <text x="${tx.toFixed(1)}" y="${(p.sy + 19).toFixed(1)}" text-anchor="${anchor}" class="m-sub">${esc(p.e.venue.length > 26 ? p.e.venue.replace(' Church', '') : p.e.venue)}</text>
      </a>`;
    });
    o += `<g transform="translate(${VW - 40},44)" class="m-north"><path d="M0,-16 L7,8 L0,3 L-7,8 Z"/><text y="24" text-anchor="middle">N</text></g>`;
    o += `<g transform="translate(28,${VH - 30})" class="m-scale"><line x1="0" y1="0" x2="${scalePx.toFixed(1)}" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="${scalePx.toFixed(1)}" y1="-5" x2="${scalePx.toFixed(1)}" y2="5"/><text x="${(scalePx / 2).toFixed(1)}" y="-9" text-anchor="middle">500 m</text></g>`;
    box.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Map of the three venues in Puducherry">${o}</svg>`;
  }

  /* ---------- Gallery and lightbox ---------- */
  function placeholder(i) {
    const r = rng(40 + i);
    let st = '';
    for (let k = 0; k < 40; k++) st += `<circle cx='${(r() * 400).toFixed(0)}' cy='${(r() * 500).toFixed(0)}' r='${(0.6 + r() * 1.6).toFixed(1)}' fill='%23E6ECFF' opacity='${(0.3 + r() * 0.7).toFixed(2)}'/>`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%231E2E5C'/><stop offset='1' stop-color='%230A1229'/></linearGradient></defs><rect width='400' height='500' fill='url(%23g)'/>${st}<path d='M196 210 h8 v24 h20 v8 h-20 v46 h-8 v-46 h-20 v-8 h20 Z' fill='%23CBD3E4' opacity='.5'/><text x='200' y='340' text-anchor='middle' font-family='Georgia,serif' font-size='22' fill='%23CBD3E4'>Photo ${i}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + svg.replace(/\n/g, '');
  }
  function gallery() {
    const grid = $('#gallery');
    if (!grid) return;
    const sample = !C.photos.length;
    const list = (sample ? Array.from({ length: 6 }, (_, i) => ({ src: placeholder(i + 1), alt: `Sample frame ${i + 1}` })) : C.photos)
      .map(p => ({ thumb: p.thumb || p.src, src: p.src || p.thumb, alt: p.alt || '' }));
    const note = $('#gallery-note');
    if (note) note.hidden = !sample;
    grid.innerHTML = list.map((p, i) => `<button type="button" class="ph" data-i="${i}" aria-label="Open photo ${i + 1} of ${list.length}"><img src="${esc(p.thumb)}" alt="${esc(p.alt)}" loading="lazy" decoding="async"></button>`).join('');
    const lb = $('#lightbox'), img = $('#lb-img'), cap = $('#lb-cap');
    let at = 0, lastFocus = null;
    const show = i => { at = (i + list.length) % list.length; img.src = list[at].src; img.alt = list[at].alt; cap.textContent = `${at + 1} / ${list.length}`; };
    const open = i => { lastFocus = document.activeElement; show(i); lb.hidden = false; requestAnimationFrame(() => lb.classList.add('on')); $('#lb-close').focus(); };
    const close = () => { lb.classList.remove('on'); setTimeout(() => { lb.hidden = true; }, 300); if (lastFocus) lastFocus.focus(); };
    grid.addEventListener('click', e => { const b = e.target.closest('.ph'); if (b) open(+b.dataset.i); });
    $('#lb-close').addEventListener('click', close);
    $('#lb-prev').addEventListener('click', () => show(at - 1));
    $('#lb-next').addEventListener('click', () => show(at + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(at - 1); else if (e.key === 'ArrowRight') show(at + 1);
    });
    let sx = null;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1)); sx = null; }, { passive: true });
  }

  /* ---------- RSVP ---------- */
  function rsvp() {
    const box = $('#rsvp-list');
    if (!box) return;
    const by = $('#rsvp-by');
    if (by) { by.hidden = !C.rsvpBy; if (C.rsvpBy) by.textContent = `Kindly let us know by ${longDate(C.rsvpBy)}.`; }
    const couple = `${C.groomShort} & ${C.brideShort}`;
    const waLink = (c, text) => `https://wa.me/${c.phone}?text=${encodeURIComponent(text)}`;
    box.innerHTML = C.rsvp.map((c, i) => {
      /* the plain link still works if the form can't open */
      const msg = `Hello ${c.name}, I'd like to RSVP for ${couple}'s wedding.\nName: \nNumber of guests: \nAttending: ${C.events.map(e => e.title).join(' / ')}`;
      return `<article class="rsvp-card">
        <p class="rsvp-side">${esc(c.side)}</p>
        <p class="rsvp-name">${esc(c.name)}</p>
        <p class="rsvp-num">${esc(c.display)}</p>
        <div class="rsvp-actions">
          <a class="btn btn-sm" data-rsvp="${i}" href="${esc(waLink(c, msg))}" target="_blank" rel="noopener">WhatsApp ${esc(c.name)}</a>
          <a class="btn btn-sm btn-ghost" href="tel:+${esc(c.phone)}">Call</a>
        </div>
      </article>`;
    }).join('');

    /* RSVP form: name, guests and events, then WhatsApp opens with the message ready */
    const dlg = document.createElement('dialog');
    if (typeof dlg.showModal !== 'function') return;
    const shortDate = iso => { const p = parts(iso); return `${DAYS[p.wd].slice(0, 3)} ${p.d} ${MONTHS[p.mo - 1].slice(0, 3)}`; };
    const MAXG = 20;
    dlg.id = 'rsvp-dlg';
    dlg.setAttribute('aria-labelledby', 'rd-title');
    dlg.innerHTML = `<form class="rd" novalidate>
      <header class="rd-head">
        <div><p class="rd-to" id="rd-to"></p><h2 id="rd-title">Will you join us?</h2></div>
        <button type="button" class="rd-x" data-close aria-label="Close">×</button>
      </header>
      <label class="rd-field"><span>Your name</span><input id="rd-name" name="name" type="text" autocomplete="name" autocapitalize="words" maxlength="80" required></label>
      <fieldset class="rd-reply"><legend>Your reply</legend>
        <label><input type="radio" name="reply" value="yes" checked><span>Joyfully accept</span></label>
        <label><input type="radio" name="reply" value="no"><span>Regretfully decline</span></label>
      </fieldset>
      <div class="rd-yes">
        <div class="rd-field"><span id="rd-g-lbl">Number of guests, including you</span>
          <div class="rd-step" role="group" aria-labelledby="rd-g-lbl">
            <button type="button" data-step="-1" aria-label="One fewer guest">−</button>
            <input id="rd-guests" name="guests" type="number" inputmode="numeric" min="1" max="${MAXG}" value="1" aria-labelledby="rd-g-lbl">
            <button type="button" data-step="1" aria-label="One more guest">+</button>
          </div>
        </div>
        <fieldset class="rd-events"><legend>Attending</legend>
          ${C.events.map((e, k) => `<label><input type="checkbox" name="ev" value="${k}" checked><span><b>${esc(e.title)}</b><small>${esc(shortDate(e.start))}${e.time ? ' · ' + esc(e.time) : ''}</small></span></label>`).join('')}
        </fieldset>
      </div>
      <p class="rd-err" id="rd-err" role="alert"></p>
      <button type="submit" class="btn rd-go">Continue to WhatsApp</button>
      <p class="rd-note">WhatsApp opens with your reply written out. Just tap send.</p>
    </form>`;
    document.body.appendChild(dlg);
    const form = $('form', dlg), name = $('#rd-name', dlg), guests = $('#rd-guests', dlg), err = $('#rd-err', dlg);
    let to = null;
    const reply = () => form.reply.value;
    const sync = () => { const yes = reply() === 'yes'; $('.rd-yes', dlg).hidden = !yes; err.textContent = ''; };
    const clampG = () => { const n = Math.round(+guests.value); guests.value = Math.min(MAXG, Math.max(1, Number.isFinite(n) && n > 0 ? n : 1)); };
    form.addEventListener('change', e => { if (e.target.name === 'reply') sync(); else if (e.target === guests) clampG(); else err.textContent = ''; });
    $$('[data-step]', dlg).forEach(b => b.addEventListener('click', () => { guests.value = (+guests.value || 1) + (+b.dataset.step); clampG(); }));
    $('[data-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // tap outside the card
    dlg.addEventListener('close', () => html.classList.remove('dlg-open'));

    box.addEventListener('click', e => {
      const a = e.target.closest('[data-rsvp]');
      if (!a) return;
      e.preventDefault();
      to = C.rsvp[+a.dataset.rsvp];
      $('#rd-to', dlg).textContent = `To ${to.name} · ${to.side}`;
      err.textContent = '';
      sync();
      html.classList.add('dlg-open');
      dlg.showModal();
      if (!name.value) name.focus();
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const who = name.value.trim().replace(/\s+/g, ' ');
      if (!who) { err.textContent = 'Please enter your name.'; name.focus(); return; }
      let text;
      if (reply() === 'yes') {
        const evs = $$('input[name="ev"]:checked', dlg).map(x => C.events[+x.value]);
        if (!evs.length) { err.textContent = 'Please tick at least one event, or choose “Regretfully decline”.'; return; }
        clampG();
        text = `Hello ${to.name}, here is my RSVP for ${couple}'s wedding.\n\nName: ${who}\nNumber of guests: ${guests.value}\nAttending:\n${evs.map(ev => `• ${ev.title} (${shortDate(ev.start)})`).join('\n')}\n\nThank you!`;
      } else {
        text = `Hello ${to.name}, thank you for inviting me to ${couple}'s wedding. Sadly, I won't be able to attend. Wishing them both every blessing.\n\nName: ${who}`;
      }
      const url = waLink(to, text);
      const win = window.open(url, '_blank');   // a 'noopener' feature would make this return null
      if (win) win.opener = null; else location.href = url;
      dlg.close();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const io = ('IntersectionObserver' in window) && !reduce ? new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.remove('pre'); en.target.classList.add('in'); io.unobserve(en.target); }
  }, { threshold: .12, rootMargin: '0px 0px -4% 0px' }) : null;
  const armReveal = () => { if (!io) return; $$('.rv').forEach(el => { el.classList.add('pre'); el.classList.remove('in'); }); };
  const runReveal = () => { if (!io) return; $$('.rv.pre').forEach(el => io.observe(el)); };

  /* ---------- Couple portraits ---------- */
  function portraits() {
    $$('[data-portrait]').forEach(el => {
      const p = C.portraits && C.portraits[el.dataset.portrait];
      if (p) el.innerHTML = `<img src="${esc(p.src)}" alt="${esc(p.alt || '')}" loading="lazy" decoding="async">`;
    });
  }

  /* ---------- Build page content ---------- */
  fillText(); portraits(); renderEvents(); countdown(); venueMap(); gallery(); rsvp();

  /* ---------- Build the intro ---------- */
  const intro = $('#intro');
  const built = church();
  intro.insertAdjacentHTML('afterbegin', `<svg id="scene" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${defs()}${backdrop()}${built.svg}${doorway()}</svg>`);
  const svg = $('#scene');
  const doors = $('#doors');
  const buildDoors = () => { doors.innerHTML = `<span class="halo"></span><span class="leaf l">${leafSVG('l')}<i class="shade"></i></span><span class="leaf r">${leafSVG('r')}<i class="shade"></i></span>`; };
  buildDoors();
  const hint = $('#hint');
  const flash = $('#flash');

  let vb = null, stage = 'far', tweenRaf = 0, timers = [], hashDone = false;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const view = () => ({ W: intro.clientWidth || innerWidth, H: intro.clientHeight || innerHeight });
  function fit(box, m, biasY = 0) {
    const { W, H } = view(), A = W / H;
    let w = box.w * (1 + 2 * m), h = box.h * (1 + 2 * m);
    if (w / h < A) w = h * A; else h = w / A;
    return { x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2 + biasY * h, w, h };
  }
  const B = built.bounds;
  const farVB = () => fit({ x: B.x, y: B.y - B.h * .28, w: B.w, h: B.h * 1.28 }, .04);
  const doorVB = () => {
    const v = fit({ x: DX - 34, y: DY - 26, w: DW + 68, h: DH + 34 }, .1, .04);
    /* on tall (phone) screens, keep the doors low so Our Lady's niche shows above them */
    v.y = Math.min(v.y, GROUND + 12 - v.h * .8);
    return v;
  };
  let pendingOpen = false;
  const throughVB = () => fit({ x: DX + DW * .42, y: DY + DH * .5, w: DW * .16, h: DH * .12 }, 0);

  function setVB(v) {
    vb = v;
    svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
    const { W, H } = view();
    const s = Math.min(W / v.w, H / v.h), ox = (W - v.w * s) / 2, oy = (H - v.h * s) / 2;
    const x = (DX - v.x) * s + ox, y = (DY - v.y) * s + oy, w = DW * s, h = DH * s;
    doors.style.left = x + 'px'; doors.style.top = y + 'px';
    doors.style.width = w + 'px'; doors.style.height = h + 'px';
    doors.style.perspective = (w * 2.4) + 'px';
    hint.style.top = Math.min(H - 56, y + h + 22 * Math.min(1, s)) + 'px';
  }

  const easeInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const easeIn = p => p * p * p;
  function tween(to, ms, ease, done) {
    cancelAnimationFrame(tweenRaf);
    const from = vb, k = to.w / from.w;
    const fixed = Math.abs(1 - k) < 1e-6 ? null : { x: (to.x - k * from.x) / (1 - k), y: (to.y - k * from.y) / (1 - k) };
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / ms), e = ease(p), kt = Math.pow(k, e);
      if (fixed) setVB({ x: fixed.x + (from.x - fixed.x) * kt, y: fixed.y + (from.y - fixed.y) * kt, w: from.w * kt, h: from.h * kt });
      else setVB({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w, h: from.h });
      if (p < 1) tweenRaf = requestAnimationFrame(step); else done && done();
    };
    tweenRaf = requestAnimationFrame(step);
  }

  function zoomToDoor() {
    if (stage !== 'far') return;
    stage = 'zooming'; clearTimers();
    intro.classList.add('zooming');
    if (reduce) { setVB(doorVB()); return atDoor(); }
    tween(doorVB(), 2800, easeInOut, atDoor);
  }
  function atDoor() {
    stage = 'door'; setVB(doorVB()); intro.classList.add('ready');
    if (pendingOpen) { pendingOpen = false; later(openDoors, 500); }
  }
  function openDoors() {
    stage = 'opening';
    intro.classList.add('opening');
    const r = doors.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height * .45, 40);
    if (reduce) return later(finish, 600);
    later(() => tween(throughVB(), 2100, easeIn), 1000);
    later(() => flash.classList.add('on'), 2200);
    later(finish, 3100);
  }
  function finish() {
    clearTimers(); cancelAnimationFrame(tweenRaf);
    stage = 'inside';
    intro.classList.add('gone');
    html.classList.remove('locked');
    setTimeout(() => flash.classList.remove('on'), 120);
    runReveal();
    FX.ambient(true);
    /* a link such as site.html#moments goes to that section once inside (first time only) */
    const h = !hashDone && location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    hashDone = true;
    if (h) setTimeout(() => h.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }), 450);
  }
  function start() {
    clearTimers(); cancelAnimationFrame(tweenRaf);
    scrollTo(0, 0);
    html.classList.add('locked');
    intro.classList.add('instant');
    intro.classList.remove('gone', 'zooming', 'ready', 'opening');
    void intro.offsetWidth;
    intro.classList.remove('instant');
    FX.ambient(false);
    armReveal();
    stage = 'far'; pendingOpen = false;
    setVB(farVB());
    later(zoomToDoor, reduce ? 400 : 3300);
  }

  intro.addEventListener('click', e => {
    if (e.target.closest('#skip')) return;
    if (stage === 'far') zoomToDoor();
  });
  doors.addEventListener('click', e => { e.stopPropagation(); if (stage === 'far') zoomToDoor(); else if (stage === 'zooming') pendingOpen = true; else if (stage === 'door') openDoors(); });
  $('#skip').addEventListener('click', e => { e.stopPropagation(); finish(); });
  $$('[data-replay]').forEach(b => b.addEventListener('click', start));
  addEventListener('resize', () => { if (stage === 'far') setVB(farVB()); else if (stage === 'door') setVB(doorVB()); });



  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  setVB(farVB());
})();
