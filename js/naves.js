/**
 * ROBOTECH CAPITAL FLEET ARCHIVE - JAVASCRIPT ENGINE
 * Motor táctico de gestión, renderizado y carga perezosa (lazy load) de naves capitales
 * Arquitectura modular con carga asíncrona de .json individuales para rendimiento óptimo
 */

const SHIP_I18N = {
  es: {
    system_title: "ROBOTECH",
    system_subtitle: "CAPITAL FLEET ARCHIVE",
    status_online: "ONLINE // REGISTRO NAVAL SDF-1 // FLOTAS UNIFICADAS",
    admin_btn: "⚙ GESTIÓN CRUD LOCAL",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    cat_all: "TODAS LAS NAVES",
    cat_fortress: "FORTALEZAS",
    cat_cruisers: "CRUCEROS Y DESTRUCTORES",
    cat_carriers: "PORTANAVES Y ASALTO",
    cat_alien: "FLOTAS ALIENÍGENAS",
    search_placeholder: "Buscar por nombre, clase, armamento o saga...",
    records_label: "NAVES EN REGISTRO:",
    btn_dossier: "EXPEDIENTE NAVAL",
    stat_firepower: "FUEGO",
    stat_armor: "BLINDAJE",
    stat_capacity: "CAPACIDAD",
    stat_range: "ALCANCE",
    tab_specs: "ESPECIFICACIONES Y MODOS",
    tab_weapons: "SISTEMAS DE ARMAS Y BLINDAJE",
    tab_history: "REGISTRO HISTÓRICO Y SECCIONES",
    tab_gallery: "GALERÍA NAVAL Y PLANOS",
    no_results_title: "SIN COINCIDENCIAS NAVALES",
    no_results_desc: "Ninguna nave de guerra coincide con los criterios de búsqueda táctica.",
    footer_status: "ESTADO DE TELEMETRÍA: REGISTRO NAVAL // MANDO SUPREMO SDF // TIERRA UNIFICADA",
    
    // Modal & Card labels
    label_class: "CLASE NAVAL",
    label_faction: "FACCIÓN OPERATIVA",
    label_series: "SAGA / CONFLICTO",
    label_commissioned: "BOTADURA / COMISIONADO",
    label_command: "OFICIALES AL MANDO",
    label_complement: "DOTACIÓN Y POBLACIÓN",
    label_airgroup: "ALA EMBARCADA Y MECHAS",
    label_docked: "BUQUES ACOPLADOS / APOYO",
    label_propulsion: "SISTEMA DE PROPULSIÓN",
    label_fold: "SISTEMA HIPERESPACIAL (FOLD)",
    label_defenses: "BLINDAJE Y PROTECCIÓN C.D.M.",
    label_shields: "BARRERAS Y DEFENSAS DE ENERGÍA",
    label_dimensions: "DIMENSIONES ESTRUCTURALES",
    label_length: "ESLORA (LARGO)",
    label_width: "MANGA (ANCHO)",
    label_height: "PUNTAL (ALTURA)",
    label_mass: "DESPLAZAMIENTO (MASA)",
    label_modes: "CONFIGURACIONES MODULARES TRANSFORMABLES",
    mode_cruiser: "MODO CRUCERO",
    mode_attack: "MODO ATAQUE",
    label_weapons_title: "BATERÍAS Y SISTEMAS DE COMBATE",
    label_damage: "DAÑO NOMINAL",
    label_effective_range: "ALCANCE EFECTIVO",
    label_internal_sections: "COMPARTIMIENTOS Y SECCIONES CLAVE",
    label_tactical_lore: "HISTORIAL DE COMBATE Y REGISTRO OPERACIONAL",
    label_tactical_analysis: "ANÁLISIS TÁCTICO EN COMBATE",
    label_gallery_count: "DOCUMENTOS VISUALES ARCHIVADOS",
    btn_zoom: "AMPLIAR EN ALTA RESOLUCIÓN",
    loading_dossier: "DESENCRIPTANDO EXPEDIENTE NAVAL...",

    // Comparador Táctico Naval
    btn_compare: "COMPARAR",
    btn_compare_ready: "LISTO",
    compare_dock_title: "COMPARADOR TÁCTICO:",
    compare_clear_btn: "LIMPIAR",
    compare_now_btn: "COMPARAR AHORA",
    compare_modal_title: "MATRIZ COMPARATIVA DE NAVES CAPITALES",
    compare_modal_subtitle: "TELEMETRÍA TÁCTICA FRENTE A FRENTE",
    compare_empty_slot: "SLOT VACÍO",
    compare_max_alert: "Máximo 3 naves para comparar simultáneamente.",
    compare_min_alert: "Selecciona al menos 2 naves para comparar.",
    compare_telemetry_title: "TELEMETRÍA COMPARATIVA (ESCALA TÁCTICA)",
    compare_prop_ratio: "COMPARACIÓN PROPORCIONAL",
    compare_specs_title: "CUADRO TÉCNICO DE ESPECIFICACIONES NAVALES",
    compare_leader: "LÍDER"
  },
  en: {
    system_title: "ROBOTECH",
    system_subtitle: "CAPITAL FLEET ARCHIVE",
    status_online: "ONLINE // SDF-1 NAVAL REGISTRY // UNIFIED FLEETS",
    admin_btn: "⚙ LOCAL CRUD STUDIO",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    cat_all: "ALL CAPITAL SHIPS",
    cat_fortress: "SUPER FORTRESSES",
    cat_cruisers: "CRUISERS & DESTROYERS",
    cat_carriers: "CARRIERS & ASSAULT",
    cat_alien: "ALIEN WARSHIPS",
    search_placeholder: "Search by name, class, weaponry or saga...",
    records_label: "ACTIVE WARSHIPS:",
    btn_dossier: "NAVAL DOSSIER",
    stat_firepower: "FIREPOWER",
    stat_armor: "ARMOR",
    stat_capacity: "CAPACITY",
    stat_range: "RANGE",
    tab_specs: "SPECS & MODULAR MODES",
    tab_weapons: "WEAPONS & ARMOR SYSTEMS",
    tab_history: "SERVICE LOG & SECTIONS",
    tab_gallery: "NAVAL GALLERY & BLUEPRINTS",
    no_results_title: "NO NAVAL MATCHES FOUND",
    no_results_desc: "No capital warship matches the current tactical search parameters.",
    footer_status: "TELEMETRY STATUS: NAVAL REGISTRY // SDF HIGH COMMAND // UNITED EARTH",
    
    // Modal & Card labels
    label_class: "WARSHIP CLASS",
    label_faction: "OPERATIONAL FACTION",
    label_series: "SAGA / CONFLICT",
    label_commissioned: "COMMISSION DATE / LAUNCH",
    label_command: "COMMANDING OFFICERS",
    label_complement: "CREW & POPULATION",
    label_airgroup: "CARRIER AIR WING & MECHA",
    label_docked: "DOCKED VESSELS / AUXILIARY",
    label_propulsion: "PROPULSION SYSTEM",
    label_fold: "SPACE FOLD DRIVE",
    label_defenses: "M.D.C. ARMOR & PLATING",
    label_shields: "ENERGY BARRIERS & SHIELDS",
    label_dimensions: "STRUCTURAL DIMENSIONS",
    label_length: "LENGTH OVERALL",
    label_width: "BEAM (WIDTH)",
    label_height: "HEIGHT OVERALL",
    label_mass: "DISPLACEMENT (MASS)",
    label_modes: "MODULAR RECONFIGURABLE MODES",
    mode_cruiser: "CRUISER MODE",
    mode_attack: "ATTACK MODE",
    label_weapons_title: "BATTERIES & COMBAT SYSTEMS",
    label_damage: "NOMINAL DAMAGE",
    label_effective_range: "EFFECTIVE RANGE",
    label_internal_sections: "KEY COMPARTMENTS & SECTIONS",
    label_tactical_lore: "COMBAT HISTORY & OPERATIONAL LOG",
    label_tactical_analysis: "TACTICAL BATTLEFIELD ANALYSIS",
    label_gallery_count: "ARCHIVED VISUAL INTEL",
    btn_zoom: "ENLARGE IN HIGH RESOLUTION",
    loading_dossier: "DECRYPTING NAVAL DOSSIER...",

    // Capital Ships Tactical Comparator
    btn_compare: "COMPARE",
    btn_compare_ready: "READY",
    compare_dock_title: "TACTICAL COMPARATOR:",
    compare_clear_btn: "CLEAR",
    compare_now_btn: "COMPARE NOW",
    compare_modal_title: "CAPITAL FLEET COMPARATIVE MATRIX",
    compare_modal_subtitle: "HEAD-TO-HEAD TACTICAL TELEMETRY",
    compare_empty_slot: "EMPTY SLOT",
    compare_max_alert: "Maximum 3 capital ships to compare simultaneously.",
    compare_min_alert: "Select at least 2 capital ships to compare.",
    compare_telemetry_title: "COMPARATIVE TELEMETRY (TACTICAL SCALE)",
    compare_prop_ratio: "PROPORTIONAL RATIO",
    compare_specs_title: "NAVAL TECHNICAL SPECIFICATIONS MATRIX",
    compare_leader: "LEADER"
  }
};

