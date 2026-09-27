/**
 * ROBOTECH PERSONNEL ARCHIVE - JAVASCRIPT ENGINE
 * Motor táctico de gestión, renderizado y carga perezosa (lazy load) de expedientes
 * Carga modular de .json individuales para máxima ligereza y velocidad
 */

const CHAR_I18N = {
  es: {
    system_title: "ROBOTECH",
    system_subtitle: "PERSONNEL ARCHIVE",
    status_online: "ONLINE // EXPEDIENTES DE PERSONAL SDF-1",
    admin_btn: "⚙ GESTIÓN CRUD LOCAL",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    cat_all: "TODOS LOS EXPEDIENTES",
    cat_command: "OFICIALES Y MANDO",
    cat_pilots: "PILOTOS Y ASES",
    cat_zentraedi: "LÍDERES ZENTRAEDI",
    cat_scientists: "CIENTÍFICOS Y CIVILES",
    search_placeholder: "Buscar por nombre, rango, asignación o saga...",
    records_label: "EXPEDIENTES ACTIVOS:",
    btn_dossier: "EXPEDIENTE MILITAR",
    stat_command: "MANDO",
    stat_strategy: "ESTRATEGIA",
    stat_resolve: "RESOLUCIÓN",
    stat_piloting: "PILOTAJE",
    tab_overview: "VISIÓN GENERAL Y BIOGRAFÍA",
    tab_stats: "APTITUDES Y EVALUACIÓN",
    tab_service: "HISTORIAL Y VÍNCULOS",
    tab_gallery: "GALERÍA DE FOTOS",
    no_results_title: "SIN COINCIDENCIAS",
    no_results_desc: "Ningún expediente militar coincide con los criterios de búsqueda táctica.",
    footer_status: "ESTADO DE TELEMETRÍA: ENLACE MILITAR SEGURO // BASE SDF-1 // MACROSS CITY"
  },
  en: {
    system_title: "ROBOTECH",
    system_subtitle: "PERSONNEL ARCHIVE",
    status_online: "ONLINE // SDF-1 PERSONNEL ARCHIVE",
    admin_btn: "⚙ LOCAL CRUD STUDIO",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    cat_all: "ALL DOSSIERS",
    cat_command: "COMMAND & OFFICERS",
    cat_pilots: "PILOTS & ACES",
    cat_zentraedi: "ZENTRAEDI LEADERS",
    cat_scientists: "SCIENTISTS & CIVILIANS",
    search_placeholder: "Search by name, rank, assignment or saga...",
    records_label: "ACTIVE DOSSIERS:",
    btn_dossier: "MILITARY DOSSIER",
    stat_command: "COMMAND",
    stat_strategy: "STRATEGY",
    stat_resolve: "RESOLVE",
    stat_piloting: "PILOTING",
    tab_overview: "OVERVIEW & BIOGRAPHY",
    tab_stats: "APTITUDES & EVALUATION",
    tab_service: "SERVICE HISTORY & BONDS",
    tab_gallery: "PHOTO GALLERY & LOGS",
    no_results_title: "NO MATCHES FOUND",
    no_results_desc: "No military personnel dossier matches the current tactical search parameters.",
    footer_status: "TELEMETRY STATUS: SECURE DEFENSE LINK // SDF-1 BASE // MACROSS CITY"
  }
};

window.charState = {
  lang: localStorage.getItem('robotech_lang') || 'es',
  category: 'all',
  searchQuery: '',
  manifest: null,
  cache: {}, // Cache individual de archivos .json de personajes
  currentCarouselIndex: 0
};

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initSoundToggle();
  setupCategoryNav();
  setupSearch();
  setupModalEvents();
  checkLocalAdmin();
  loadManifest();
});

