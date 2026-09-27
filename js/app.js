/**
 * Robotech / Macross Tactical Codex - Main Application Logic
 * 100% Client-Side Engine for GitHub Pages
 */

const I18N = {
  es: {
    system_title: "ROBOTECH TACTICAL CODEX",
    system_subtitle: "U.N. SPACY ARCHIVE DATABASE // SDF-1 RECON",
    all_units: "TODOS LOS MECHAS",
    destroids: "DESTROIDS",
    veritechs: "VERITECHS / VALKYRIES",
    zentraedi: "FUERZAS ZENTRAEDI",
    search_placeholder: "ESCANEAR BASE DE DATOS (NOMBRE, ARMA, LORE)...",
    results_found: "UNIDADES IDENTIFICADAS",
    no_results_title: "ACCESO DENEGADO / MECHA NO DETECTADO",
    no_results_desc: "No se encontraron registros que coincidan con la telemetría indicada.",
    view_dossier: "FICHA TÉCNICA",
    compare_btn: "COMPARAR",
    compare_ready: "LISTO",
    speed: "VELOCIDAD",
    armor: "BLINDAJE",
    firepower: "FUEGO",
    sensors: "SENSORES",
    range: "ALCANCE",
    mobility: "MANIOBRA",
    tab_overview: "VISIÓN GENERAL Y LORE",
    tab_mdc: "BLINDAJE C.D.M. (LOCALIZACIÓN)",
    tab_weapons: "SISTEMAS DE ARMAS",
    tab_sensors: "SENSORES Y ELECTRÓNICA",
    tab_gallery: "GALERÍA DE PLANOS Y RENDERS",
    admin_btn: "GESTIÓN CRUD LOCAL",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    crew: "Tripulación",
    height: "Altura",
    weight: "Peso",
    engine: "Motor Principal",
    status_online: "EN LÍNEA // SECTOR TÁCTICO ALPHA"
  },
  en: {
    system_title: "ROBOTECH TACTICAL CODEX",
    system_subtitle: "U.N. SPACY ARCHIVE DATABASE // SDF-1 RECON",
    all_units: "ALL UNITS",
    destroids: "DESTROIDS",
    veritechs: "VERITECHS / VALKYRIES",
    zentraedi: "ZENTRAEDI FORCES",
    search_placeholder: "SCAN DATABASE (NAME, WEAPON, LORE)...",
    results_found: "UNITS IDENTIFIED",
    no_results_title: "ACCESS DENIED / MECHA NOT FOUND",
    no_results_desc: "No tactical records matched your telemetry scan query.",
    view_dossier: "DOSSIER SPEC",
    compare_btn: "COMPARE",
    compare_ready: "READY",
    speed: "SPEED",
    armor: "ARMOR",
    firepower: "FIREPOWER",
    sensors: "SENSORS",
    range: "RANGE",
    mobility: "MOBILITY",
    tab_overview: "OVERVIEW & LORE",
    tab_mdc: "M.D.C. ARMOR (LOCATIONS)",
    tab_weapons: "WEAPONS SYSTEMS",
    tab_sensors: "SENSORS & AVIONICS",
    tab_gallery: "BLUEPRINTS & RENDERS",
    admin_btn: "LOCAL CRUD STUDIO",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    crew: "Crew",
    height: "Height",
    weight: "Weight",
    engine: "Main Powerplant",
    status_online: "ONLINE // TACTICAL SECTOR ALPHA"
  }
};

window.appState = {
  lang: localStorage.getItem('robotech_lang') || 'es',
  category: 'all',
  searchQuery: '',
  manifest: null,
  mechaCache: {}
};

document.addEventListener('DOMContentLoaded', async () => {
  checkLocalEnvironment();
  initLanguage();
  initSoundToggle();
  await loadManifest();
  setupCategoryNav();
  setupSearch();
  setupDossierModal();
  setupLightbox();

  if (window.mechaComparator) {
    window.mechaComparator.init();
  }
});

// --------------------------------------------------------------------------
// LOCAL ENVIRONMENT SECURITY CHECK
// --------------------------------------------------------------------------
function checkLocalEnvironment() {
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
  const adminBtn = document.getElementById('admin-link-btn');
  if (adminBtn && isLocal) {
    adminBtn.style.display = 'inline-flex';
  }
}

// --------------------------------------------------------------------------
// LANGUAGE SYSTEM
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
        renderMechas();
        if (window.mechaComparator) {
          window.mechaComparator.renderDock();
        }
      }
    });
  });
}