window.shipState = {
  lang: localStorage.getItem('robotech_lang') || 'es',
  category: 'all',
  searchQuery: '',
  manifest: null,
  cache: {}, // Almacén en memoria de data/naves/{id}.json
  currentCarouselIndex: 0,
  activeShipData: null,
  selectedMode: 'cruiser'
};

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initSoundToggle();
  setupCategoryNav();
  setupSearch();
  setupModalEvents();
  checkLocalAdmin();
  if (window.shipComparator) {
    window.shipComparator.init();
  }
  loadManifest();
});

// --------------------------------------------------------------------------
// IDIOMA Y CONFIGURACIÓN BILINGÜE
// --------------------------------------------------------------------------
function initLanguage() {
  const currentLang = window.shipState.lang;
  updateStaticTexts(currentLang);

  document.querySelectorAll('.lang-switch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
      const selected = btn.dataset.lang;
      window.shipState.lang = selected;
      localStorage.setItem('robotech_lang', selected);
      document.querySelectorAll('.lang-switch').forEach(b => b.classList.toggle('active', b.dataset.lang === selected));
      updateStaticTexts(selected);
      renderShips();
      if (window.shipState.activeShipData) {
        populateShipModal(window.shipState.activeShipData);
      }
      if (window.shipComparator) {
        window.shipComparator.updateCardButtons();
        window.shipComparator.renderDock();
        if (document.getElementById('compare-modal-backdrop')?.classList.contains('open')) {
          window.shipComparator.renderCompareModal();
        }
      }
      window.tacticalAudio?.click();
    });
  });
}

