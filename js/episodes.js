/**
 * ROBOTECH EPISODE ARCHIVE // BITÁCORA TÁCTICA DE MISIONES
 * Motor interactivo de episodios con soporte bilingüe, enlaces cruzados y galería espejo.
 */

window.appState = {
  lang: localStorage.getItem('robotech_lang') || 'es',
  generation: 'all',
  searchQuery: '',
  episodes: [],
  currentEpisode: null
};

const I18N_EP = {
  es: {
    system_title: "ROBOTECH <span>EPISODE ARCHIVE</span>",
    status_online: "ONLINE // REGISTRO DE BITÁCORA OPERACIONAL SDF-1",
    gen_all: "TODOS LOS EPISODIOS (85)",
    gen_1: "1ª GEN: MACROSS (1-36)",
    gen_2: "2ª GEN: MAESTROS (37-60)",
    gen_3: "3ª GEN: INVASIÓN INVID (61-85)",
    search_placeholder: "Buscar por número, título, personaje o palabra clave...",
    view_log: "ABRIR BITÁCORA",
    tab_debrief: "INFORME TÁCTICO Y SINOPSIS",
    tab_characters: "PERSONAL INVOLUCRADO",
    tab_units: "UNIDADES Y NAVES",
    tab_gallery: "ARCHIVOS VISUALES",
    no_results_title: "NO SE ENCONTRARON REGISTROS",
    no_results_desc: "Verifica los términos de búsqueda o el filtro de generación seleccionado.",
    personnel_empty: "No se identificaron tripulantes o líderes clave en los registros de este episodio.",
    units_empty: "No se registraron unidades de combate específicas en este archivo.",
    mirrored_notice: "REGISTRO TÁCTICO",
    zoom_hint: "🔍 CLICK PARA ZOOM",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF"
  },
  en: {
    system_title: "ROBOTECH <span>EPISODE ARCHIVE</span>",
    status_online: "ONLINE // SDF-1 OPERATIONAL MISSION LOG ARCHIVE",
    gen_all: "ALL EPISODES (85)",
    gen_1: "GEN 1: MACROSS (1-36)",
    gen_2: "GEN 2: MASTERS (37-60)",
    gen_3: "GEN 3: INVID INVASION (61-85)",
    search_placeholder: "Search by number, title, character or keywords...",
    view_log: "VIEW MISSION LOG",
    tab_debrief: "TACTICAL DEBRIEF & SYNOPSIS",
    tab_characters: "PERSONNEL INVOLVED",
    tab_units: "COMBAT UNITS & SHIPS",
    tab_gallery: "VISUAL ARCHIVES",
    no_results_title: "NO LOG ENTRIES FOUND",
    no_results_desc: "Check your search terms or generation filter.",
    personnel_empty: "No notable personnel detected in this mission log.",
    units_empty: "No specific combat units logged for this entry.",
    mirrored_notice: "TACTICAL RECORD",
    zoom_hint: "🔍 CLICK TO ZOOM",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF"
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  initLanguage();
  initSoundToggle();
  await loadEpisodesData();
  setupFilterNav();
  setupSearch();
  setupEpisodeModal();
  setupLightbox();
});

// --------------------------------------------------------------------------
// LANGUAGE & AUDIO INITIALIZATION
// --------------------------------------------------------------------------
function initLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam === 'es' || langParam === 'en') {
    window.appState.lang = langParam;
  }
  updateLangUI();

  document.querySelectorAll('.lang-switch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const newLang = btn.dataset.lang;
      if (newLang !== window.appState.lang) {
        window.appState.lang = newLang;
        localStorage.setItem('robotech_lang', newLang);
        window.tacticalAudio?.click();
        updateLangUI();
        renderEpisodes();
      }
    });
  });
}

function updateLangUI() {
  const lang = window.appState.lang;
  document.querySelectorAll('.lang-switch').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N_EP[lang][key]) {
      el.innerHTML = I18N_EP[lang][key];
    }
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = I18N_EP[lang].search_placeholder;
  }
}

