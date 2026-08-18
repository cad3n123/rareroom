/* =============================================================================
   RAREROOM — site configuration & content
   -----------------------------------------------------------------------------
   This is the ONE file to edit for content and section toggles.
   Nothing here requires a build step — just save and reload.
   ============================================================================= */

/* -----------------------------------------------------------------------------
   FEATURE FLAGS
   Flip a value to `false` to completely remove that section: its nav link
   disappears everywhere and its page redirects home. No other edits needed.
   (Releases + Shop currently ship with PLACEHOLDER items — see below.)
   --------------------------------------------------------------------------- */
export const FEATURES = {
  releases: false, // Releases / Discography  (placeholder catalogue)
  shop: false, // Shop / Merch            (placeholder products)
};

// True when a feature section is enabled (or has no gate).
export const featureOn = (key) => !key || FEATURES[key] !== false;

/* -----------------------------------------------------------------------------
   SITE
   --------------------------------------------------------------------------- */
export const SITE = {
  name: 'RAREROOM',
  domain: 'rareroomeast.com',
  tagline: 'Recording studio · Record label · Development',
  // Short line used in the hero + meta description.
  intro:
    'A recording studio, label, and development firm — a destination for artists and creatives in music and visual arts.',
  email: {
    demos: 'demos@rareroomeast.com', // A&R / booking / submissions
    ops: 'ops@rareroomeast.com', // general / press / operations
  },
  // ⚠ PLACEHOLDER — point this at the real external subscribe/signup page when
  // it exists. Drives the "Subscribe" button in the nav.
  subscribeUrl: '#',
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/rareroomeast/' },
    { label: 'YouTube', url: 'https://www.youtube.com/@rareroomeast' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@rareroomeast' },
    { label: 'Facebook', url: 'https://www.facebook.com/rareroomeast' },
    { label: 'X', url: 'https://x.com/therobotixmusic' },
  ],
  // Real Mailchimp endpoint carried over from the current site.
  mailchimp: {
    action:
      'https://rareroomeast.us9.list-manage.com/subscribe/post?u=dc1ef2b26411dc4872ade1a16&id=12eb6d76fb&f_id=00c451e1f0',
    botField: 'b_dc1ef2b26411dc4872ade1a16_12eb6d76fb',
  },
};

/* -----------------------------------------------------------------------------
   SOCIAL WORDMARKS
   Every social row on the site is set as the original site's stamped typewriter
   art rather than as type. Keyed by the label lowercased, so SITE.socials (which
   carries display labels) and an artist's `links` (which carries keys) both
   resolve through this one table. A platform with no art here simply falls back
   to its text label, so adding one to SITE.socials never breaks a row.
   --------------------------------------------------------------------------- */
export const SOCIAL_IMG = {
  site: 'assets/img/social/site.png',
  youtube: 'assets/img/social/youtube.png',
  instagram: 'assets/img/social/instagram.png',
  facebook: 'assets/img/social/facebook.png',
  x: 'assets/img/social/x.png',
  tiktok: 'assets/img/social/tiktok.png',
};

export const socialImg = (label) => SOCIAL_IMG[String(label).toLowerCase()] || null;

/* -----------------------------------------------------------------------------
   NAVIGATION  (order matters). `feature` keys are hidden when their flag is off.
   --------------------------------------------------------------------------- */
export const NAV = [
  { label: 'Artists', dropdown: 'artists' }, // parent opens a dropdown of artists
  { label: 'About', route: 'about' },
  { label: 'Contact', route: 'contact' },
  { label: 'Studio', action: 'studio' }, // opens the studio carousel popup
  // `href` items leave the site — rendered as links that open in a new tab.
  { label: 'Licensing', href: 'https://rareroom.fillout.com/licensingrequestform' },
  { label: 'Releases', route: 'releases', feature: 'releases' },
  { label: 'Shop', route: 'shop', feature: 'shop' },
];

/* -----------------------------------------------------------------------------
   ROSTER  — real artists. Add a new one by copying a block.
   `bio` is an array of paragraphs (optional). `links` keys become // social row.
   --------------------------------------------------------------------------- */
export const ARTISTS = [
  {
    slug: 'pollish',
    name: 'Pollish',
    role: 'Producer · Multi-instrumentalist',
    card: 'assets/img/artists/pollish-card.jpg',
    photo: 'assets/img/artists/pollish.jpg',
    nameImg: 'assets/img/artists/pollish-name.png',
    bio: [
      'Pollish is the recording project of Logan Gladden — musician, producer, and founder of RAREROOM.',
    ],
    links: {
      site: 'https://www.pollishtheproject.com/',
      youtube: 'https://youtube.com/@logangladden',
      instagram: 'https://www.instagram.com/logangladden/',
      facebook: 'https://www.facebook.com/LoganRobotGladden',
      x: 'https://x.com/pollish_',
    },
  },
  {
    slug: 'kelsi-kee',
    name: 'Kelsi Kee',
    role: 'Artist',
    card: 'assets/img/artists/kelsi-kee-card.jpg',
    photo: 'assets/img/artists/kelsi-kee.jpg',
    nameImg: 'assets/img/artists/kelsi-kee-name.png',
    bio: [], // add bio paragraphs here
    links: {
      site: 'https://main.d36at1iojavt6k.amplifyapp.com/',
      instagram: 'https://www.instagram.com/kelsibkee/',
      facebook: 'https://www.facebook.com/kelsikee',
    },
  },
];