function updateStaticTexts(lang) {
  const dict = SHIP_I18N[lang] || SHIP_I18N.es;
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
    const lang = window.shipState.lang;
    btn.textContent = isMuted ? SHIP_I18N[lang].sound_off : SHIP_I18N[lang].sound_on;
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
// CARGA LIGERA DEL MANIFIESTO (METADATOS RESUMIDOS)
// --------------------------------------------------------------------------
async function loadManifest() {
  try {
    const res = await fetch('data/manifest_naves.json');
    if (!res.ok) throw new Error("Could not load manifest_naves.json");
    window.shipState.manifest = await res.json();
    renderShips();
  } catch (err) {
    console.error("Error loading capital ships manifest:", err);
    const grid = document.getElementById('naves-grid');
    if (grid) {
      grid.innerHTML = `<div class="no-results-banner"><h3>DATABASE ERROR</h3><p>Could not initialize capital fleet archive.</p></div>`;
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
      window.shipState.category = btn.dataset.category;
      window.tacticalAudio?.hover();
      renderShips();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', (e) => {
    window.shipState.searchQuery = e.target.value.trim().toLowerCase();
    renderShips();
  });
}

// --------------------------------------------------------------------------
// RENDERIZADO DE TARJETAS DE NAVES CAPITALES
// --------------------------------------------------------------------------
function renderShips() {
  const grid = document.getElementById('naves-grid');
  const countEl = document.getElementById('results-count');
  if (!grid || !window.shipState.manifest) return;

  const lang = window.shipState.lang;
  const dict = SHIP_I18N[lang] || SHIP_I18N.es;
  const cat = window.shipState.category;
  const q = window.shipState.searchQuery;

  const filtered = window.shipState.manifest.ships.filter(s => {
    if (cat !== 'all' && s.category !== cat) return false;
    if (q) {
      const name = (s.name || '').toLowerCase();
      const className = ((s.class_name?.[lang] || s.class_name?.en || '')).toLowerCase();
      const faction = ((s.faction?.[lang] || s.faction?.en || '')).toLowerCase();
      const summary = ((s.summary?.[lang] || s.summary?.en || '')).toLowerCase();
      const series = ((s.series?.[lang] || s.series?.en || '')).toLowerCase();
      return name.includes(q) || className.includes(q) || faction.includes(q) || summary.includes(q) || series.includes(q);
    }
    return true;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} / ${window.shipState.manifest.ships.length}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results-banner" style="grid-column: 1/-1;">
        <h3>${dict.no_results_title}</h3>
        <p>${dict.no_results_desc}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(s => {
    const classNameText = s.class_name?.[lang] || s.class_name?.en || '';
    const factionText = s.faction?.[lang] || s.faction?.en || '';
    const seriesText = s.series?.[lang] || s.series?.en || '';
    const summaryText = s.summary?.[lang] || s.summary?.en || '';
    const stats = s.stats || { firepower: 95, armor: 95, capacity: 90, range: 90 };

    return `
      <div class="mecha-card">
        <div class="card-header-status">
          <div class="card-faction-badge" title="${factionText}">
            <img src="${s.faction_logo || 'assets/images/ui/logo_UNSpacy.png'}" class="card-faction-icon" alt="${factionText}">
            <span class="faction-tag">${factionText}</span>
          </div>
          <span class="card-category-tag">${s.is_modular ? 'MODULAR // TRANSFORMABLE' : 'CAPITAL SHIP'}</span>
        </div>

        <div class="card-image-wrap" onclick="openShipDossier('${s.id}')" style="position:relative; height: 260px; cursor:pointer;">
          <img src="${s.thumbnail}" alt="${s.name}" loading="lazy" style="object-position: center center;">
          <div class="image-overlay-hud"></div>
          <div class="card-badge-overlay" style="position:absolute; bottom:10px; right:10px; background:rgba(6,16,29,0.85); border:1px solid var(--un-cyan); padding:3px 8px; font-family:var(--font-hud); font-size:0.7rem; color:var(--un-cyan); letter-spacing:1px; border-radius:2px;">
            CLASE: ${s.category.toUpperCase()}
          </div>
        </div>

        <div class="card-body">
          <div class="card-title-group">
            <h3 class="card-title">${s.name}</h3>
            <div class="card-alias">${classNameText}</div>
          </div>

          <div style="margin-bottom: 8px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--hud-amber); letter-spacing: 0.8px;">
            ⌖ ${seriesText}
          </div>

          <p class="card-summary">${summaryText}</p>

          <div class="stats-bars-container">
            <div class="stat-row">
              <span class="stat-label">${dict.stat_firepower}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill firepower" style="width: ${stats.firepower}%;"></div>
              </div>
              <span class="stat-value">${stats.firepower}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${dict.stat_armor}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill armor" style="width: ${stats.armor}%;"></div>
              </div>
              <span class="stat-value">${stats.armor}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${dict.stat_capacity}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill speed" style="width: ${stats.capacity}%;"></div>
              </div>
              <span class="stat-value">${stats.capacity}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${dict.stat_range}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill sensors" style="width: ${stats.range}%;"></div>
              </div>
              <span class="stat-value">${stats.range}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-dossier" onclick="openShipDossier('${s.id}')">
              <span>⌖</span> ${dict.btn_dossier}
            </button>
            <button class="btn-compare-toggle ${window.shipComparator && window.shipComparator.isSelected(s.id) ? 'active' : ''}" 
                    data-id="${s.id}" 
                    onclick="window.shipComparator && window.shipComparator.toggleShip('${s.id}')">
              ${window.shipComparator && window.shipComparator.isSelected(s.id) ? `✓ ${dict.btn_compare_ready}` : `⚔ ${dict.btn_compare}`}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.mecha-card').forEach(c => {
    c.addEventListener('mouseenter', () => window.tacticalAudio?.hover());
  });

  if (window.shipComparator) {
    window.shipComparator.updateCardButtons();
  }
}

// --------------------------------------------------------------------------
// APERTURA Y CARGA MODULAR DEL DOSSIER INDIVIDUAL (LAZY LOAD)
// --------------------------------------------------------------------------
async function openShipDossier(shipId) {
  window.tacticalAudio?.openDossier ? window.tacticalAudio.openDossier() : window.tacticalAudio?.click();
  const modalBackdrop = document.getElementById('ship-dossier-modal-backdrop');
  if (!modalBackdrop) return;

  // Si no está en caché, buscarlo por fetch
  if (!window.shipState.cache[shipId]) {
    try {
      const res = await fetch(`data/naves/${shipId}.json`);
      if (!res.ok) throw new Error(`Could not load data/naves/${shipId}.json`);
      window.shipState.cache[shipId] = await res.json();
    } catch (err) {
      console.warn(`Fetch to data/naves/${shipId}.json failed, checking manifest:`, err);
      const fallbackShip = window.shipState.manifest?.ships?.find(s => s.id === shipId);
      if (fallbackShip) {
        window.shipState.cache[shipId] = fallbackShip;
      } else {
        alert("Error al cargar el expediente naval militar.");
        return;
      }
    }
  }

  const shipData = window.shipState.cache[shipId];
  window.shipState.activeShipData = shipData;
  window.shipState.selectedMode = 'cruiser'; // Por defecto Crucero
  populateShipModal(shipData);

  modalBackdrop.classList.add('open');
  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeShipDossier() {
  window.tacticalAudio?.click();
  const modalBackdrop = document.getElementById('ship-dossier-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('open');
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// --------------------------------------------------------------------------
// POBLADO DINÁMICO DE PESTAÑAS DEL DOSSIER
// --------------------------------------------------------------------------
function populateShipModal(s) {
  const lang = window.shipState.lang;
  const dict = SHIP_I18N[lang] || SHIP_I18N.es;

  // Reset a primera pestaña
  document.querySelectorAll('#ship-dossier-modal-backdrop .dossier-tab-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
  document.querySelectorAll('#ship-dossier-modal-backdrop .tab-pane').forEach((p, idx) => p.classList.toggle('active', idx === 0));

  // Header del modal
  const nameEl = document.getElementById('ship-dossier-name');
  const classEl = document.getElementById('ship-dossier-class');
  const logoEl = document.getElementById('ship-dossier-faction-logo');

  if (nameEl) nameEl.textContent = s.name;
  if (classEl) {
    const className = s.class_name?.[lang] || s.class_name?.en || '';
    const faction = s.faction?.[lang] || s.faction?.en || '';
    classEl.textContent = `${className.toUpperCase()} // ${faction.toUpperCase()}`;
  }
  if (logoEl) {
    if (s.faction_logo) {
      logoEl.src = s.faction_logo;
      logoEl.alt = s.faction?.[lang] || s.faction?.en || 'Faction';
      logoEl.style.display = 'block';
    } else {
      logoEl.style.display = 'none';
    }
  }

  // PANE 1: ESPECIFICACIONES Y MODOS
  const paneSpecs = document.getElementById('pane-ship-specs');
  if (paneSpecs) {
    const commissioned = s.commissioned || 'N/A';
    const command = s.commanding_officer?.[lang] || s.commanding_officer?.en || 'N/A';
    const complement = s.complement?.[lang] || s.complement?.en || 'N/A';
    const airGroup = s.air_group?.[lang] || s.air_group?.en || 'N/A';
    const docked = s.docked_vessels?.[lang] || s.docked_vessels?.en || 'N/A';
    const engines = s.propulsion?.engines_es && lang === 'es' ? s.propulsion.engines_es : (s.propulsion?.engines_en || 'N/A');
    const foldSystem = s.propulsion?.fold_system_es && lang === 'es' ? s.propulsion.fold_system_es : (s.propulsion?.fold_system_en || 'N/A');
    const armor = s.defenses?.armor_es && lang === 'es' ? s.defenses.armor_es : (s.defenses?.armor_en || 'N/A');
    const shields = s.defenses?.shields_es && lang === 'es' ? s.defenses.shields_es : (s.defenses?.shields_en || 'N/A');

    // Selector de Modos (si es modular)
    let modesHtml = '';
    if (s.is_modular && s.modes) {
      const modeKey = window.shipState.selectedMode || 'cruiser';
      const currentModeData = s.modes[modeKey] || s.modes.cruiser;
      const modeName = lang === 'es' ? currentModeData.name_es : currentModeData.name_en;
      const modeDesc = lang === 'es' ? currentModeData.desc_es : currentModeData.desc_en;

      modesHtml = `
        <div class="dossier-section" style="margin-bottom:24px; background:rgba(0,240,255,0.03); border:1px solid rgba(0,240,255,0.25); border-radius:4px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
            <h4 style="color:var(--un-cyan); font-family:var(--font-hud); letter-spacing:1px; margin:0; font-size:1rem;">
              ⌖ ${dict.label_modes}
            </h4>
            <div class="mode-toggle-buttons" style="display:inline-flex; gap:8px;">
              <button class="cat-btn ${modeKey === 'cruiser' ? 'active' : ''}" onclick="switchShipMode('cruiser')" style="padding:6px 14px; font-size:0.78rem;">
                🚀 ${dict.mode_cruiser}
              </button>
              <button class="cat-btn ${modeKey === 'attack' ? 'active' : ''}" onclick="switchShipMode('attack')" style="padding:6px 14px; font-size:0.78rem;">
                ⚔ ${dict.mode_attack}
              </button>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:18px; align-items:center;">
            <div style="position:relative; border:1px solid var(--un-cyan); border-radius:4px; overflow:hidden; background:#000; max-height:260px; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="openLightbox('${currentModeData.image}', '${modeName}')">
              <img src="${currentModeData.image}" alt="${modeName}" style="width:100%; height:100%; max-height:260px; object-fit:contain;">
              <div style="position:absolute; bottom:6px; right:8px; background:rgba(0,0,0,0.7); color:var(--un-cyan); font-size:0.68rem; padding:2px 6px; border:1px solid var(--un-cyan);">
                🔍 ${dict.btn_zoom}
              </div>
            </div>

            <div>
              <h5 style="color:var(--hud-amber); font-family:var(--font-hud); font-size:1rem; margin-bottom:8px;">${modeName}</h5>
              <p style="color:#d8e8f5; font-size:0.85rem; line-height:1.5; margin-bottom:12px;">${modeDesc}</p>
              <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; background:rgba(6,16,29,0.8); border:1px solid rgba(0,240,255,0.2); padding:10px; border-radius:3px;">
                <div>
                  <span style="font-size:0.68rem; color:#78909c; display:block; font-family:var(--font-hud);">${dict.label_length}</span>
                  <strong style="color:#fff; font-size:0.85rem;">${currentModeData.length}</strong>
                </div>
                <div>
                  <span style="font-size:0.68rem; color:#78909c; display:block; font-family:var(--font-hud);">${dict.label_width}</span>
                  <strong style="color:#fff; font-size:0.85rem;">${currentModeData.width}</strong>
                </div>
                <div>
                  <span style="font-size:0.68rem; color:#78909c; display:block; font-family:var(--font-hud);">${dict.label_height}</span>
                  <strong style="color:#fff; font-size:0.85rem;">${currentModeData.height}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    paneSpecs.innerHTML = `
      ${modesHtml}

      <div class="dossier-grid-2col" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <!-- Columna Izquierda: Comando y Operaciones -->
        <div class="dossier-panel-box" style="background:rgba(6,16,29,0.6); border:1px solid rgba(0,240,255,0.2); padding:18px; border-radius:4px;">
          <h4 style="color:var(--un-cyan); font-family:var(--font-hud); font-size:0.95rem; margin-bottom:14px; border-bottom:1px solid rgba(0,240,255,0.3); padding-bottom:6px;">
            ⌖ REGISTRO OPERATIVO Y PERSONAL
          </h4>
          <div class="telemetry-row" style="margin-bottom:12px;">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_commissioned}:</span>
            <span style="color:#fff; font-size:0.88rem;">${commissioned}</span>
          </div>
          <div class="telemetry-row" style="margin-bottom:12px;">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_command}:</span>
            <span style="color:#fff; font-size:0.88rem;">${command}</span>
          </div>
          <div class="telemetry-row" style="margin-bottom:12px;">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_complement}:</span>
            <span style="color:#fff; font-size:0.88rem;">${complement}</span>
          </div>
          <div class="telemetry-row" style="margin-bottom:12px;">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_airgroup}:</span>
            <span style="color:#d8e8f5; font-size:0.85rem; line-height:1.4;">${airGroup}</span>
          </div>
          <div class="telemetry-row">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_docked}:</span>
            <span style="color:#d8e8f5; font-size:0.85rem; line-height:1.4;">${docked}</span>
          </div>
        </div>

        <!-- Columna Derecha: Dimensiones y Propulsión -->
        <div class="dossier-panel-box" style="background:rgba(6,16,29,0.6); border:1px solid rgba(0,240,255,0.2); padding:18px; border-radius:4px;">
          <h4 style="color:var(--un-cyan); font-family:var(--font-hud); font-size:0.95rem; margin-bottom:14px; border-bottom:1px solid rgba(0,240,255,0.3); padding-bottom:6px;">
            ⌖ INGENIERÍA Y PROPULSIÓN
          </h4>
          <div class="telemetry-row" style="margin-bottom:12px;">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_dimensions}:</span>
            <span style="color:#fff; font-size:0.88rem;">${s.dimensions?.length || 'N/A'} × ${s.dimensions?.width || 'N/A'} × ${s.dimensions?.height || 'N/A'}</span>
            <span style="display:block; font-size:0.78rem; color:#a2c4d9; margin-top:2px;">${dict.label_mass}: ${s.dimensions?.mass || 'N/A'}</span>
          </div>
          <div class="telemetry-row" style="margin-bottom:12px;">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_propulsion}:</span>
            <span style="color:#d8e8f5; font-size:0.85rem; line-height:1.4;">${engines}</span>
          </div>
          <div class="telemetry-row" style="margin-bottom:12px;">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_fold}:</span>
            <span style="color:#d8e8f5; font-size:0.85rem; line-height:1.4;">${foldSystem}</span>
          </div>
          <div class="telemetry-row" style="margin-bottom:12px;">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_defenses}:</span>
            <span style="color:#d8e8f5; font-size:0.85rem; line-height:1.4;">${armor}</span>
          </div>
          <div class="telemetry-row">
            <span style="font-family:var(--font-hud); font-size:0.75rem; color:#8ab4f8; display:block;">${dict.label_shields}:</span>
            <span style="color:#d8e8f5; font-size:0.85rem; line-height:1.4;">${shields}</span>
          </div>
        </div>
      </div>
    `;
  }

  // PANE 2: SISTEMAS DE ARMAS Y EVALUACIÓN
  const paneWeapons = document.getElementById('pane-ship-weapons');
  if (paneWeapons) {
    const weaponsList = (s.weapons || []).map(w => {
      const wName = lang === 'es' ? w.name_es : w.name_en;
      const wDesc = lang === 'es' ? w.desc_es : w.desc_en;
      return `
        <div style="background:rgba(6,16,29,0.75); border:1px solid rgba(0,240,255,0.2); border-left:3px solid var(--un-cyan); padding:14px; border-radius:3px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
            <h5 style="color:#fff; font-family:var(--font-hud); font-size:0.95rem; margin:0;">${wName}</h5>
            <div style="display:flex; gap:12px; font-size:0.78rem;">
              <span style="color:var(--hud-amber);"><strong>${dict.label_damage}:</strong> ${w.damage}</span>
              <span style="color:var(--un-cyan);"><strong>${dict.label_effective_range}:</strong> ${w.range}</span>
            </div>
          </div>
          <p style="color:#d8e8f5; font-size:0.83rem; line-height:1.45; margin:0;">${wDesc}</p>
        </div>
      `;
    }).join('');

    const stats = s.stats || { firepower: 95, armor: 95, capacity: 90, range: 90 };
    const statsDetail = s.stats_detail || {};

    paneWeapons.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:24px;">
        <div style="background:rgba(6,16,29,0.8); border:1px solid rgba(0,240,255,0.25); padding:14px; border-radius:4px; text-align:center;">
          <span style="font-family:var(--font-hud); font-size:0.8rem; color:#8ab4f8; display:block;">${dict.stat_firepower}</span>
          <div style="font-size:2.2rem; font-family:var(--font-hud); color:var(--hud-amber); margin:4px 0;">${stats.firepower}</div>
          <p style="font-size:0.75rem; color:#a2c4d9; line-height:1.35; margin:0;">${lang === 'es' ? statsDetail.firepower?.desc_es : statsDetail.firepower?.desc_en || ''}</p>
        </div>
        <div style="background:rgba(6,16,29,0.8); border:1px solid rgba(0,240,255,0.25); padding:14px; border-radius:4px; text-align:center;">
          <span style="font-family:var(--font-hud); font-size:0.8rem; color:#8ab4f8; display:block;">${dict.stat_armor}</span>
          <div style="font-size:2.2rem; font-family:var(--font-hud); color:var(--un-cyan); margin:4px 0;">${stats.armor}</div>
          <p style="font-size:0.75rem; color:#a2c4d9; line-height:1.35; margin:0;">${lang === 'es' ? statsDetail.armor?.desc_es : statsDetail.armor?.desc_en || ''}</p>
        </div>
        <div style="background:rgba(6,16,29,0.8); border:1px solid rgba(0,240,255,0.25); padding:14px; border-radius:4px; text-align:center;">
          <span style="font-family:var(--font-hud); font-size:0.8rem; color:#8ab4f8; display:block;">${dict.stat_capacity}</span>
          <div style="font-size:2.2rem; font-family:var(--font-hud); color:#4caf50; margin:4px 0;">${stats.capacity}</div>
          <p style="font-size:0.75rem; color:#a2c4d9; line-height:1.35; margin:0;">${lang === 'es' ? statsDetail.capacity?.desc_es : statsDetail.capacity?.desc_en || ''}</p>
        </div>
        <div style="background:rgba(6,16,29,0.8); border:1px solid rgba(0,240,255,0.25); padding:14px; border-radius:4px; text-align:center;">
          <span style="font-family:var(--font-hud); font-size:0.8rem; color:#8ab4f8; display:block;">${dict.stat_range}</span>
          <div style="font-size:2.2rem; font-family:var(--font-hud); color:#e040fb; margin:4px 0;">${stats.range}</div>
          <p style="font-size:0.75rem; color:#a2c4d9; line-height:1.35; margin:0;">${lang === 'es' ? statsDetail.range?.desc_es : statsDetail.range?.desc_en || ''}</p>
        </div>
      </div>

      <h4 style="color:var(--un-cyan); font-family:var(--font-hud); font-size:1rem; margin-bottom:14px;">
        ⌖ ${dict.label_weapons_title}
      </h4>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${weaponsList}
      </div>
    `;
  }

  // PANE 3: HISTORIAL Y SECCIONES INTERNAS
  const paneHistory = document.getElementById('pane-ship-history');
  if (paneHistory) {
    const overviewText = lang === 'es' ? s.lore?.overview_es : s.lore?.overview_en;
    const tacticalText = lang === 'es' ? s.lore?.tactical_analysis_es : s.lore?.tactical_analysis_en;

    const sectionsList = (s.internal_sections || []).map(sec => {
      const secName = lang === 'es' ? sec.name_es : sec.name_en;
      const secDesc = lang === 'es' ? sec.desc_es : sec.desc_en;
      return `
        <div style="background:rgba(6,16,29,0.7); border:1px solid rgba(0,240,255,0.2); padding:14px; border-radius:4px;">
          <h5 style="color:var(--un-cyan); font-family:var(--font-hud); font-size:0.9rem; margin-bottom:6px;">⚓ ${secName}</h5>
          <p style="color:#d8e8f5; font-size:0.82rem; line-height:1.45; margin:0;">${secDesc}</p>
        </div>
      `;
    }).join('');

    paneHistory.innerHTML = `
      <div style="margin-bottom:24px;">
        <h4 style="color:var(--un-cyan); font-family:var(--font-hud); font-size:1rem; margin-bottom:10px;">
          ⌖ ${dict.label_tactical_lore}
        </h4>
        <p style="color:#d8e8f5; font-size:0.88rem; line-height:1.6; margin-bottom:14px; text-align:justify;">
          ${overviewText || ''}
        </p>
        <h5 style="color:var(--hud-amber); font-family:var(--font-hud); font-size:0.9rem; margin-bottom:8px;">
          ⌖ ${dict.label_tactical_analysis}
        </h5>
        <p style="color:#a2c4d9; font-size:0.85rem; line-height:1.6; text-align:justify;">
          ${tacticalText || ''}
        </p>
      </div>

      <h4 style="color:var(--un-cyan); font-family:var(--font-hud); font-size:1rem; margin-bottom:14px;">
        ⌖ ${dict.label_internal_sections}
      </h4>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
        ${sectionsList}
      </div>
    `;
  }

  // PANE 4: GALERÍA NAVAL Y PLANOS
  const paneGallery = document.getElementById('pane-ship-gallery');
  if (paneGallery) {
    const images = s.images || [];
    window.shipState.currentCarouselIndex = 0;

    if (images.length === 0) {
      paneGallery.innerHTML = `<p style="color:#78909c;">No photo records available.</p>`;
    } else {
      paneGallery.innerHTML = `
        <div class="gallery-wrapper" style="display:flex; flex-direction:column; gap:16px;">
          <div class="carousel-main" style="position:relative; width:100%; height:420px; background:#000; border:1px solid var(--un-cyan); border-radius:4px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
            <img id="carousel-featured-img" src="${images[0].url}" alt="${lang === 'es' ? images[0].title_es : images[0].title_en}" style="max-width:100%; max-height:100%; object-fit:contain; cursor:zoom-in;" onclick="openActiveCarouselLightbox()">
            <div id="carousel-caption" style="position:absolute; bottom:0; left:0; right:0; background:rgba(6,16,29,0.9); padding:10px 16px; border-top:1px solid rgba(0,240,255,0.3); color:#fff; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span id="carousel-title" style="font-family:var(--font-hud); font-size:0.9rem; color:var(--un-cyan); letter-spacing:1px;">${lang === 'es' ? images[0].title_es : images[0].title_en}</span>
                <span id="carousel-type" style="display:block; font-size:0.75rem; color:#8ab4f8;">${lang === 'es' ? images[0].type_es : images[0].type_en}</span>
              </div>
              <button class="cat-btn" onclick="openActiveCarouselLightbox()" style="padding:4px 10px; font-size:0.72rem;">🔍 ${dict.btn_zoom}</button>
            </div>
            <button onclick="prevShipSlide()" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); background:rgba(6,16,29,0.7); border:1px solid var(--un-cyan); color:var(--un-cyan); font-size:1.5rem; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;">❮</button>
            <button onclick="nextShipSlide()" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:rgba(6,16,29,0.7); border:1px solid var(--un-cyan); color:var(--un-cyan); font-size:1.5rem; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;">❯</button>
          </div>

          <div class="carousel-thumbnails" style="display:flex; gap:10px; overflow-x:auto; padding:10px 0;">
            ${images.map((img, idx) => `
              <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="selectShipSlide(${idx})" style="flex:0 0 90px; height:65px; border:${idx === 0 ? '2px solid var(--un-cyan)' : '1px solid rgba(0,240,255,0.3)'}; border-radius:3px; overflow:hidden; cursor:pointer; background:#000;">
                <img src="${img.url}" alt="thumb" style="width:100%; height:100%; object-fit:cover;">
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }
}