function initSoundToggle() {
  const btn = document.getElementById('audio-switch');
  if (!btn) return;
  const updateBtnText = () => {
    const isMuted = window.tacticalAudio?.isMuted();
    btn.textContent = isMuted ? I18N_EP[window.appState.lang].sound_off : I18N_EP[window.appState.lang].sound_on;
  };
  updateBtnText();
  btn.addEventListener('click', () => {
    window.tacticalAudio?.toggleMute();
    window.tacticalAudio?.click();
    updateBtnText();
  });
}

// --------------------------------------------------------------------------
// DATA LOADING
// --------------------------------------------------------------------------
async function loadEpisodesData() {
  try {
    const res = await fetch(`data/episodios.json?_t=${Date.now()}`);
    if (!res.ok) throw new Error("Could not load data/episodios.json");
    const data = await res.json();
    window.appState.episodes = data.episodes || [];
    renderEpisodes();
    checkDirectUrlParam();
  } catch (err) {
    console.error("Error cargando episodios:", err);
    const grid = document.getElementById('episodes-grid');
    if (grid) {
      grid.innerHTML = `<div class="no-results-banner"><h3>DATABASE ERROR</h3><p>No se pudo inicializar la bitácora de episodios.</p></div>`;
    }
  }
}

function checkDirectUrlParam() {
  const params = new URLSearchParams(window.location.search);
  const epParam = params.get('ep') || sessionStorage.getItem('robotech_active_episode');
  if (epParam) {
    const found = window.appState.episodes.find(e => 
      e.id === epParam || 
      String(e.episode_number) === epParam || 
      `ep_${String(e.episode_number).padStart(2, '0')}` === epParam
    );
    if (found) {
      openEpisodeDossier(found.id, false);
      const tabParam = params.get('tab') || sessionStorage.getItem('robotech_active_tab');
      if (tabParam) {
        const cleanTab = tabParam.startsWith('ep-pane-') ? tabParam : `ep-pane-${tabParam}`;
        switchEpisodeTab(cleanTab);
      }
    }
  }
}

// --------------------------------------------------------------------------
// NAVIGATION & SEARCH
// --------------------------------------------------------------------------
function setupFilterNav() {
  document.querySelectorAll('.gen-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gen-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.appState.generation = btn.dataset.generation;
      window.tacticalAudio?.hover();
      renderEpisodes();
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    window.appState.searchQuery = e.target.value.toLowerCase().trim();
    renderEpisodes();
  });
}