// --------------------------------------------------------------------------
// IDIOMA Y CONFIGURACIÓN BILINGÜE
// --------------------------------------------------------------------------
function initLanguage() {
  const currentLang = window.charState.lang;
  updateStaticTexts(currentLang);

  document.querySelectorAll('.lang-switch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
      const selected = btn.dataset.lang;
      window.charState.lang = selected;
      localStorage.setItem('robotech_lang', selected);
      document.querySelectorAll('.lang-switch').forEach(b => b.classList.toggle('active', b.dataset.lang === selected));
      updateStaticTexts(selected);
      renderCharacters();
      if (window.currentCharData) {
        populateCharModal(window.currentCharData);
      }
      window.tacticalAudio?.click();
    });
  });
}

function updateStaticTexts(lang) {
  const dict = CHAR_I18N[lang] || CHAR_I18N.es;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = dict.search_placeholder;

  const audioBtn = document.getElementById('audio-switch');
  if (audioBtn) {
    const isMuted = window.tacticalAudio?.isMuted();
    audioBtn.textContent = isMuted ? dict.sound_off : dict.sound_on;
  }
}

function initSoundToggle() {
  const btn = document.getElementById('audio-switch');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.tacticalAudio?.toggleMute();
    window.tacticalAudio?.click();
    const isMuted = window.tacticalAudio?.isMuted();
    const lang = window.charState.lang;
    btn.textContent = isMuted ? CHAR_I18N[lang].sound_off : CHAR_I18N[lang].sound_on;
  });
}

function checkLocalAdmin() {
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
  const adminBtn = document.getElementById('admin-link-btn');
  if (adminBtn && isLocal) {
    adminBtn.style.display = 'inline-flex';
  }
}

// --------------------------------------------------------------------------
// CARGA LIGERA DEL MANIFIESTO (SOLO METADATOS BÁSICOS)
// --------------------------------------------------------------------------
async function loadManifest() {
  try {
    const res = await fetch('data/manifest_personajes.json');
    if (!res.ok) throw new Error("Could not load manifest_personajes.json");
    window.charState.manifest = await res.json();
    renderCharacters();
  } catch (err) {
    console.error("Error loading characters manifest:", err);
    const grid = document.getElementById('personajes-grid');
    if (grid) {
      grid.innerHTML = `<div class="no-results-banner"><h3>DATABASE ERROR</h3><p>Could not initialize personnel archive.</p></div>`;
    }
  }
}

// --------------------------------------------------------------------------
// FILTRADO Y BÚSQUEDA TÁCTICA
// --------------------------------------------------------------------------
function setupCategoryNav() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.charState.category = btn.dataset.category;
      window.tacticalAudio?.hover();
      renderCharacters();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', (e) => {
    window.charState.searchQuery = e.target.value.trim().toLowerCase();
    renderCharacters();
  });
}