// --------------------------------------------------------------------------
// MODAL TABS Y MODO INTERACTIVO
// --------------------------------------------------------------------------
function setupModalEvents() {
  const closeBtn = document.getElementById('btn-close-ship-dossier');
  if (closeBtn) closeBtn.addEventListener('click', closeShipDossier);

  const modalBackdrop = document.getElementById('ship-dossier-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeShipDossier();
    });
  }

  // Tabs switching
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

  // Lightbox close on click
  const lbBackdrop = document.getElementById('lightbox-backdrop');
  if (lbBackdrop) {
    lbBackdrop.addEventListener('click', () => {
      lbBackdrop.style.display = 'none';
      window.tacticalAudio?.click();
    });
  }

  // Tecla ESC para cerrar modales
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const lb = document.getElementById('lightbox-backdrop');
      if (lb && lb.style.display === 'flex') {
        lb.style.display = 'none';
        return;
      }
      closeShipDossier();
    }
  });
}

function switchShipMode(modeKey) {
  window.tacticalAudio?.click();
  window.shipState.selectedMode = modeKey;
  if (window.shipState.activeShipData) {
    populateShipModal(window.shipState.activeShipData);
  }
}

// --------------------------------------------------------------------------
// CARRUSEL Y LIGHTBOX
// --------------------------------------------------------------------------
function selectShipSlide(index) {
  const s = window.shipState.activeShipData;
  if (!s || !s.images || !s.images[index]) return;
  window.shipState.currentCarouselIndex = index;
  window.tacticalAudio?.hover();

  const lang = window.shipState.lang;
  const imgData = s.images[index];

  const featuredImg = document.getElementById('carousel-featured-img');
  const titleEl = document.getElementById('carousel-title');
  const typeEl = document.getElementById('carousel-type');

  if (featuredImg) featuredImg.src = imgData.url;
  if (titleEl) titleEl.textContent = lang === 'es' ? imgData.title_es : imgData.title_en;
  if (typeEl) typeEl.textContent = lang === 'es' ? imgData.type_es : imgData.type_en;

  document.querySelectorAll('.thumb-item').forEach((thumb, idx) => {
    thumb.style.borderColor = idx === index ? 'var(--un-cyan)' : 'rgba(0,240,255,0.3)';
    thumb.style.borderWidth = idx === index ? '2px' : '1px';
  });
}