function updateLangUI() {
  const lang = window.appState.lang;
  document.querySelectorAll('.lang-switch').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  // Actualizar textos traducibles estáticos
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[lang][key]) {
      el.textContent = I18N[lang][key];
    }
  });

  // Placeholder del buscador
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = I18N[lang].search_placeholder;
  }
}

// --------------------------------------------------------------------------
// SOUND TOGGLE
// --------------------------------------------------------------------------
function initSoundToggle() {
  const btn = document.getElementById('audio-switch');
  if (!btn) return;
  const updateBtnText = () => {
    const isMuted = window.tacticalAudio?.isMuted();
    btn.textContent = isMuted 
      ? I18N[window.appState.lang].sound_off 
      : I18N[window.appState.lang].sound_on;
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
async function loadManifest() {
  try {
    const [manifestRes, taxRes] = await Promise.all([
      fetch('data/manifest.json'),
      fetch('data/taxonomies.json').catch(() => null)
    ]);
    if (!manifestRes.ok) throw new Error("Could not load manifest.json");
    window.appState.manifest = await manifestRes.json();
    if (taxRes && taxRes.ok) {
      window.appState.taxonomies = await taxRes.json();
    }
    renderMechas();
  } catch (err) {
    console.error("Error loading manifest:", err);
    const grid = document.getElementById('mecha-grid');
    if (grid) {
      grid.innerHTML = `<div class="no-results-banner"><h3>DATABASE ERROR</h3><p>Could not initialize tactical database.</p></div>`;
    }
  }
}

// --------------------------------------------------------------------------
// FILTERING & SEARCH
// --------------------------------------------------------------------------
function setupCategoryNav() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.appState.category = btn.dataset.category;
      window.tacticalAudio?.hover();
      renderMechas();
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    window.appState.searchQuery = e.target.value.trim().toLowerCase();
    renderMechas();
  });
}

// --------------------------------------------------------------------------
// RENDER MECHA GRID
// --------------------------------------------------------------------------
function getFactionLogo(m) {
  if (m && m.faction_logo) {
    // Convertir nombres heredados
    if (m.faction_logo.endsWith('logo.png')) return 'assets/images/ui/logo_UNSpacy.png';
    return m.faction_logo;
  }

  const facStr = (typeof m?.faction === 'object' ? (m.faction.es || m.faction.en || '') : (m?.faction || '')).trim().toLowerCase();
  const catStr = (m?.category || '').toLowerCase();

  // Buscar coincidencia exacta en taxonomies si están disponibles
  if (window.appState?.taxonomies?.factions) {
    const found = window.appState.taxonomies.factions.find(f => 
      (f.name_es && f.name_es.toLowerCase() === facStr) || 
      (f.name_en && f.name_en.toLowerCase() === facStr) || 
      (f.id && f.id.toLowerCase() === facStr)
    );
    if (found && found.logo) return found.logo;
  }

  // Detección automática por palabras clave
  if (facStr.includes('marte') || facStr.includes('mars') || facStr.includes('pioneer') || facStr.includes('expedicionaria') || facStr.includes('ref')) {
    return 'assets/images/ui/Mars_Base.png';
  }
  if (catStr === 'zentraedi' || facStr.includes('zentraedi') || facStr.includes('zentran') || facStr.includes('meltrandi')) {
    return 'assets/images/ui/logo_zentran.png';
  }
  return 'assets/images/ui/logo_UNSpacy.png';
}