/* -----------------------------------------------------------------------------
   REMOTE CONFIG  (Amazon S3)
   The live artist images + social links are maintained in one JSON file on S3
   (the same file the old site read). At boot we fetch it and fold it into the
   ARTISTS / SITE.socials above, so updating the roster's photos or links is just
   an edit to that file — no redeploy. Everything here is a graceful override: if
   the fetch fails we fall back to the local defaults.
   --------------------------------------------------------------------------- */
export const REMOTE_CONFIG_URL =
  'https://rareroom-bucket.s3.us-east-2.amazonaws.com/rareroom/data.json';

export async function hydrateFromRemote() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000); // don't hang boot on a slow network
    const res = await fetch(REMOTE_CONFIG_URL, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Site-wide socials (label + url), preserving a sensible display order.
    const sl = data['social-links'] || {};
    const order = [
      ['instagram', 'Instagram'],
      ['youtube', 'YouTube'],
      ['tiktok', 'TikTok'],
      ['facebook', 'Facebook'],
      ['twitter', 'X'],
    ];
    const nextSocials = order.filter(([k]) => sl[k]).map(([k, label]) => ({ label, url: sl[k] }));
    if (nextSocials.length) {
      SITE.socials.length = 0;
      SITE.socials.push(...nextSocials);
    }

    // Per-artist image + links, matched to the local roster by slug (the remote
    // `name` field IS the slug). Keeps local display name / nameImg / role.
    (data.artists || []).forEach((remote) => {
      const local = ARTISTS.find((a) => a.slug === remote.name);
      if (!local) return;
      if (remote.image) {
        local.photo = remote.image;
        local.card = remote.image;
      }
      const links = {};
      if (remote.site) links.site = remote.site;
      if (remote.youtube) links.youtube = remote.youtube;
      if (remote.instagram) links.instagram = remote.instagram;
      if (remote.facebook) links.facebook = remote.facebook;
      if (remote.twitter) links.x = remote.twitter;
      if (remote.tiktok) links.tiktok = remote.tiktok;
      if (Object.keys(links).length) local.links = links;
    });
  } catch (err) {
    console.warn('Remote config unavailable — using local defaults.', err);
  }
}

/* -----------------------------------------------------------------------------
   STUDIO  — gallery images + short service copy.
   --------------------------------------------------------------------------- */
export const STUDIO = {
  blurb:
    'A warm, analog room built for making records — vintage keys and synths, ' +
    'tape-minded signal paths, and a live space that sounds like somewhere. ' +
    'Tracking, production, mixing, and development, all under one roof.',
  services: ['Recording & Tracking', 'Production', 'Mixing', 'Artist Development'],
  images: Array.from({ length: 9 }, (_, i) => `assets/img/studio/rre${i + 1}.jpg`),
};

/* -----------------------------------------------------------------------------
   RELEASES  — ⚠ PLACEHOLDER CATALOGUE (FEATURES.releases).
   Swap these for real releases when ready, or set FEATURES.releases = false.
   `cover` is optional; without it, a stamped catalogue-number cover is drawn.
   --------------------------------------------------------------------------- */
export const RELEASES = [
  {
    catalog: 'RR-001',
    title: 'First Transmission',
    artist: 'Pollish',
    year: 2024,
    format: 'Single',
    cover: null,
    links: { spotify: '#', apple: '#', bandcamp: '#' },
  },
  {
    catalog: 'RR-002',
    title: 'Night Shift',
    artist: 'Kelsi Kee',
    year: 2024,
    format: 'EP',
    cover: null,
    links: { spotify: '#', apple: '#', bandcamp: '#' },
  },
  {
    catalog: 'RR-003',
    title: 'Signal / Noise',
    artist: 'Pollish',
    year: 2025,
    format: 'Single',
    cover: null,
    links: { spotify: '#', apple: '#', bandcamp: '#' },
  },
  {
    catalog: 'RR-004',
    title: 'Development',
    artist: 'Various Artists',
    year: 2025,
    format: 'Compilation',
    cover: null,
    links: { spotify: '#', apple: '#', bandcamp: '#' },
  },
  {
    catalog: 'RR-005',
    title: 'Room Tone',
    artist: 'Kelsi Kee',
    year: 2025,
    format: 'LP',
    cover: null,
    links: { spotify: '#', apple: '#', bandcamp: '#' },
  },
  {
    catalog: 'RR-006',
    title: 'Morse',
    artist: 'Pollish',
    year: 2025,
    format: 'Single',
    cover: null,
    links: { spotify: '#', apple: '#', bandcamp: '#' },
  },
];

/* -----------------------------------------------------------------------------
   SHOP  — ⚠ PLACEHOLDER PRODUCTS (FEATURES.shop).
   Swap for real products / point `url` at Bandcamp/Shopify, or turn the flag off.
   --------------------------------------------------------------------------- */
export const PRODUCTS = [
  {
    name: 'Stamp Tee',
    variant: 'Black · 100% cotton',
    price: '$32',
    tag: 'Apparel',
    url: '#',
  },
  {
    name: 'RAREROOM Cap',
    variant: 'Embroidered stamp',
    price: '$28',
    tag: 'Apparel',
    url: '#',
  },
  {
    name: 'First Transmission',
    variant: '7" Vinyl · Limited',
    price: '$18',
    tag: 'Vinyl',
    url: '#',
  },
  {
    name: 'Room Tone',
    variant: '12" LP · Black',
    price: '$26',
    tag: 'Vinyl',
    url: '#',
  },
  {
    name: 'Morse Tote',
    variant: 'Natural canvas',
    price: '$22',
    tag: 'Accessories',
    url: '#',
  },
  {
    name: 'Sticker Pack',
    variant: 'Die-cut · set of 5',
    price: '$8',
    tag: 'Accessories',
    url: '#',
  },
];