function prevShipSlide() {
  const s = window.shipState.activeShipData;
  if (!s || !s.images) return;
  let idx = window.shipState.currentCarouselIndex - 1;
  if (idx < 0) idx = s.images.length - 1;
  selectShipSlide(idx);
}

function nextShipSlide() {
  const s = window.shipState.activeShipData;
  if (!s || !s.images) return;
  let idx = window.shipState.currentCarouselIndex + 1;
  if (idx >= s.images.length) idx = 0;
  selectShipSlide(idx);
}

function openActiveCarouselLightbox() {
  const s = window.shipState.activeShipData;
  if (!s || !s.images) return;
  const imgData = s.images[window.shipState.currentCarouselIndex];
  if (imgData) {
    const lang = window.shipState.lang;
    openLightbox(imgData.url, lang === 'es' ? imgData.title_es : imgData.title_en);
  }
}

function openLightbox(url, caption) {
  window.tacticalAudio?.click();
  const lbBackdrop = document.getElementById('lightbox-backdrop');
  const lbImg = document.getElementById('lightbox-image');
  const lbCap = document.getElementById('lightbox-caption');

  if (lbBackdrop && lbImg) {
    lbImg.src = url;
    if (lbCap) lbCap.textContent = caption || '';
    lbBackdrop.style.display = 'flex';
  }
}