// --------------------------------------------------------------------------
// RENDER EPISODES GRID
// --------------------------------------------------------------------------
function renderEpisodes() {
  const grid = document.getElementById('episodes-grid');
  const countEl = document.getElementById('results-count');
  if (!grid || !window.appState.episodes) return;

  const lang = window.appState.lang;
  const gen = window.appState.generation;
  const q = window.appState.searchQuery;

  const filtered = window.appState.episodes.filter(ep => {
    if (gen !== 'all' && ep.generation !== gen) return false;
    if (q) {
      const matchNum = String(ep.episode_number) === q;
      const title = (lang === 'es' ? ep.title_es : ep.title_en).toLowerCase();
      const summary = (lang === 'es' ? ep.summary_es : ep.summary_en).toLowerCase();
      const saga = (lang === 'es' ? ep.saga_es : ep.saga_en).toLowerCase();
      const matchChar = (ep.characters || []).some(c => c.toLowerCase().includes(q));
      const matchUnit = (ep.units || []).some(u => u.toLowerCase().includes(q));
      return matchNum || title.includes(q) || summary.includes(q) || saga.includes(q) || matchChar || matchUnit;
    }
    return true;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} / ${window.appState.episodes.length}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results-banner" style="grid-column: 1/-1;">
        <h3>${I18N_EP[lang].no_results_title}</h3>
        <p>${I18N_EP[lang].no_results_desc}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(ep => {
    const title = lang === 'es' ? ep.title_es : ep.title_en;
    const saga = lang === 'es' ? ep.saga_es : ep.saga_en;
    const summary = lang === 'es' ? ep.summary_es : ep.summary_en;
    const cleanSummary = summary.replace(/^\/\/.*?\n/, '').slice(0, 140) + '...';

    return `
      <div class="mecha-card episode-card">
        <div class="card-header-status">
          <div class="card-faction-badge">
            <img src="${ep.faction_logo}" class="card-faction-icon" alt="Faction">
            <span class="faction-tag">// LOG #${String(ep.episode_number).padStart(2, '0')}</span>
          </div>
          <span class="badge-tag" style="border-color: var(--skull-amber); color: var(--skull-amber);">
            EP ${ep.episode_number}
          </span>
        </div>

        <div class="card-image-wrap" onclick="openEpisodeDossier('${ep.id}')" style="position:relative; cursor:pointer;">
          <img src="${ep.thumbnail}" alt="${title}" loading="lazy" style="transform: scaleX(-1);">
          <div class="image-overlay-hud"></div>
        </div>

        <div class="card-body">
          <div class="card-title-group">
            <h3 class="card-title">${title}</h3>
            <div class="card-alias" style="color: var(--un-cyan); font-size: 0.75rem;">${saga}</div>
          </div>

          <p class="card-summary" style="margin-top: 8px; font-size: 0.8rem; line-height: 1.4; color: var(--text-dim); min-height: 48px;">
            ${cleanSummary}
          </p>

          <div class="card-actions" style="margin-top: 14px;">
            <button class="btn-dossier" onclick="openEpisodeDossier('${ep.id}')" style="width: 100%;">
              ⌖ ${I18N_EP[lang].view_log}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// EPISODE MODAL (MISSION LOG DOSSIER)
// --------------------------------------------------------------------------
function setupEpisodeModal() {
  const modalBackdrop = document.getElementById('episode-modal-backdrop');
  if (!modalBackdrop) return;

  const closeBtn = document.getElementById('btn-close-episode');
  if (closeBtn) closeBtn.addEventListener('click', () => closeEpisodeDossier());

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeEpisodeDossier();
  });

  document.querySelectorAll('.dossier-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = btn.dataset.tab;
      switchEpisodeTab(tabId);
      sessionStorage.setItem('robotech_active_tab', tabId);
      if (window.appState.currentEpisode) {
        const cleanTab = tabId.replace('ep-pane-', '');
        history.replaceState({ modal: 'episode', epId: window.appState.currentEpisode.id, tab: tabId }, '', `?ep=${encodeURIComponent(window.appState.currentEpisode.id)}&tab=${encodeURIComponent(cleanTab)}`);
      }
    });
  });

  window.addEventListener('popstate', () => {
    checkDirectUrlParam();
  });
}

function switchEpisodeTab(tabId) {
  document.querySelectorAll('.dossier-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === tabId);
  });

  const scrollContainer = document.querySelector('.dossier-content-scroll');
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
    if (tabId === 'ep-pane-gallery') {
      scrollContainer.style.overflowY = 'hidden';
      scrollContainer.style.padding = '14px 24px';
    } else {
      scrollContainer.style.overflowY = 'auto';
      scrollContainer.style.padding = '24px';
    }
  }

  window.tacticalAudio?.hover();
}

window.openEpisodeDossier = function(epId, pushHistory = true) {
  window.tacticalAudio?.openDossier();
  const ep = window.appState.episodes.find(e => e.id === epId);
  if (!ep) return;

  window.appState.currentEpisode = ep;
  sessionStorage.setItem('robotech_active_episode', ep.id);
  const lang = window.appState.lang;

  // Header info
  document.getElementById('ep-dossier-title').textContent = lang === 'es' ? ep.title_es : ep.title_en;
  document.getElementById('ep-dossier-subtitle').textContent = `// REGISTRO DE BITÁCORA #${String(ep.episode_number).padStart(2, '0')} // ${lang === 'es' ? ep.saga_es : ep.saga_en}`;
  document.getElementById('ep-dossier-faction-logo').src = ep.faction_logo;

  // Tab 1: Debrief
  const debriefText = lang === 'es' ? ep.summary_es : ep.summary_en;
  document.getElementById('ep-debrief-content').innerHTML = `
    <div class="lore-box">
      <h4>${lang === 'es' ? 'INFORME OPERACIONAL DE COMBATE' : 'COMBAT MISSION DEBRIEFING'}</h4>
      <p style="white-space: pre-line; line-height: 1.6; font-size: 0.88rem;">${debriefText}</p>
    </div>
  `;

  // Tab 2: Personnel
  const personnelPane = document.getElementById('ep-characters-content');
  if (ep.characters && ep.characters.length > 0) {
    personnelPane.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">
        ${ep.characters.map(cid => {
          const formattedName = cid.replace(/_/g, ' ').toUpperCase();
          return `
            <a href="personajes.html?char=${encodeURIComponent(cid)}&from_ep=${encodeURIComponent(ep.id)}&return_tab=characters" class="weapon-card" style="text-decoration:none; display:flex; align-items:center; gap:12px; transition: var(--transition-fast);">
              <span style="font-size: 1.3rem;">👤</span>
              <div>
                <strong style="color:var(--un-cyan); font-family:var(--font-hud); font-size:0.85rem;">${formattedName}</strong>
                <div style="color:var(--text-muted); font-size:0.72rem;">${lang === 'es' ? 'Ver Expediente de Personal →' : 'View Personnel File →'}</div>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    `;
  } else {
    personnelPane.innerHTML = `<p style="color:var(--text-muted); font-style:italic;">${I18N_EP[lang].personnel_empty}</p>`;
  }

  // Tab 3: Units & Ships
  const KNOWN_SHIPS = new Set([
    'sdf1_macross', 'prometheus', 'daedalus', 'armd_platform', 'oberth_destroyer', 
    'sdf2_megaroad', 'dolza_flagship', 'nupetiet_vergnitzs', 'queadol_magdomilla', 
    'thuverl_salan', 'chul_gautsn', 'queadol_quilna', 'tristar', 'tokugawa', 
    'binary_cruiser', 'pulsar_cruiser', 'tirolian_mothership', 'triumvirate_flagship', 
    'bioroid_assault_carrier', 'sdf3_pioneer', 'ikazuchi', 'garfish', 'shimakaze', 
    'sdf4_liberator', 'horizon_t', 'invid_genesis_hive', 'invid_troop_carrier', 'haydonite_dreadnought'
  ]);

  const unitsPane = document.getElementById('ep-units-content');
  if (ep.units && ep.units.length > 0) {
    unitsPane.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
        ${ep.units.map(uid => {
          const isShip = KNOWN_SHIPS.has(uid) || uid.includes('sdf') || uid.includes('garfish') || uid.includes('ikazuchi') || uid.includes('horizon') || uid.includes('flagship') || uid.includes('carrier') || uid.includes('cruiser') || uid.includes('mothership') || uid.includes('destroyer');
          const targetUrl = isShip ? `naves.html?ship=${encodeURIComponent(uid)}` : `mechas.html?mecha=${encodeURIComponent(uid)}`;
          const formattedName = uid.replace(/_/g, ' ').toUpperCase();
          return `
            <a href="${targetUrl}&from_ep=${encodeURIComponent(ep.id)}&return_tab=units" class="weapon-card" style="text-decoration:none; display:flex; align-items:center; gap:12px; transition: var(--transition-fast);">
              <span style="font-size: 1.3rem;">${isShip ? '⚓' : '⚔'}</span>
              <div>
                <strong style="color:var(--skull-amber); font-family:var(--font-hud); font-size:0.85rem;">${formattedName}</strong>
                <div style="color:var(--text-muted); font-size:0.72rem;">${isShip ? (lang === 'es' ? 'Ver Ficha Naval →' : 'View Naval Record →') : (lang === 'es' ? 'Ver Dossier Técnico →' : 'View Mecha Dossier →')}</div>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    `;
  } else {
    unitsPane.innerHTML = `<p style="color:var(--text-muted); font-style:italic;">${I18N_EP[lang].units_empty}</p>`;
  }

  // Tab 4: Gallery Carousel
  const galleryPane = document.getElementById('ep-pane-gallery');
  const images = (ep.gallery && ep.gallery.length > 0) ? ep.gallery : [{ url: ep.thumbnail, title_es: 'Escena de Episodio', title_en: 'Episode Frame' }];

  window.currentCarousel = {
    images: images,
    currentIndex: 0,
    lang: lang
  };

  const initialImg = images[0];
  const initialTitle = lang === 'es' ? initialImg.title_es : initialImg.title_en;

  galleryPane.innerHTML = `
    <div class="tactical-carousel">
      <div class="carousel-viewport" onclick="window.zoomCurrentCarousel()">
        <button class="carousel-nav-btn prev" onclick="event.stopPropagation(); window.stepCarousel(-1)">‹</button>
        <img id="carousel-main-img" class="carousel-main-image" src="${initialImg.url}" alt="${initialTitle}">
        <button class="carousel-nav-btn next" onclick="event.stopPropagation(); window.stepCarousel(1)">›</button>
        <div id="carousel-counter" class="carousel-slide-counter">01 / ${String(images.length).padStart(2, '0')}</div>
        <div class="carousel-caption-bar">
          <div id="carousel-title" class="carousel-caption-title">${initialTitle}</div>
          <div id="carousel-type" class="carousel-caption-type">[${I18N_EP[lang].mirrored_notice}] ${I18N_EP[lang].zoom_hint}</div>
        </div>
      </div>

      <div class="carousel-thumbs-strip" id="carousel-thumbs-track">
        ${images.map((img, idx) => `
          <div class="carousel-thumb-item ${idx === 0 ? 'active' : ''}" onclick="window.setCarouselIndex(${idx})" id="carousel-thumb-${idx}">
            <img src="${img.url}" alt="Thumb ${idx+1}">
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Reset a la primera pestaña
  switchEpisodeTab('ep-pane-debrief');

  const modalBackdrop = document.getElementById('episode-modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (pushHistory) {
    const newUrl = `${window.location.pathname}?ep=${encodeURIComponent(ep.id)}`;
    history.pushState({ modal: 'episode', epId: ep.id }, '', newUrl);
  }
};

window.closeEpisodeDossier = function(updateHistory = true) {
  window.tacticalAudio?.click();
  const modalBackdrop = document.getElementById('episode-modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  sessionStorage.removeItem('robotech_active_episode');
  sessionStorage.removeItem('robotech_active_tab');

  if (updateHistory) {
    history.pushState(null, '', window.location.pathname);
  }
};

// --------------------------------------------------------------------------
// CAROUSEL & LIGHTBOX CONTROLS
// --------------------------------------------------------------------------
window.stepCarousel = function(delta) {
  if (!window.currentCarousel) return;
  window.tacticalAudio?.hover();
  const c = window.currentCarousel;
  c.currentIndex = (c.currentIndex + delta + c.images.length) % c.images.length;
  updateCarouselView();
};

window.setCarouselIndex = function(idx) {
  if (!window.currentCarousel) return;
  window.tacticalAudio?.click();
  window.currentCarousel.currentIndex = idx;
  updateCarouselView();
};

function updateCarouselView() {
  const c = window.currentCarousel;
  const lang = c.lang;
  const img = c.images[c.currentIndex];
  const title = lang === 'es' ? img.title_es : img.title_en;

  const mainImg = document.getElementById('carousel-main-img');
  if (mainImg) {
    mainImg.style.opacity = '0';
    setTimeout(() => {
      mainImg.src = img.url;
      mainImg.alt = title;
      mainImg.style.opacity = '1';
    }, 120);
  }

  const counter = document.getElementById('carousel-counter');
  if (counter) counter.textContent = `${String(c.currentIndex + 1).padStart(2, '0')} / ${String(c.images.length).padStart(2, '0')}`;

  const titleEl = document.getElementById('carousel-title');
  if (titleEl) titleEl.textContent = title;

  document.querySelectorAll('#carousel-thumbs-track .carousel-thumb-item').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === c.currentIndex);
  });
}

window.zoomCurrentCarousel = function() {
  if (!window.currentCarousel) return;
  const c = window.currentCarousel;
  const img = c.images[c.currentIndex];
  const title = c.lang === 'es' ? img.title_es : img.title_en;
  window.openLightbox(img.url, title);
};

function setupLightbox() {
  const lb = document.getElementById('lightbox-backdrop');
  if (lb) {
    lb.addEventListener('click', () => {
      lb.style.display = 'none';
      window.tacticalAudio?.click();
    });
  }
}

window.openLightbox = function(url, caption) {
  const lb = document.getElementById('lightbox-backdrop');
  const img = document.getElementById('lightbox-image');
  const cap = document.getElementById('lightbox-caption');
  if (!lb || !img) return;

  img.src = url;
  if (cap) cap.textContent = caption || '';
  lb.style.display = 'flex';
  window.tacticalAudio?.scan();
};