function renderMechas() {
  const grid = document.getElementById('mecha-grid');
  const countEl = document.getElementById('results-count');
  if (!grid || !window.appState.manifest) return;

  const lang = window.appState.lang;
  const category = window.appState.category;
  const q = window.appState.searchQuery;

  const filtered = window.appState.manifest.mechas.filter(m => {
    // Categoría
    if (category !== 'all' && m.category !== category) return false;

    // Búsqueda
    if (q) {
      const name = m.name.toLowerCase();
      const alias = (m.alias || '').toLowerCase();
      const faction = ((m.faction[lang] || m.faction.en || '')).toLowerCase();
      const summary = ((m.summary[lang] || m.summary.en || '')).toLowerCase();
      return name.includes(q) || alias.includes(q) || faction.includes(q) || summary.includes(q);
    }
    return true;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} / ${window.appState.manifest.mechas.length}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results-banner" style="grid-column: 1/-1;">
        <h3>${I18N[lang].no_results_title}</h3>
        <p>${I18N[lang].no_results_desc}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(m => {
    const isCompared = window.mechaComparator?.isSelected(m.id);
    const summaryText = m.summary[lang] || m.summary.en || '';
    const factionText = m.faction[lang] || m.faction.en || '';
    const classText = m.class[lang] || m.class.en || '';
    const factionLogo = getFactionLogo(m);

    // Detección de Mecha Variable / Veritech 3-Modos
    const isVariable = m.is_variable || (m.modes && (m.modes.fighter || m.modes.guardian || m.modes.battloid));
    const modesObj = m.modes || {};
    const fighterImg = (typeof modesObj.fighter === 'string' ? modesObj.fighter : modesObj.fighter?.image) || m.thumbnail;
    const guardianImg = (typeof modesObj.guardian === 'string' ? modesObj.guardian : modesObj.guardian?.image) || m.thumbnail;
    const battloidImg = (typeof modesObj.battloid === 'string' ? modesObj.battloid : modesObj.battloid?.image) || m.thumbnail;

    return `
      <div class="mecha-card">
        <div class="card-header-status">
          <div class="card-faction-badge" title="${factionText}">
            <img src="${factionLogo}" class="card-faction-icon" alt="${factionText}">
            <span class="faction-tag">${factionText}</span>
          </div>
        </div>

        <div class="card-image-wrap" onclick="openDossier('${m.id}')" style="position:relative;">
          <img src="${m.thumbnail}" id="card-img-${m.id}" alt="${m.name}" loading="lazy">
          <div class="image-overlay-hud"></div>
          ${isVariable ? `
            <div class="card-mode-switcher" onclick="event.stopPropagation()">
              <button class="card-mode-btn active" onclick="window.switchCardMode(this, '${m.id}', '${fighterImg}')" title="Modo Caza">CAZA</button>
              <button class="card-mode-btn" onclick="window.switchCardMode(this, '${m.id}', '${guardianImg}')" title="Modo Guardián">GUARDIÁN</button>
              <button class="card-mode-btn" onclick="window.switchCardMode(this, '${m.id}', '${battloidImg}')" title="Modo Battloid">BATTLOID</button>
            </div>
          ` : ''}
        </div>

        <div class="card-body">
          <div class="card-title-group">
            <h3 class="card-title">${m.name}</h3>
            <div class="card-alias">${m.alias || ''}</div>
          </div>

          <p class="card-summary">${summaryText}</p>

          <!-- MINI BARRAS GRÁFICAS DE ESTADÍSTICAS CON UNIDADES REALES -->
          <div class="stats-bars-container">
            <div class="stat-row">
              <span class="stat-label">${I18N[lang].speed}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill speed" style="width: ${Math.min(100, Math.max(12, m.stats.speed > 500 ? m.stats.speed / 40 : m.stats.speed / 3))}%;"></div>
              </div>
              <span class="stat-value" style="width: auto; min-width: 65px; font-size: 0.7rem;">${m.stats.speed} ${m.stats.speed_unit || 'km/h'}</span>
            </div>

            <div class="stat-row">
              <span class="stat-label">${I18N[lang].armor}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill armor" style="width: ${Math.min(100, Math.max(12, m.stats.armor / 4))}%;"></div>
              </div>
              <span class="stat-value" style="width: auto; min-width: 65px; font-size: 0.7rem;">${m.stats.armor} ${m.stats.armor_unit || 'CDM'}</span>
            </div>

            <div class="stat-row">
              <span class="stat-label">${I18N[lang].firepower}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill firepower" style="width: ${Math.min(100, m.stats.firepower)}%;"></div>
              </div>
              <span class="stat-value" style="width: auto; min-width: 65px; font-size: 0.7rem;">${m.stats.firepower} ${m.stats.firepower_unit || 'Pts'}</span>
            </div>

            <div class="stat-row">
              <span class="stat-label">${I18N[lang].sensors}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill sensors" style="width: ${Math.min(100, Math.max(12, m.stats.sensors / 3.5))}%;"></div>
              </div>
              <span class="stat-value" style="width: auto; min-width: 65px; font-size: 0.7rem;">${m.stats.sensors} ${m.stats.sensors_unit || 'km'}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-dossier" onclick="openDossier('${m.id}')">
              ⌖ ${I18N[lang].view_dossier}
            </button>
            <button class="btn-compare-toggle ${isCompared ? 'active' : ''}" 
                    data-id="${m.id}" 
                    onclick="window.mechaComparator.toggleMecha('${m.id}')">
              ${isCompared ? `✓ ${I18N[lang].compare_ready}` : `⚔ ${I18N[lang].compare_btn}`}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// FULL TACTICAL DOSSIER MODAL
// --------------------------------------------------------------------------
function setupDossierModal() {
  const modalBackdrop = document.getElementById('dossier-modal-backdrop');
  const btnClose = document.getElementById('btn-close-dossier');

  if (btnClose) {
    btnClose.addEventListener('click', closeDossier);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeDossier();
    });
  }

  // Tabs de navegación interna del dossier
  document.querySelectorAll('.dossier-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dossier-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
      window.tacticalAudio?.hover();
    });
  });
}

async function openDossier(id) {
  window.tacticalAudio?.openDossier();
  const modalBackdrop = document.getElementById('dossier-modal-backdrop');
  if (!modalBackdrop) return;

  // Carga diferida / Lazy load del JSON completo
  let data = window.appState.mechaCache[id];
  if (!data) {
    try {
      const res = await fetch(`data/mechas/${id}.json`);
      if (!res.ok) throw new Error(`Could not fetch data/mechas/${id}.json`);
      data = await res.json();
      window.appState.mechaCache[id] = data;
    } catch (e) {
      console.error(e);
      alert("Error al cargar datos técnicos del mecha.");
      return;
    }
  }

  populateDossierModal(data);
  modalBackdrop.classList.add('open');
}

function closeDossier() {
  window.tacticalAudio?.click();
  const modalBackdrop = document.getElementById('dossier-modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('open');
}

function populateDossierModal(m) {
  const lang = window.appState.lang;
  window.currentDossierMecha = m;

  // Header
  const factionLogo = getFactionLogo(m);
  const dossierLogo = document.getElementById('dossier-faction-logo');
  if (dossierLogo) {
    if (factionLogo) {
      dossierLogo.src = factionLogo;
      dossierLogo.alt = m.faction[lang] || m.faction.en || 'Faction Insignia';
      dossierLogo.style.display = 'block';
    } else {
      dossierLogo.style.display = 'none';
    }
  }
  document.getElementById('dossier-mecha-name').textContent = m.name;
  document.getElementById('dossier-mecha-alias').textContent = `${m.alias} // ${m.faction[lang] || m.faction.en}`;

  // Reset a la primera pestaña
  document.querySelectorAll('.dossier-tab-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
  document.querySelectorAll('.tab-pane').forEach((p, idx) => p.classList.toggle('active', idx === 0));

  // 1. Tab Overview
  const manifestItem = window.appState?.manifest?.mechas?.find(item => item.id === m.id);
  const heroThumb = manifestItem?.thumbnail || m.thumbnail;

  const isVariable = m.is_variable || (m.modes && (m.modes.fighter || m.modes.guardian || m.modes.battloid));
  const fighterMode = m.modes?.fighter || {};
  const guardianMode = m.modes?.guardian || {};
  const battloidMode = m.modes?.battloid || {};

  const fighterImg = (typeof fighterMode === 'object' ? fighterMode.image : fighterMode) || heroThumb;
  const guardianImg = (typeof guardianMode === 'object' ? guardianMode.image : guardianMode) || heroThumb;
  const battloidImg = (typeof battloidMode === 'object' ? battloidMode.image : battloidMode) || heroThumb;

  const fighterTitle = fighterMode[`name_${lang}`] || fighterMode.name_en || (lang === 'es' ? 'Modo Caza (Jet)' : 'Fighter Mode');
  const guardianTitle = guardianMode[`name_${lang}`] || guardianMode.name_en || (lang === 'es' ? 'Modo Guardián (Gerwalk)' : 'Guardian Mode');
  const battloidTitle = battloidMode[`name_${lang}`] || battloidMode.name_en || (lang === 'es' ? 'Modo Battloid (Humanoide)' : 'Battloid Mode');

  const fighterNotes = fighterMode[`tactical_notes_${lang}`] || fighterMode.tactical_notes_en || '';
  const guardianNotes = guardianMode[`tactical_notes_${lang}`] || guardianMode.tactical_notes_en || '';
  const battloidNotes = battloidMode[`tactical_notes_${lang}`] || battloidMode.tactical_notes_en || '';

  const overviewPane = document.getElementById('pane-overview');
  overviewPane.innerHTML = `
    <div class="overview-grid">
      <div>
        <div style="position:relative;">
          <img src="${heroThumb}" id="dossier-hero-img" class="dossier-hero-img" alt="${m.name}">
        </div>
        <table class="quick-specs-table" id="dossier-specs-table">
          <tr><td>${I18N[lang].crew}:</td><td>${m.crew?.[lang] || m.crew?.en || m.crew || 'N/A'}</td></tr>
          <tr><td>${I18N[lang].height}:</td><td>${m.dimensions?.height?.metric || 'N/A'}</td></tr>
          <tr><td>${I18N[lang].weight}:</td><td>${m.dimensions?.weight?.metric || 'N/A'}</td></tr>
          <tr><td>${I18N[lang].engine}:</td><td>${m.powerplant?.[`engine_${lang}`] || m.powerplant?.engine_en || 'N/A'}</td></tr>
        </table>
      </div>
      <div class="lore-section">
        <div class="lore-box">
          <h4>${lang === 'es' ? 'RESUMEN HISTÓRICO Y PROPÓSITO' : 'HISTORICAL PROFILE & PURPOSE'}</h4>
          <p>${m.lore?.[`overview_${lang}`] || m.lore?.overview_en || ''}</p>
        </div>
        <div class="lore-box">
          <h4>${lang === 'es' ? 'ANÁLISIS TÁCTICO EN COMBATE' : 'TACTICAL DEPLOYMENT ANALYSIS'}</h4>
          <p>${m.lore?.[`tactical_analysis_${lang}`] || m.lore?.tactical_analysis_en || ''}</p>
        </div>
      </div>
    </div>

    ${isVariable && m.modes ? `
      <div class="veritech-modes-showcase">
        <div class="modes-section-banner">
          <span class="modes-section-title">// CONFIGURACIÓN VARIABLE TÁCTICA: TRIPLE MODO DE COMBATE</span>
          <span class="modes-section-tag">TECNOLOGÍA VERITECH MULTI-ROL</span>
        </div>

        <div class="triple-modes-grid">
          <!-- MODO 01: CAZA -->
          <div class="triple-mode-card">
            <div class="triple-mode-header">
              <span class="triple-mode-badge">MODO 01</span>
              <h4 class="triple-mode-title">${lang === 'es' ? 'CAZA / JET' : 'FIGHTER / JET'}</h4>
            </div>
            <div class="triple-mode-img-wrap" onclick="openLightbox('${fighterImg}', '${fighterTitle}')" title="Click para ampliar en alta resolución">
              <img src="${fighterImg}" alt="${fighterTitle}" loading="lazy">
              <span class="triple-mode-zoom-tag">⌖ AMPLIAR</span>
            </div>
            <div class="triple-mode-specs">
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'LONGITUD' : 'LENGTH'}:</span>
                <span class="spec-val">${fighterMode.length || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'ENVERGADURA' : 'WINGSPAN'}:</span>
                <span class="spec-val">${fighterMode.wingspan || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'ALTURA' : 'HEIGHT'}:</span>
                <span class="spec-val">${fighterMode.height || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'VELOCIDAD' : 'SPEED'}:</span>
                <span class="spec-val">${fighterMode.speed || 'N/A'}</span>
              </div>
            </div>
            ${fighterNotes ? `
              <div class="triple-mode-doctrine">
                <strong>${lang === 'es' ? 'ROL OPERACIONAL' : 'TACTICAL DOCTRINE'}:</strong>
                ${fighterNotes}
              </div>
            ` : ''}
          </div>

          <!-- MODO 02: GUARDIÁN -->
          <div class="triple-mode-card">
            <div class="triple-mode-header">
              <span class="triple-mode-badge">MODO 02</span>
              <h4 class="triple-mode-title">${lang === 'es' ? 'GUARDIÁN' : 'GERWALK / GUARDIAN'}</h4>
            </div>
            <div class="triple-mode-img-wrap" onclick="openLightbox('${guardianImg}', '${guardianTitle}')" title="Click para ampliar en alta resolución">
              <img src="${guardianImg}" alt="${guardianTitle}" loading="lazy">
              <span class="triple-mode-zoom-tag">⌖ AMPLIAR</span>
            </div>
            <div class="triple-mode-specs">
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'LONGITUD' : 'LENGTH'}:</span>
                <span class="spec-val">${guardianMode.length || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'ENVERGADURA' : 'WINGSPAN'}:</span>
                <span class="spec-val">${guardianMode.wingspan || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'ALTURA' : 'HEIGHT'}:</span>
                <span class="spec-val">${guardianMode.height || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'VELOCIDAD' : 'SPEED'}:</span>
                <span class="spec-val">${guardianMode.speed || 'N/A'}</span>
              </div>
            </div>
            ${guardianNotes ? `
              <div class="triple-mode-doctrine">
                <strong>${lang === 'es' ? 'ROL OPERACIONAL' : 'TACTICAL DOCTRINE'}:</strong>
                ${guardianNotes}
              </div>
            ` : ''}
          </div>

          <!-- MODO 03: BATTLOID -->
          <div class="triple-mode-card">
            <div class="triple-mode-header">
              <span class="triple-mode-badge">MODO 03</span>
              <h4 class="triple-mode-title">${lang === 'es' ? 'BATTLOID' : 'BATTLOID / HUMANOID'}</h4>
            </div>
            <div class="triple-mode-img-wrap" onclick="openLightbox('${battloidImg}', '${battloidTitle}')" title="Click para ampliar en alta resolución">
              <img src="${battloidImg}" alt="${battloidTitle}" loading="lazy">
              <span class="triple-mode-zoom-tag">⌖ AMPLIAR</span>
            </div>
            <div class="triple-mode-specs">
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'LONGITUD' : 'LENGTH'}:</span>
                <span class="spec-val">${battloidMode.length || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'ENVERGADURA' : 'WINGSPAN'}:</span>
                <span class="spec-val">${battloidMode.wingspan || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'ALTURA' : 'HEIGHT'}:</span>
                <span class="spec-val">${battloidMode.height || 'N/A'}</span>
              </div>
              <div class="triple-mode-spec-row">
                <span class="spec-name">${lang === 'es' ? 'VELOCIDAD' : 'SPEED'}:</span>
                <span class="spec-val">${battloidMode.speed || 'N/A'}</span>
              </div>
            </div>
            ${battloidNotes ? `
              <div class="triple-mode-doctrine">
                <strong>${lang === 'es' ? 'ROL OPERACIONAL' : 'TACTICAL DOCTRINE'}:</strong>
                ${battloidNotes}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    ` : ''}
  `;

  // 2. Tab MDC
  const mdcPane = document.getElementById('pane-mdc');
  const maxMdc = Math.max(...(m.mdc_by_location?.map(loc => loc.mdc) || [250]));
  mdcPane.innerHTML = `
    <div class="mdc-locations-list">
      ${(m.mdc_by_location || []).map(loc => {
        const percent = Math.min(100, Math.round((loc.mdc / maxMdc) * 100));
        const name = loc[`location_${lang}`] || loc.location_en;
        const notes = loc[`notes_${lang}`] || loc.notes_en || '';
        return `
          <div class="mdc-item">
            <div class="mdc-item-header">
              <span class="mdc-location-name">${name}</span>
              <span class="mdc-points">${loc.mdc} C.D.M.</span>
            </div>
            <div class="mdc-progress-track">
              <div class="mdc-progress-bar" style="width: ${percent}%;"></div>
            </div>
            ${notes ? `<span class="mdc-notes">${notes}</span>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // 3. Tab Weapons
  const weaponsPane = document.getElementById('pane-weapons');
  weaponsPane.innerHTML = `
    <div class="weapons-grid">
      ${(m.weapons || []).map(w => {
        const wName = w[`name_${lang}`] || w.name_en;
        const wType = w[`type_${lang}`] || w.type_en;
        const wRate = w[`rate_of_fire_${lang}`] || w.rate_of_fire_en;
        const wPayload = w[`payload_${lang}`] || w.payload_en;
        const wBonus = w[`bonus_${lang}`] || w.bonus_en;
        const wNotes = w[`notes_${lang}`] || w.notes_en;

        return `
          <div class="weapon-card">
            <div class="weapon-card-header">
              <h4 class="weapon-name">${wName}</h4>
              <span class="weapon-type-badge">${wType}</span>
            </div>
            <div class="weapon-specs-row">
              <div class="weapon-spec-item">
                <strong>${lang === 'es' ? 'Mega-Daño:' : 'Mega-Damage:'}</strong>
                <span>${w.damage}</span>
              </div>
              <div class="weapon-spec-item">
                <strong>${lang === 'es' ? 'Alcance:' : 'Range:'}</strong>
                <span>${w.range || w[`range_${lang}`] || 'N/A'}</span>
              </div>
              <div class="weapon-spec-item">
                <strong>${lang === 'es' ? 'Cadencia de Fuego:' : 'Rate of Fire:'}</strong>
                <span>${wRate}</span>
              </div>
              <div class="weapon-spec-item">
                <strong>${lang === 'es' ? 'Munición / Carga:' : 'Payload:'}</strong>
                <span>${wPayload}</span>
              </div>
            </div>
            ${wBonus ? `<p style="font-size:0.8rem; color:var(--skull-amber); margin-top:6px;"><strong>★ ${lang === 'es' ? 'Bonificación' : 'Bonus'}:</strong> ${wBonus}</p>` : ''}
            ${wNotes ? `<p style="font-size:0.78rem; color:var(--text-dim); margin-top:4px;">${wNotes}</p>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // 4. Tab Sensors
  const sensorsPane = document.getElementById('pane-sensors');
  sensorsPane.innerHTML = `
    <div class="equipment-list">
      ${(m.special_equipment || []).map(eq => {
        const eqName = eq[`name_${lang}`] || eq.name_en;
        const eqDesc = eq[`description_${lang}`] || eq.description_en;
        return `
          <div class="equipment-card">
            <h5>${eqName}</h5>
            <p>${eqDesc}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // 5. Tab Gallery (Carrusel Táctico Interactivo)
  const galleryPane = document.getElementById('pane-gallery');
  const images = (m.images && m.images.length > 0) 
    ? m.images 
    : [{ url: m.thumbnail, title_es: m.name, title_en: m.name, type: "render" }];

  window.currentCarousel = {
    images: images,
    currentIndex: 0,
    lang: lang
  };

  const initialImg = images[0];
  const initialTitle = initialImg[`title_${lang}`] || initialImg.title_en || m.name;
  const initialType = (initialImg.type || 'ARCHIVE').toUpperCase();

  galleryPane.innerHTML = `
    <div class="tactical-carousel">
      <div class="carousel-viewport" onclick="window.zoomCurrentCarousel()">
        <button class="carousel-nav-btn prev" onclick="event.stopPropagation(); window.stepCarousel(-1)">‹</button>
        <img id="carousel-main-img" class="carousel-main-image" src="${initialImg.url}" alt="${initialTitle}">
        <button class="carousel-nav-btn next" onclick="event.stopPropagation(); window.stepCarousel(1)">›</button>
        <div id="carousel-counter" class="carousel-slide-counter">01 / ${String(images.length).padStart(2, '0')}</div>
        <div class="carousel-caption-bar">
          <div id="carousel-title" class="carousel-caption-title">${initialTitle}</div>
          <div id="carousel-type" class="carousel-caption-type">[${initialType}] 🔍 CLICK PARA ZOOM</div>
        </div>
      </div>

      <div class="carousel-thumbs-strip" id="carousel-thumbs-track">
        ${images.map((img, idx) => {
          const t = img[`title_${lang}`] || img.title_en || `Slide ${idx+1}`;
          return `
            <div class="carousel-thumb-item ${idx === 0 ? 'active' : ''}" 
                 onclick="window.setCarouselIndex(${idx})" 
                 id="carousel-thumb-${idx}">
              <img src="${img.url}" alt="${t}">
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// CAROUSEL CONTROLLER
// --------------------------------------------------------------------------
window.stepCarousel = function(delta) {
  if (!window.currentCarousel || !window.currentCarousel.images.length) return;
  const total = window.currentCarousel.images.length;
  let newIdx = (window.currentCarousel.currentIndex + delta + total) % total;
  window.setCarouselIndex(newIdx);
};

window.setCarouselIndex = function(idx) {
  if (!window.currentCarousel) return;
  window.currentCarousel.currentIndex = idx;
  const c = window.currentCarousel;
  const img = c.images[idx];
  const title = img[`title_${c.lang}`] || img.title_en || 'Esquema';
  const type = (img.type || 'ARCHIVE').toUpperCase();

  const mainImg = document.getElementById('carousel-main-img');
  const counter = document.getElementById('carousel-counter');
  const titleEl = document.getElementById('carousel-title');
  const typeEl = document.getElementById('carousel-type');

  if (mainImg) {
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
      mainImg.src = img.url;
      mainImg.alt = title;
      mainImg.style.opacity = '1';
    }, 120);
  }

  if (counter) counter.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(c.images.length).padStart(2, '0')}`;
  if (titleEl) titleEl.textContent = title;
  if (typeEl) typeEl.textContent = `[${type}] 🔍 CLICK PARA ZOOM`;

  // Actualizar thumbnails activos
  document.querySelectorAll('.carousel-thumb-item').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === idx);
  });

  const activeThumb = document.getElementById(`carousel-thumb-${idx}`);
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  window.tacticalAudio?.hover();
};

window.zoomCurrentCarousel = function() {
  if (!window.currentCarousel) return;
  const c = window.currentCarousel;
  const img = c.images[c.currentIndex];
  if (img) {
    const title = img[`title_${c.lang}`] || img.title_en || '';
    openLightbox(img.url, title);
  }
};

// --------------------------------------------------------------------------
// LIGHTBOX VIEWER
// --------------------------------------------------------------------------
function setupLightbox() {
  const lb = document.getElementById('lightbox-backdrop');
  if (lb) {
    lb.addEventListener('click', closeLightbox);
  }

  // Soporte de teclas flecha izquierda/derecha para el carrusel
  document.addEventListener('keydown', (e) => {
    const dossierModal = document.getElementById('dossier-modal-backdrop');
    if (dossierModal && dossierModal.classList.contains('open')) {
      if (e.key === 'ArrowLeft') window.stepCarousel(-1);
      if (e.key === 'ArrowRight') window.stepCarousel(1);
      if (e.key === 'Escape') closeDossier();
    }
  });
}

function openLightbox(url, title) {
  window.tacticalAudio?.click();
  const lb = document.getElementById('lightbox-backdrop');
  const lbImg = document.getElementById('lightbox-image');
  const lbCaption = document.getElementById('lightbox-caption');
  if (lb && lbImg) {
    lbImg.src = url;
    if (lbCaption) lbCaption.textContent = title;
    lb.style.display = 'flex';
  }
}

function closeLightbox() {
  const lb = document.getElementById('lightbox-backdrop');
  if (lb) lb.style.display = 'none';
}

// --------------------------------------------------------------------------
// VERITECH 3-MODE INTERACTIVE CONTROLLERS
// --------------------------------------------------------------------------
window.switchCardMode = function(btn, mechaId, imgUrl) {
  if (!btn || !imgUrl) return;
  const container = btn.closest('.card-mode-switcher');
  if (container) {
    container.querySelectorAll('.card-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const img = document.getElementById(`card-img-${mechaId}`);
  if (img) {
    img.style.opacity = '0.35';
    setTimeout(() => {
      img.src = imgUrl;
      img.style.opacity = '1';
    }, 100);
  }
  window.tacticalAudio?.hover();
};

window.switchDossierMode = function(btn, modeKey) {
  const m = window.currentDossierMecha;
  if (!m || !m.modes) return;
  const modeData = m.modes[modeKey];
  if (!modeData) return;

  const lang = window.appState.lang;

  // Actualizar botones de modo
  const container = btn.closest('.veritech-modes-bar');
  if (container) {
    container.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // Actualizar imagen hero
  const heroImg = document.getElementById('dossier-hero-img');
  const targetImg = (typeof modeData === 'object' ? modeData.image : modeData) || m.thumbnail;
  if (heroImg && targetImg) {
    heroImg.style.opacity = '0.2';
    setTimeout(() => {
      heroImg.src = targetImg;
      heroImg.style.opacity = '1';
    }, 120);
  }

  // Actualizar tabla de especificaciones si hay datos detallados del modo
  if (typeof modeData === 'object') {
    const heightRow = document.getElementById('spec-height');
    if (heightRow && modeData.height) {
      heightRow.innerHTML = `<td>${I18N[lang].height}:</td><td>${modeData.height}</td>`;
    }
    const wingspanRow = document.getElementById('spec-wingspan');
    if (wingspanRow && modeData.wingspan) {
      wingspanRow.innerHTML = `<td>${lang === 'es' ? 'Envergadura' : 'Wingspan'}:</td><td>${modeData.wingspan}</td>`;
    }
    const lengthRow = document.getElementById('spec-length');
    if (lengthRow && modeData.length) {
      lengthRow.innerHTML = `<td>${lang === 'es' ? 'Longitud' : 'Length'}:</td><td>${modeData.length}</td>`;
    }
    const speedRow = document.getElementById('spec-speed');
    if (speedRow && modeData.speed) {
      speedRow.innerHTML = `<td>${I18N[lang].speed}:</td><td>${modeData.speed}</td>`;
    }

    // Actualizar notas tácticas del modo
    const notesBox = document.getElementById('dossier-mode-notes');
    const notesText = document.getElementById('dossier-mode-notes-text');
    if (notesBox && notesText) {
      const text = modeData[`tactical_notes_${lang}`] || modeData.tactical_notes_en || '';
      notesText.textContent = text;
      notesBox.style.display = text ? 'block' : 'none';
    }
  }

  window.tacticalAudio?.openDossier();
};

window.openDossier = openDossier;
window.openLightbox = openLightbox;