// Exportar funciones tácticas al scope global
window.openShipDossier = openShipDossier;
window.closeShipDossier = closeShipDossier;
window.switchShipMode = switchShipMode;
window.selectShipSlide = selectShipSlide;
window.prevShipSlide = prevShipSlide;
window.nextShipSlide = nextShipSlide;
window.openActiveCarouselLightbox = openActiveCarouselLightbox;
window.openLightbox = openLightbox;

// --------------------------------------------------------------------------
// MOTOR COMPARADOR TÁCTICO NAVAL (FLEET COMPARATOR ENGINE)
// --------------------------------------------------------------------------
class ShipComparator {
  constructor() {
    this.selectedIds = [];
    this.maxSelections = 3;
    this.fullShips = {};
  }

  init() {
    this.renderDock();
    this.setupListeners();
  }

  setupListeners() {
    const btnOpen = document.getElementById('btn-open-compare');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        window.tacticalAudio?.scan ? window.tacticalAudio.scan() : window.tacticalAudio?.click();
        this.openCompareModal();
      });
    }

    const btnClear = document.getElementById('btn-clear-compare');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        window.tacticalAudio?.click();
        this.clearAll();
      });
    }

    const btnCloseModal = document.getElementById('btn-close-compare-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        window.tacticalAudio?.click();
        this.closeCompareModal();
      });
    }

    const modalBackdrop = document.getElementById('compare-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.closeCompareModal();
        }
      });
    }
  }

  toggleShip(id) {
    if (this.selectedIds.includes(id)) {
      this.removeShip(id);
    } else {
      this.addShip(id);
    }
  }

  addShip(id) {
    if (this.selectedIds.includes(id)) return;
    const lang = window.shipState?.lang || 'es';
    const dict = SHIP_I18N[lang] || SHIP_I18N.es;
    if (this.selectedIds.length >= this.maxSelections) {
      window.tacticalAudio?.alert();
      alert(dict.compare_max_alert);
      return;
    }
    this.selectedIds.push(id);
    window.tacticalAudio?.addToCompare ? window.tacticalAudio.addToCompare() : window.tacticalAudio?.click();
    this.renderDock();
    this.updateCardButtons();
  }

  removeShip(id) {
    this.selectedIds = this.selectedIds.filter(item => item !== id);
    window.tacticalAudio?.click();
    this.renderDock();
    this.updateCardButtons();
    if (document.getElementById('compare-modal-backdrop')?.classList.contains('open')) {
      if (this.selectedIds.length < 2) {
        this.closeCompareModal();
      } else {
        this.renderCompareModal();
      }
    }
  }

  clearAll() {
    this.selectedIds = [];
    this.renderDock();
    this.updateCardButtons();
    this.closeCompareModal();
  }

  isSelected(id) {
    return this.selectedIds.includes(id);
  }

  updateCardButtons() {
    const lang = window.shipState?.lang || 'es';
    const dict = SHIP_I18N[lang] || SHIP_I18N.es;
    document.querySelectorAll('.btn-compare-toggle').forEach(btn => {
      const id = btn.dataset.id;
      const isSel = this.isSelected(id);
      btn.classList.toggle('active', isSel);
      btn.innerHTML = isSel 
        ? `✓ ${dict.btn_compare_ready}` 
        : `⚔ ${dict.btn_compare}`;
    });
  }

  renderDock() {
    const dock = document.getElementById('comparator-dock');
    if (!dock) return;

    if (this.selectedIds.length === 0) {
      dock.classList.remove('visible');
      return;
    }

    dock.classList.add('visible');
    const slotsContainer = document.getElementById('dock-slots');
    if (!slotsContainer) return;

    const manifestShips = window.shipState?.manifest?.ships || [];
    const lang = window.shipState?.lang || 'es';
    const dict = SHIP_I18N[lang] || SHIP_I18N.es;

    let html = '';
    for (let i = 0; i < this.maxSelections; i++) {
      const id = this.selectedIds[i];
      if (id) {
        const ship = manifestShips.find(s => s.id === id);
        html += `
          <div class="dock-slot filled">
            <img src="${ship?.thumbnail || ''}" class="dock-slot-img" alt="${ship?.name || ''}">
            <span class="dock-slot-name">${ship?.name || id}</span>
            <button class="dock-slot-remove" onclick="window.shipComparator.removeShip('${id}')" title="Quitar">×</button>
          </div>
        `;
      } else {
        html += `
          <div class="dock-slot">
            <span style="font-size: 0.7rem; color: var(--text-dim);">[ ${dict.compare_empty_slot} ]</span>
          </div>
        `;
      }
    }
    slotsContainer.innerHTML = html;

    const btnOpen = document.getElementById('btn-open-compare');
    if (btnOpen) {
      const count = this.selectedIds.length;
      btnOpen.disabled = count < 2;
      btnOpen.style.opacity = count < 2 ? '0.5' : '1';
      btnOpen.textContent = `${dict.compare_now_btn} (${count}/${this.maxSelections})`;
    }
  }

  async openCompareModal() {
    if (this.selectedIds.length < 2) return;
    const modalBackdrop = document.getElementById('compare-modal-backdrop');
    if (!modalBackdrop) return;

    modalBackdrop.classList.add('open');
    await this.loadSelectedFullData();
    this.renderCompareModal();
  }

  closeCompareModal() {
    const modalBackdrop = document.getElementById('compare-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('open');
  }

  async loadSelectedFullData() {
    for (const id of this.selectedIds) {
      if (!this.fullShips[id]) {
        if (window.shipState?.cache?.[id]) {
          this.fullShips[id] = window.shipState.cache[id];
        } else {
          try {
            const res = await fetch(`data/naves/${id}.json`);
            if (res.ok) {
              const data = await res.json();
              this.fullShips[id] = data;
              if (window.shipState) window.shipState.cache[id] = data;
            }
          } catch (e) {
            console.error("Error loading ship for comparison:", id, e);
          }
        }
      }
    }
  }

  renderCompareModal() {
    const container = document.getElementById('compare-content-scroll');
    if (!container) return;

    const lang = window.shipState?.lang || 'es';
    const dict = SHIP_I18N[lang] || SHIP_I18N.es;
    const ships = this.selectedIds.map(id => this.fullShips[id]).filter(Boolean);

    if (ships.length < 2) {
      container.innerHTML = `<p style="padding: 20px; color: var(--text-muted); font-family: var(--font-hud); text-align: center;">${dict.compare_min_alert}</p>`;
      return;
    }

    const colors = ['#00f0ff', '#ff9d00', '#10b981'];

    // 1. Column headers
    let bannerHtml = `<div class="compare-mechas-banner" style="grid-template-columns: repeat(${ships.length}, 1fr);">`;
    ships.forEach((s, idx) => {
      const fLogo = s.faction_logo || 'assets/images/ui/logo_UNSpacy.png';
      const fName = (typeof s.faction === 'object' ? (s.faction[lang] || s.faction.en) : s.faction) || '';
      const cName = (typeof s.class_name === 'object' ? (s.class_name[lang] || s.class_name.en) : s.class_name) || '';
      bannerHtml += `
        <div class="compare-mecha-col" style="border-top: 3px solid ${colors[idx]}">
          <div style="position: relative; display: inline-block;">
            <img src="${s.thumbnail}" class="compare-mecha-thumb" alt="${s.name}">
            <img src="${fLogo}" class="compare-faction-logo" alt="${fName}" title="${fName}">
          </div>
          <h3>${s.name}</h3>
          <div class="col-alias">${cName}</div>
          <div class="col-faction">${fName}</div>
        </div>
      `;
    });
    bannerHtml += `</div>`;

    // 2. Definición de barras tácticas comparativas
    const statConfigs = [
      {
        key: 'firepower',
        title_es: 'POTENCIA DE FUEGO ABSOLUTA',
        title_en: 'ABSOLUTE FIREPOWER RATING',
        unit_es: 'Escala 0-100',
        unit_en: '0-100 Scale',
        getVal: (s) => (typeof s.stats?.firepower === 'number' ? s.stats.firepower : (s.stats?.firepower?.value || 0)),
        formatLabel: (s) => `${typeof s.stats?.firepower === 'number' ? s.stats.firepower : (s.stats?.firepower?.value || 0)} / 100`
      },
      {
        key: 'armor',
        title_es: 'BLINDAJE Y RESISTENCIA ESTRUCTURAL',
        title_en: 'HULL ARMOR & STRUCTURAL RESILIENCE',
        unit_es: 'C.D.M. / Escala',
        unit_en: 'M.D.C. / Scale',
        getVal: (s) => (typeof s.stats?.armor === 'number' ? s.stats.armor : (s.stats?.armor?.value || 0)),
        formatLabel: (s) => `${typeof s.stats?.armor === 'number' ? s.stats.armor : (s.stats?.armor?.value || 0)} / 100`
      },
      {
        key: 'capacity',
        title_es: 'CAPACIDAD DE HANGAR Y TROPAS',
        title_en: 'HANGAR & TROOP COMPLEMENT',
        unit_es: 'Escala 0-100',
        unit_en: '0-100 Scale',
        getVal: (s) => (typeof s.stats?.capacity === 'number' ? s.stats.capacity : (s.stats?.capacity?.value || 0)),
        formatLabel: (s) => `${typeof s.stats?.capacity === 'number' ? s.stats.capacity : (s.stats?.capacity?.value || 0)} / 100`
      },
      {
        key: 'range',
        title_es: 'ALCANCE OPERATIVO Y AUTONOMÍA',
        title_en: 'OPERATIONAL RANGE & ENDURANCE',
        unit_es: 'Escala 0-100',
        unit_en: '0-100 Scale',
        getVal: (s) => (typeof s.stats?.range === 'number' ? s.stats.range : (s.stats?.range?.value || 0)),
        formatLabel: (s) => `${typeof s.stats?.range === 'number' ? s.stats.range : (s.stats?.range?.value || 0)} / 100`
      }
    ];

    let barsHtml = `
      <div class="compare-bars-section">
        <h4>${dict.compare_telemetry_title}</h4>
    `;

    statConfigs.forEach(conf => {
      const title = lang === 'es' ? conf.title_es : conf.title_en;
      const unit = lang === 'es' ? conf.unit_es : conf.unit_en;

      let maxVal = 0;
      let leaderIdx = -1;

      ships.forEach((s, idx) => {
        const val = conf.getVal(s);
        if (val > maxVal) {
          maxVal = val;
          leaderIdx = idx;
        }
      });

      barsHtml += `
        <div class="stat-duel-block">
          <div class="duel-header">
            <span>${title} <strong style="color: var(--skull-amber); font-size: 0.8rem;">[${unit}]</strong></span>
            <span style="font-size: 0.72rem; color: var(--text-dim);">${dict.compare_prop_ratio}</span>
          </div>
          <div class="duel-mecha-bars">
      `;

      ships.forEach((s, idx) => {
        const numVal = conf.getVal(s);
        let barPercent = maxVal > 0 ? Math.round((numVal / maxVal) * 100) : 0;
        if (barPercent < 10 && numVal > 0) barPercent = 10;

        const isLeader = idx === leaderIdx && ships.length > 1;
        const displayLabel = conf.formatLabel(s);

        barsHtml += `
          <div class="duel-bar-row">
            <span class="duel-mecha-name" style="color: ${colors[idx]}">● ${s.name}</span>
            <div class="duel-bar-track">
              <div class="duel-bar-fill" style="width: ${barPercent}%; background: ${colors[idx]};">
                ${numVal > 0 ? numVal : ''}
              </div>
            </div>
            <div class="duel-stat-value" style="width: 240px; text-align: right;">
              <span style="color: #fff;">${displayLabel}</span>
              ${isLeader ? `<span class="winner-badge" style="margin-left: 6px;">▲ ${dict.compare_leader}</span>` : ''}
            </div>
          </div>
        `;
      });

      barsHtml += `
          </div>
        </div>
      `;
    });
    barsHtml += `</div>`;

    // 3. Technical Specs Cross Table
    let tableHtml = `
      <div class="compare-table-section">
        <h4>${dict.compare_specs_title}</h4>
        <table class="specs-duel-table">
          <thead>
            <tr>
              <th>${lang === 'es' ? 'PARÁMETRO NAVAL' : 'NAVAL SPECIFICATION'}</th>
              ${ships.map(s => `<th>${s.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${dict.label_class}</td>
              ${ships.map(s => `<td>${(typeof s.class_name === 'object' ? (s.class_name[lang] || s.class_name.en) : s.class_name) || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_modes}</td>
              ${ships.map(s => `<td>${s.is_modular ? (lang === 'es' ? 'Transformable (Crucero / Modo Ataque)' : 'Modular (Cruiser / Attack Mode)') : (lang === 'es' ? 'Casco Fijo No Transformable' : 'Fixed Hull')}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_dimensions}</td>
              ${ships.map(s => `<td>${lang === 'es' ? 'Eslora' : 'Length'}: ${s.dimensions?.length || 'N/A'} &bull; ${lang === 'es' ? 'Manga' : 'Beam'}: ${s.dimensions?.width || 'N/A'} &bull; ${lang === 'es' ? 'Puntal' : 'Height'}: ${s.dimensions?.height || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_mass}</td>
              ${ships.map(s => `<td>${s.dimensions?.mass || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_complement}</td>
              ${ships.map(s => `<td>${(typeof s.complement === 'object' ? (s.complement[lang] || s.complement.en) : s.complement) || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_airgroup}</td>
              ${ships.map(s => `<td>${(typeof s.air_group === 'object' ? (s.air_group[lang] || s.air_group.en) : s.air_group) || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_docked}</td>
              ${ships.map(s => `<td>${(typeof s.docked_vessels === 'object' ? (s.docked_vessels[lang] || s.docked_vessels.en) : s.docked_vessels) || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_weapons_title}</td>
              ${ships.map(s => `<td>${s.weapons?.[0]?.[lang === 'es' ? 'name_es' : 'name_en'] || s.weapons?.[0]?.name || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_defenses}</td>
              ${ships.map(s => `<td>${s.defenses?.[lang === 'es' ? 'armor_es' : 'armor_en'] || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_shields}</td>
              ${ships.map(s => `<td>${s.defenses?.[lang === 'es' ? 'shields_es' : 'shields_en'] || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_propulsion}</td>
              ${ships.map(s => `<td>${s.propulsion?.[lang === 'es' ? 'engines_es' : 'engines_en'] || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${dict.label_fold}</td>
              ${ships.map(s => `<td>${s.propulsion?.[lang === 'es' ? 'fold_system_es' : 'fold_system_en'] || 'N/A'}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = bannerHtml + barsHtml + tableHtml;
  }
}

// Inicializar instancia global del comparador naval
window.shipComparator = new ShipComparator();