// --------------------------------------------------------------------------
// RENDERIZADO DE CARDS DE PERSONAJES
// --------------------------------------------------------------------------
function renderCharacters() {
  const grid = document.getElementById('personajes-grid');
  const countEl = document.getElementById('results-count');
  if (!grid || !window.charState.manifest) return;

  const lang = window.charState.lang;
  const cat = window.charState.category;
  const q = window.charState.searchQuery;

  const filtered = window.charState.manifest.characters.filter(c => {
    if (cat !== 'all' && c.category !== cat) return false;
    if (q) {
      const name = (c.name || '').toLowerCase();
      const jp = (c.japanese_name || '').toLowerCase();
      const rank = ((c.rank?.[lang] || c.rank?.en || '')).toLowerCase();
      const assignment = ((c.assignment?.[lang] || c.assignment?.en || '')).toLowerCase();
      const summary = ((c.summary?.[lang] || c.summary?.en || '')).toLowerCase();
      return name.includes(q) || jp.includes(q) || rank.includes(q) || assignment.includes(q) || summary.includes(q);
    }
    return true;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} / ${window.charState.manifest.characters.length}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results-banner" style="grid-column: 1/-1;">
        <h3>${CHAR_I18N[lang].no_results_title}</h3>
        <p>${CHAR_I18N[lang].no_results_desc}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(c => {
    const rankText = c.rank?.[lang] || c.rank?.en || '';
    const assignmentText = c.assignment?.[lang] || c.assignment?.en || '';
    const factionText = c.faction?.[lang] || c.faction?.en || '';
    const summaryText = c.summary?.[lang] || c.summary?.en || '';
    const stats = c.stats || { command: 90, strategy: 90, resolve: 90, piloting: 70 };

    return `
      <div class="mecha-card">
        <div class="card-header-status">
          <div class="card-faction-badge" title="${factionText}">
            <img src="${c.faction_logo || 'assets/images/ui/logo_UNSpacy.png'}" class="card-faction-icon" alt="${factionText}">
            <span class="faction-tag">${factionText}</span>
          </div>
        </div>

        <div class="card-image-wrap" onclick="openCharDossier('${c.id}')" style="position:relative; height: 260px;">
          <img src="${c.thumbnail}" alt="${c.name}" loading="lazy" style="object-position: center 15%;">
          <div class="image-overlay-hud"></div>
        </div>

        <div class="card-body">
          <div class="card-title-group">
            <h3 class="card-title">${c.name}</h3>
            <div class="card-alias">${rankText}</div>
          </div>

          <div style="margin-bottom: 8px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--un-cyan); letter-spacing: 0.8px;">
            ⌖ ${assignmentText}
          </div>

          <p class="card-summary">${summaryText}</p>

          <div class="stats-bars-container">
            <div class="stat-row">
              <span class="stat-label">${CHAR_I18N[lang].stat_command}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill speed" style="width: ${stats.command}%;"></div>
              </div>
              <span class="stat-value">${stats.command}</span>
            </div>

            <div class="stat-row">
              <span class="stat-label">${CHAR_I18N[lang].stat_strategy}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill armor" style="width: ${stats.strategy}%;"></div>
              </div>
              <span class="stat-value">${stats.strategy}</span>
            </div>

            <div class="stat-row">
              <span class="stat-label">${CHAR_I18N[lang].stat_resolve}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill sensors" style="width: ${stats.resolve}%;"></div>
              </div>
              <span class="stat-value">${stats.resolve}</span>
            </div>

            <div class="stat-row">
              <span class="stat-label">${CHAR_I18N[lang].stat_piloting}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill range" style="width: ${stats.piloting}%;"></div>
              </div>
              <span class="stat-value">${stats.piloting}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-dossier" onclick="openCharDossier('${c.id}')">
              <span>⌖</span> ${CHAR_I18N[lang].btn_dossier}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// CARGA PEREZOSA (LAZY LOAD) DEL .JSON DETALLADO DEL PERSONAJE
// --------------------------------------------------------------------------
async function openCharDossier(charId) {
  window.tacticalAudio?.openDossier();

  let charData = window.charState.cache[charId];
  if (!charData) {
    try {
      const res = await fetch(`data/personajes/${charId}.json`);
      if (!res.ok) throw new Error(`Could not load data/personajes/${charId}.json`);
      charData = await res.json();
      window.charState.cache[charId] = charData;
    } catch (e) {
      console.error(e);
      return;
    }
  }

  populateCharModal(charData);
  const modalBackdrop = document.getElementById('char-dossier-modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.add('open');
}

function closeCharDossier() {
  window.tacticalAudio?.click();
  const modalBackdrop = document.getElementById('char-dossier-modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('open');
}

function populateCharModal(c) {
  const lang = window.charState.lang;
  window.currentCharData = c;

  // Header del Modal
  const logoEl = document.getElementById('char-dossier-faction-logo');
  if (logoEl) {
    logoEl.src = c.faction_logo || 'assets/images/ui/logo_UNSpacy.png';
    logoEl.alt = c.faction?.[lang] || 'Faction Insignia';
    logoEl.style.display = 'block';
  }
  document.getElementById('char-dossier-name').textContent = c.name;
  document.getElementById('char-dossier-rank').textContent = `${c.rank?.[lang] || c.rank?.en} // ${c.assignment?.[lang] || c.assignment?.en}`;

  // Reset a primera pestaña
  document.querySelectorAll('#char-dossier-modal-backdrop .dossier-tab-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
  document.querySelectorAll('#char-dossier-modal-backdrop .tab-pane').forEach((p, idx) => p.classList.toggle('active', idx === 0));

  // 1. Pestaña Visión General y Biografía
  const paneOverview = document.getElementById('pane-char-overview');
  if (paneOverview) {
    paneOverview.innerHTML = `
      <div class="overview-grid">
        <div class="overview-media-col">
          <img src="${c.thumbnail}" class="dossier-hero-img" alt="${c.name}" style="object-position: center 15%;">
          
          <table class="quick-specs-table">
            <tbody>
              <tr>
                <td>${lang === 'es' ? 'Nombre Japonés:' : 'Japanese Name:'}</td>
                <td>${c.japanese_name || 'N/A'}</td>
              </tr>
              <tr>
                <td>${lang === 'es' ? 'Designación / Código:' : 'Callsign / Code:'}</td>
                <td>${c.callsign || 'N/A'}</td>
              </tr>
              <tr>
                <td>${lang === 'es' ? 'Fecha de Nacimiento:' : 'Date of Birth:'}</td>
                <td>${c.birth_date || 'N/A'}</td>
              </tr>
              <tr>
                <td>${lang === 'es' ? 'Lugar de Origen:' : 'Origin / Birthplace:'}</td>
                <td>${c.birth_place?.[lang] || c.birth_place?.en || 'N/A'}</td>
              </tr>
              <tr>
                <td>${lang === 'es' ? 'Grupo Sanguíneo:' : 'Blood Type:'}</td>
                <td>${c.blood_type || 'N/A'}</td>
              </tr>
              <tr>
                <td>${lang === 'es' ? 'Estatura / Peso:' : 'Height / Weight:'}</td>
                <td>${c.height || 'N/A'} // ${c.weight || 'N/A'}</td>
              </tr>
              <tr>
                <td>${lang === 'es' ? 'Saga / Era:' : 'Series / Era:'}</td>
                <td style="color:var(--skull-amber);">${c.series?.[lang] || c.series?.en || 'Macross Saga'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="lore-section">
          <div class="lore-box">
            <h4>${lang === 'es' ? '// EXPEDIENTE BIOGRÁFICO MILITAR' : '// MILITARY BIOGRAPHICAL DOSSIER'}</h4>
            <p>${c.lore?.overview_es && lang === 'es' ? c.lore.overview_es : (c.lore?.overview_en || '')}</p>
          </div>

          <div class="lore-box">
            <h4>${lang === 'es' ? '// EVALUACIÓN TÁCTICA Y DE COMBATE' : '// TACTICAL & COMBAT EVALUATION'}</h4>
            <p>${c.lore?.tactical_analysis_es && lang === 'es' ? c.lore.tactical_analysis_es : (c.lore?.tactical_analysis_en || '')}</p>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Pestaña Aptitudes y Evaluación
  const paneStats = document.getElementById('pane-char-stats');
  if (paneStats) {
    const apt = c.aptitudes || {};
    paneStats.innerHTML = `
      <div class="mdc-locations-list">
        ${Object.keys(apt).map(k => {
          const item = apt[k];
          const label = item[`label_${lang}`] || item.label_en || k;
          const desc = item[`desc_${lang}`] || item.desc_en || '';
          return `
            <div class="mdc-item">
              <div class="mdc-item-header">
                <span class="mdc-location-name">${label}</span>
                <span class="mdc-points">${item.value} / 100 PTS</span>
              </div>
              <div class="mdc-progress-track">
                <div class="mdc-progress-bar" style="width: ${item.value}%;"></div>
              </div>
              <div class="mdc-notes">${desc}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 3. Pestaña Historial y Vínculos
  const paneService = document.getElementById('pane-char-service');
  if (paneService) {
    const serviceList = c.service_record || [];
    const relationsList = c.relationships || [];
    const decorations = c.decorations || [];

    paneService.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <!-- Historial de Servicio -->
        <div class="lore-box">
          <h4>${lang === 'es' ? '// HOJA DE SERVICIO OPERATIVO' : '// OPERATIONAL SERVICE RECORD'}</h4>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
            ${serviceList.map(s => `
              <div style="display: flex; gap: 16px; padding: 8px 12px; background: rgba(0,0,0,0.3); border-left: 3px solid var(--un-cyan); border-radius: 2px;">
                <span style="font-family: var(--font-hud); color: var(--skull-amber); font-size: 0.85rem; width: 110px; flex-shrink: 0;">${s.period}</span>
                <span style="font-size: 0.84rem; color: #fff;">${s[`assignment_${lang}`] || s.assignment_en}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Relaciones Clave -->
        <div class="lore-box">
          <h4>${lang === 'es' ? '// VÍNCULOS TÁCTICOS Y PERSONALES CLAVE' : '// KEY TACTICAL & PERSONAL BONDS'}</h4>
          <div class="equipment-list" style="margin-top: 12px;">
            ${relationsList.map(r => `
              <div class="equipment-card">
                <h5>${r.name} <span style="font-size:0.72rem; color:var(--skull-amber); font-family:var(--font-mono);">[ ${r[`relation_${lang}`] || r.relation_en} ]</span></h5>
                <p>${r[`notes_${lang}`] || r.notes_en}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Condecoraciones -->
        ${decorations.length > 0 ? `
          <div class="lore-box">
            <h4>${lang === 'es' ? '// CONDECORACIONES Y CITAS MILITARES' : '// DECORATIONS & MILITARY CITATIONS'}</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
              ${decorations.map(d => `
                <div style="padding: 6px 12px; background: rgba(255,157,0,0.1); border: 1px solid var(--border-amber); color: var(--skull-amber); font-family: var(--font-mono); font-size: 0.78rem; border-radius: 2px;">
                  🎖 ${d}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // 4. Pestaña Galería Fotográfica y Carrusel
  const paneGallery = document.getElementById('pane-char-gallery');
  if (paneGallery) {
    const images = c.images || [];
    window.charState.currentCarouselIndex = 0;

    if (images.length === 0) {
      paneGallery.innerHTML = `<p style="color:var(--text-muted); padding:20px;">${lang === 'es' ? 'No hay registros fotográficos adicionales.' : 'No additional photographic logs available.'}</p>`;
      return;
    }

    paneGallery.innerHTML = `
      <div class="tactical-carousel">
        <div class="carousel-viewport" id="char-carousel-viewport" onclick="openLightboxCurrent()">
          <img id="char-carousel-main-img" class="carousel-main-image" src="${images[0].url}" alt="${images[0][`title_${lang}`] || images[0].title_en}">
          <div class="carousel-slide-counter" id="char-carousel-counter">01 / ${String(images.length).padStart(2, '0')}</div>
          <div class="carousel-caption-bar">
            <span class="carousel-caption-title" id="char-carousel-caption">${images[0][`title_${lang}`] || images[0].title_en}</span>
            <span class="carousel-caption-type" id="char-carousel-type">${images[0][`type_${lang}`] || images[0].type_en}</span>
          </div>
        </div>

        <button class="carousel-nav-btn prev" onclick="navigateCharCarousel(-1)" title="Foto Anterior">‹</button>
        <button class="carousel-nav-btn next" onclick="navigateCharCarousel(1)" title="Foto Siguiente">›</button>

        <div class="carousel-thumbs-strip">
          ${images.map((img, idx) => `
            <div class="carousel-thumb-item ${idx === 0 ? 'active' : ''}" onclick="selectCharCarouselSlide(${idx})" title="${img[`title_${lang}`] || img.title_en}">
              <img src="${img.url}" alt="${img[`title_${lang}`] || img.title_en}" loading="lazy">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------
// CONTROLADOR DE CARRUSEL Y LIGHTBOX
// --------------------------------------------------------------------------
function navigateCharCarousel(dir) {
  const c = window.currentCharData;
  if (!c || !c.images || c.images.length === 0) return;
  const len = c.images.length;
  let idx = (window.charState.currentCarouselIndex + dir + len) % len;
  selectCharCarouselSlide(idx);
}

function selectCharCarouselSlide(idx) {
  const c = window.currentCharData;
  if (!c || !c.images || !c.images[idx]) return;
  window.charState.currentCarouselIndex = idx;
  const imgData = c.images[idx];
  const lang = window.charState.lang;

  const mainImg = document.getElementById('char-carousel-main-img');
  const counter = document.getElementById('char-carousel-counter');
  const caption = document.getElementById('char-carousel-caption');
  const typeEl = document.getElementById('char-carousel-type');

  if (mainImg) {
    mainImg.style.opacity = '0.2';
    setTimeout(() => {
      mainImg.src = imgData.url;
      mainImg.style.opacity = '1';
    }, 150);
  }

  if (counter) counter.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(c.images.length).padStart(2, '0')}`;
  if (caption) caption.textContent = imgData[`title_${lang}`] || imgData.title_en;
  if (typeEl) typeEl.textContent = imgData[`type_${lang}`] || imgData.type_en;

  document.querySelectorAll('#pane-char-gallery .carousel-thumb-item').forEach((item, i) => {
    item.classList.toggle('active', i === idx);
  });

  window.tacticalAudio?.hover();
}

function openLightboxCurrent() {
  const c = window.currentCharData;
  if (!c || !c.images) return;
  const imgData = c.images[window.charState.currentCarouselIndex];
  if (!imgData) return;
  const lang = window.charState.lang;
  openLightbox(imgData.url, imgData[`title_${lang}`] || imgData.title_en);
}

function openLightbox(url, title) {
  const lb = document.getElementById('lightbox-backdrop');
  const img = document.getElementById('lightbox-image');
  const cap = document.getElementById('lightbox-caption');
  if (lb && img && cap) {
    img.src = url;
    cap.textContent = title || '';
    lb.style.display = 'flex';
    window.tacticalAudio?.openDossier();
  }
}

function closeLightbox() {
  const lb = document.getElementById('lightbox-backdrop');
  if (lb) lb.style.display = 'none';
}

function setupModalEvents() {
  const closeBtn = document.getElementById('btn-close-char-dossier');
  if (closeBtn) closeBtn.addEventListener('click', closeCharDossier);

  const backdrop = document.getElementById('char-dossier-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeCharDossier();
    });
  }

  // Pestañas
  document.querySelectorAll('#char-dossier-modal-backdrop .dossier-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#char-dossier-modal-backdrop .dossier-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#char-dossier-modal-backdrop .tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
      window.tacticalAudio?.hover();
    });
  });

  const lb = document.getElementById('lightbox-backdrop');
  if (lb) lb.addEventListener('click', closeLightbox);
}

function checkLocalAdmin() {
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', ''].indexOf(window.location.hostname) !== -1 || window.location.protocol === 'file:';
  const adminBtn = document.getElementById('admin-link-btn');
  if (adminBtn && isLocal) {
    adminBtn.style.display = 'inline-flex';
  }
}

window.openCharDossier = openCharDossier;
window.closeCharDossier = closeCharDossier;
window.navigateCharCarousel = navigateCharCarousel;
window.selectCharCarouselSlide = selectCharCarouselSlide;
window.openLightboxCurrent = openLightboxCurrent;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
