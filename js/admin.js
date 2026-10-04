/**
 * Robotech Admin Studio Logic
 * Maneja el CRUD local con selectores dinámicos, creación rápida con [+],
 * gestor visual de galería y exportación limpia para GitHub Pages.
 */

let currentManifest = null;
let currentMechaData = null;
let currentTaxonomies = null;
let currentTaxModalType = null;
let currentCharManifest = null;
let currentCharData = null;
let currentShipManifest = null;
let currentShipData = null;
let activeAdminModule = 'mechas';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const modParam = params.get('module') || params.get('section') || 'mechas';
  if (modParam === 'personajes' || modParam === 'characters' || modParam === 'personaje') {
    activeAdminModule = 'characters';
  } else if (modParam === 'naves' || modParam === 'ships' || modParam === 'nave' || modParam === 'flota') {
    activeAdminModule = 'ships';
  } else {
    activeAdminModule = 'mechas';
  }

  setupModuleView(activeAdminModule);
  await loadTaxonomies();

  if (activeAdminModule === 'ships') {
    await loadAdminShipManifest();
    setupShipEventListeners();
    setupShipExportButtons();
    updateLiveShipPreview();
  } else if (activeAdminModule === 'characters') {
    await loadAdminCharManifest();
    setupCharEventListeners();
    setupCharExportButtons();
    updateLiveCharPreview();
  } else {
    await loadAdminManifest();
    setupFormListeners();
    setupExportButtons();
    const select = document.getElementById('select-mecha-to-edit');
    if (select && select.options.length > 1) {
      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change'));
    }
    updateLivePreview();
  }
});

// --------------------------------------------------------------------------
// 1. TAXONOMÍAS DINÁMICAS (Categorías, Facciones, Tipos, Series)
// --------------------------------------------------------------------------
async function loadTaxonomies() {
  try {
    const res = await fetch(`data/taxonomies.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      currentTaxonomies = await res.json();
      localStorage.setItem('robotech_taxonomies', JSON.stringify(currentTaxonomies));
    } else {
      const cached = localStorage.getItem('robotech_taxonomies');
      if (cached) currentTaxonomies = JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Could not load taxonomies from server, using fallback:", e);
    const cached = localStorage.getItem('robotech_taxonomies');
    if (cached) currentTaxonomies = JSON.parse(cached);
  }

  if (!currentTaxonomies) {
    currentTaxonomies = {
      categories: [
        { id: "destroid", label_es: "Destroids", label_en: "Destroids" },
        { id: "veritech", label_es: "Veritechs / Valkyries", label_en: "Veritechs / Valkyries" },
        { id: "zentraedi", label_es: "Fuerzas Zentraedi", label_en: "Zentraedi Forces" }
      ],
      factions: [
        { id: "un_spacy", name_es: "U.N. Spacy", name_en: "U.N. Spacy", logo: "assets/images/ui/logo_UNSpacy.png" },
        { id: "skull_squadron", name_es: "U.N. Spacy - Escuadrón Skull", name_en: "U.N. Spacy - Skull Squadron", logo: "assets/images/ui/logo_UNSpacy.png" },
        { id: "zentraedi_main", name_es: "Flota Principal Zentraedi (Boddole Zer)", name_en: "Zentraedi Main Fleet", logo: "assets/images/ui/logo_zentran.png" },
        { id: "ref_pioneer", name_es: "Fuerza Expedicionaria Robotech (REF / Pioneer)", name_en: "Robotech Expeditionary Force (REF)", logo: "assets/images/ui/Mars_Base.png" },
        { id: "mars_base_division", name_es: "REF - División Marte (Mars Base)", name_en: "REF - Mars Base Division", logo: "assets/images/ui/Mars_Base.png" }
      ],
      vehicle_types: [
        { name_es: "Destroid Antiaéreo No Transformable", name_en: "Non-Transformable Anti-Aircraft Destroid" },
        { name_es: "Destroid de Asalto y Artillería Pesada", name_en: "Heavy Battle & Assault Destroid" },
        { name_es: "Caza Variable Aeroespacial / Mecha Transformable", name_en: "Variable Aerospace Fighter / Transformable Mecha" },
        { name_es: "Cápsula de Combate Bípeda Ligera / Espacial", name_en: "Light Bipedal Combat Pod" }
      ],
      series_eras: [
        { id: "macross", name_es: "La Saga Macross (Primera Guerra Robotech)", name_en: "The Macross Saga" },
        { id: "masters", name_es: "Los Maestros de la Robotech (Segunda Guerra)", name_en: "Robotech Masters" },
        { id: "new_generation", name_es: "La Nueva Generación / Era Invid (Tercera Guerra)", name_en: "The New Generation / Invid Era" }
      ]
    };
  }

  populateTaxonomySelects();
}

function populateTaxonomySelects() {
  // 1. Categorías
  const catSel = document.getElementById('m_category_select');
  if (catSel) {
    catSel.innerHTML = currentTaxonomies.categories.map(c => 
      `<option value="${c.id}">${c.label_es} (${c.label_en})</option>`
    ).join('');

    catSel.onchange = () => {
      checkAutoVariableModes();
      updateLivePreview();
    };
  }

  // 2. Facciones con data-logo y auto-asignación instantánea
  const facSel = document.getElementById('m_faction_select');
  if (facSel) {
    facSel.innerHTML = currentTaxonomies.factions.map(f => 
      `<option value="${f.name_es}" data-en="${f.name_en}" data-logo="${f.logo || ''}">${f.name_es}</option>`
    ).join('');

    // Al cambiar la facción militar, auto-selecciona el logo correspondiente
    facSel.onchange = () => {
      const opt = facSel.selectedOptions[0];
      const logo = opt?.dataset?.logo;
      const logoInp = document.getElementById('m_faction_logo');
      if (logoInp) {
        if (logo) {
          logoInp.value = logo;
        } else {
          const txt = facSel.value.toLowerCase();
          if (txt.includes('marte') || txt.includes('mars')) {
            logoInp.value = 'assets/images/ui/Mars_Base.png';
          } else if (txt.includes('zentraedi') || txt.includes('zentran') || txt.includes('meltrandi')) {
            logoInp.value = 'assets/images/ui/logo_zentran.png';
          } else {
            logoInp.value = 'assets/images/ui/logo_UNSpacy.png';
          }
        }
        updateFactionLogoPreview();
        updateLivePreview();
      }
    };
  }

  // 2b. Catálogo de Logos de Facción en Datalist
  const logoList = document.getElementById('faction_logos_list');
  if (logoList) {
    const knownLogos = new Map();
    knownLogos.set('assets/images/ui/logo_UNSpacy.png', 'Robotech Defense Force / U.N. Spacy');
    knownLogos.set('assets/images/ui/logo_zentran.png', 'Fuerzas Zentraedi / Meltrandi');
    knownLogos.set('assets/images/ui/Mars_Base.png', 'REF - División Marte (Mars Base)');
    
    (currentTaxonomies.factions || []).forEach(f => {
      if (f.logo) knownLogos.set(f.logo, f.name_es);
    });

    logoList.innerHTML = Array.from(knownLogos.entries()).map(([path, name]) => 
      `<option value="${path}">${name}</option>`
    ).join('');
  }

  // 3. Tipos de Vehículo
  const typeSel = document.getElementById('m_type_select');
  if (typeSel) {
    typeSel.innerHTML = currentTaxonomies.vehicle_types.map(t => 
      `<option value="${t.name_es}" data-en="${t.name_en}">${t.name_es}</option>`
    ).join('');

    typeSel.onchange = () => {
      checkAutoVariableModes();
      updateLivePreview();
    };
  }

  // 4. Series / Eras
  const serSel = document.getElementById('m_series_select');
  if (serSel) {
    serSel.innerHTML = currentTaxonomies.series_eras.map(s => 
      `<option value="${s.name_es}" data-en="${s.name_en}">${s.name_es}</option>`
    ).join('');
  }
}

window.checkAutoVariableModes = function() {
  const typeVal = (document.getElementById('m_type_select')?.value || '').toLowerCase();
  const catVal = (document.getElementById('m_category_select')?.value || '').toLowerCase();
  const isVar = catVal === 'veritech' || typeVal.includes('variable') || typeVal.includes('transformable');
  
  if (isVar) {
    toggleVariableModes(true);
  }
};

window.toggleVariableModes = function(forceState) {
  const checkbox = document.getElementById('m_is_variable');
  const section = document.getElementById('veritech-modes-section');
  if (!section) return;

  const active = typeof forceState === 'boolean' ? forceState : (checkbox ? checkbox.checked : false);
  if (checkbox) checkbox.checked = active;

  section.style.display = active ? 'block' : 'none';
  updateLivePreview();
};

window.updateModePreview = function(mode) {
  const inp = document.getElementById(`m_mode_${mode}_img`);
  const prev = document.getElementById(`m_mode_${mode}_preview`);
  if (!inp || !prev) return;
  if (inp.value.trim()) {
    prev.src = inp.value.trim();
    prev.style.display = 'block';
  } else {
    prev.style.display = 'none';
  }
};

// Modal [+] para añadir cualquier opción al instante
window.openAddTaxonomyModal = function(type) {
  currentTaxModalType = type;
  const modal = document.getElementById('taxonomy-modal-backdrop');
  const title = document.getElementById('taxonomy-modal-title');
  const inEs = document.getElementById('new_tax_es');
  const inEn = document.getElementById('new_tax_en');
  const logoGroup = document.getElementById('group_new_tax_logo');
  const logoSel = document.getElementById('new_tax_logo');

  inEs.value = '';
  inEn.value = '';

  if (type === 'faction' && logoGroup && logoSel) {
    logoGroup.style.display = 'block';
    const logos = currentTaxonomies.faction_logos || [
      { id: 'un_spacy', name: 'Robotech Defense Force / U.N. Spacy', file: 'assets/images/ui/logo_UNSpacy.png' },
      { id: 'zentraedi', name: 'Fuerzas Zentraedi', file: 'assets/images/ui/logo_zentran.png' }
    ];
    logoSel.innerHTML = logos.map(l => `<option value="${l.file}">${l.name}</option>`).join('');
  } else if (logoGroup) {
    logoGroup.style.display = 'none';
  }

  const titles = {
    category: 'AÑADIR NUEVA CATEGORÍA',
    faction: 'AÑADIR NUEVA FACCIÓN MILITAR',
    vehicle_type: 'AÑADIR NUEVO TIPO DE VEHÍCULO / NAVE',
    series: 'AÑADIR NUEVA SAGA / ERA ROBOTECH'
  };

  title.textContent = titles[type] || 'AÑADIR NUEVO ELEMENTO';
  modal.style.display = 'flex';
  inEs.focus();
  window.tacticalAudio?.hover();
};

window.closeTaxonomyModal = function() {
  document.getElementById('taxonomy-modal-backdrop').style.display = 'none';
  window.tacticalAudio?.click();
};

window.confirmAddTaxonomy = function() {
  const inEs = document.getElementById('new_tax_es').value.trim();
  const inEn = document.getElementById('new_tax_en').value.trim() || inEs;

  if (!inEs) {
    alert("Por favor introduce al menos el nombre en español.");
    return;
  }

  const slug = inEs.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  if (currentTaxModalType === 'category') {
    currentTaxonomies.categories.push({ id: slug, label_es: inEs, label_en: inEn });
    populateTaxonomySelects();
    document.getElementById('m_category_select').value = slug;
  } else if (currentTaxModalType === 'faction') {
    const chosenLogo = document.getElementById('new_tax_logo')?.value || 'assets/images/ui/logo_UNSpacy.png';
    currentTaxonomies.factions.push({ id: slug, name_es: inEs, name_en: inEn, logo: chosenLogo });
    populateTaxonomySelects();
    document.getElementById('m_faction_select').value = inEs;
    document.getElementById('m_faction_logo').value = chosenLogo;
    updateFactionLogoPreview();
  } else if (currentTaxModalType === 'vehicle_type') {
    currentTaxonomies.vehicle_types.push({ name_es: inEs, name_en: inEn });
    populateTaxonomySelects();
    document.getElementById('m_type_select').value = inEs;
  } else if (currentTaxModalType === 'series') {
    currentTaxonomies.series_eras.push({ id: slug, name_es: inEs, name_en: inEn });
    populateTaxonomySelects();
    document.getElementById('m_series_select').value = inEs;
  }

  localStorage.setItem('robotech_taxonomies', JSON.stringify(currentTaxonomies));
  window.closeTaxonomyModal();
  updateLivePreview();
};

// --------------------------------------------------------------------------
// 2. CARGA Y EDICIÓN DE MECHAS
// --------------------------------------------------------------------------
async function loadAdminManifest() {
  try {
    const res = await fetch('data/manifest.json');
    if (!res.ok) throw new Error("Could not load manifest");
    currentManifest = await res.json();
    populateMechaSelect();
  } catch (e) {
    console.error("Error loading manifest:", e);
  }
}

function populateMechaSelect() {
  const select = document.getElementById('select-mecha-to-edit');
  if (!select || !currentManifest) return;

  select.innerHTML = '<option value="">-- SELECCIONAR MECHA EXISTENTE --</option>';
  currentManifest.mechas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.name} (${m.alias || m.id})`;
    select.appendChild(opt);
  });

  select.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (id) {
      await loadMechaIntoForm(id);
    } else {
      resetForm();
    }
  });

  const btnNew = document.getElementById('btn-new-mecha');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      resetForm();
      select.value = '';
    });
  }
}

async function loadMechaIntoForm(id) {
  try {
    const res = await fetch(`data/mechas/${id}.json`);
    if (!res.ok) throw new Error("Could not load mecha json");
    const data = await res.json();
    currentMechaData = data;

    // Identificación
    document.getElementById('m_id').value = data.id || '';
    document.getElementById('m_name').value = data.name || '';
    document.getElementById('m_alias').value = data.alias || '';
    
    // Selectores sincronizados
    if (data.category) document.getElementById('m_category_select').value = data.category;
    if (data.faction?.es) document.getElementById('m_faction_select').value = data.faction.es;
    if (data.vehicle_type?.es) document.getElementById('m_type_select').value = data.vehicle_type.es;
    if (data.series?.es) document.getElementById('m_series_select').value = data.series.es;

    document.getElementById('m_crew_es').value = data.crew?.es || '';
    document.getElementById('m_thumbnail').value = data.thumbnail || '';

    const logoSel = document.getElementById('m_faction_logo');
    if (logoSel) {
      logoSel.value = data.faction_logo || (data.category === 'zentraedi' ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo.png');
      window.updateFactionLogoPreview?.();
    }

    // Unidades reales
    document.getElementById('m_stat_speed_val').value = data.stats?.speed?.value || data.stats?.speed?.rating || 120;
    document.getElementById('m_stat_armor_val').value = data.stats?.armor?.value || data.stats?.armor?.main_body_mdc || data.stats?.armor?.rating || 200;
    document.getElementById('m_stat_firepower_val').value = data.stats?.firepower?.value || data.stats?.firepower?.rating || 80;
    document.getElementById('m_stat_range_val').value = data.stats?.range?.value || data.stats?.range?.rating || 10;
    document.getElementById('m_stat_sensors_val').value = data.stats?.sensors?.value || data.stats?.sensors?.rating || 100;
    document.getElementById('m_stat_mobility_val').value = data.stats?.mobility?.value || data.stats?.mobility?.rating || 40;

    // Dimensiones
    document.getElementById('m_height').value = data.dimensions?.height?.metric || '';
    document.getElementById('m_weight').value = data.dimensions?.weight?.metric || '';
    document.getElementById('m_engine_es').value = data.powerplant?.engine_es || '';
    document.getElementById('m_engine_en').value = data.powerplant?.engine_en || '';

    // Lore
    document.getElementById('m_overview_es').value = data.lore?.overview_es || '';
    document.getElementById('m_overview_en').value = data.lore?.overview_en || '';
    document.getElementById('m_tactical_es').value = data.lore?.tactical_analysis_es || '';
    document.getElementById('m_tactical_en').value = data.lore?.tactical_analysis_en || '';

    // MDC
    const mdcContainer = document.getElementById('mdc-items-container');
    mdcContainer.innerHTML = '';
    (data.mdc_by_location || []).forEach(loc => addMdcRow(loc));

    // Weapons
    const wepContainer = document.getElementById('weapons-items-container');
    wepContainer.innerHTML = '';
    (data.weapons || []).forEach(w => addWeaponRow(w));

    // Veritech / Modos de Transformación
    const isVar = Boolean(data.is_variable || data.category === 'veritech' || (data.vehicle_type?.es && (data.vehicle_type.es.toLowerCase().includes('variable') || data.vehicle_type.es.toLowerCase().includes('transformable'))) || data.modes);
    const varCheck = document.getElementById('m_is_variable');
    if (varCheck) varCheck.checked = isVar;
    toggleVariableModes(isVar);

    if (data.modes) {
      if (data.modes.fighter) {
        document.getElementById('m_mode_fighter_img').value = data.modes.fighter.image || '';
        document.getElementById('m_mode_fighter_length').value = data.modes.fighter.length || '';
        document.getElementById('m_mode_fighter_wingspan').value = data.modes.fighter.wingspan || '';
        document.getElementById('m_mode_fighter_height').value = data.modes.fighter.height || '';
        document.getElementById('m_mode_fighter_speed').value = data.modes.fighter.max_speed || data.modes.fighter.speed || '';
        document.getElementById('m_mode_fighter_notes').value = data.modes.fighter.notes_es || data.modes.fighter.notes || '';
        updateModePreview('fighter');
      }
      if (data.modes.guardian) {
        document.getElementById('m_mode_guardian_img').value = data.modes.guardian.image || '';
        document.getElementById('m_mode_guardian_length').value = data.modes.guardian.length || '';
        document.getElementById('m_mode_guardian_wingspan').value = data.modes.guardian.wingspan || '';
        document.getElementById('m_mode_guardian_height').value = data.modes.guardian.height || '';
        document.getElementById('m_mode_guardian_speed').value = data.modes.guardian.speed || '';
        document.getElementById('m_mode_guardian_notes').value = data.modes.guardian.notes_es || data.modes.guardian.notes || '';
        updateModePreview('guardian');
      }
      if (data.modes.battloid) {
        document.getElementById('m_mode_battloid_img').value = data.modes.battloid.image || '';
        document.getElementById('m_mode_battloid_height').value = data.modes.battloid.height || '';
        document.getElementById('m_mode_battloid_width').value = data.modes.battloid.width || '';
        document.getElementById('m_mode_battloid_depth').value = data.modes.battloid.depth || '';
        document.getElementById('m_mode_battloid_speed').value = data.modes.battloid.ground_speed || data.modes.battloid.speed || '';
        document.getElementById('m_mode_battloid_notes').value = data.modes.battloid.notes_es || data.modes.battloid.notes || '';
        updateModePreview('battloid');
      }
    }

    // Galería de Imágenes
    const galContainer = document.getElementById('gallery-items-container');
    galContainer.innerHTML = '';
    (data.images || []).forEach(img => addGalleryRow(img));

    updateLivePreview();
  } catch (err) {
    console.error("Error loading mecha:", err);
  }
}

function setupFormListeners() {
  document.getElementById('crud-form')?.addEventListener('input', () => {
    updateLivePreview();
  });
}

function resetForm() {
  currentMechaData = null;
  document.getElementById('crud-form').reset();
  document.getElementById('mdc-items-container').innerHTML = '';
  document.getElementById('weapons-items-container').innerHTML = '';
  document.getElementById('gallery-items-container').innerHTML = '';

  const varCheck = document.getElementById('m_is_variable');
  if (varCheck) varCheck.checked = false;
  toggleVariableModes(false);

  ['fighter', 'guardian', 'battloid'].forEach(m => {
    const imgInp = document.getElementById(`m_mode_${m}_img`);
    if (imgInp) imgInp.value = '';
    const prev = document.getElementById(`m_mode_${m}_preview`);
    if (prev) { prev.src = ''; prev.style.display = 'none'; }
    const lenInp = document.getElementById(`m_mode_${m}_length`);
    if (lenInp) lenInp.value = '';
    const speedInp = document.getElementById(`m_mode_${m}_speed`);
    if (speedInp) speedInp.value = '';
    const notesInp = document.getElementById(`m_mode_${m}_notes`);
    if (notesInp) notesInp.value = '';
  });

  addMdcRow({ location_es: 'Cuerpo Principal', location_en: 'Main Body', mdc: 250, notes_es: '', notes_en: '' });
  addWeaponRow({ name_es: 'Arma Primaria', name_en: 'Primary Weapon', damage: '4D10', range: '10 km' });
  
  document.getElementById('m_stat_speed_val').value = 120;
  document.getElementById('m_stat_armor_val').value = 250;
  document.getElementById('m_stat_firepower_val').value = 80;
  document.getElementById('m_stat_range_val').value = 10;
  document.getElementById('m_stat_sensors_val').value = 150;
  document.getElementById('m_stat_mobility_val').value = 40;
  updateLivePreview();
}

function addMdcRow(data = {}) {
  const container = document.getElementById('mdc-items-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.parentElement.remove(); updateLivePreview();">✕</button>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Localización (ES)</label>
        <input type="text" class="form-input mdc-loc-es" value="${data.location_es || ''}" placeholder="ej: Cuerpo Principal">
      </div>
      <div class="form-group">
        <label>Location (EN)</label>
        <input type="text" class="form-input mdc-loc-en" value="${data.location_en || ''}" placeholder="ej: Main Body">
      </div>
      <div class="form-group">
        <label>Puntos C.D.M. (MDC)</label>
        <input type="number" class="form-input mdc-val" value="${data.mdc || 100}">
      </div>
    </div>
  `;
  container.appendChild(div);
}

function addWeaponRow(data = {}) {
  const container = document.getElementById('weapons-items-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.parentElement.remove(); updateLivePreview();">✕</button>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Nombre del Arma (ES)</label>
        <input type="text" class="form-input wep-name-es" value="${data.name_es || ''}" placeholder="ej: Cañón Láser Doble">
      </div>
      <div class="form-group">
        <label>Weapon Name (EN)</label>
        <input type="text" class="form-input wep-name-en" value="${data.name_en || ''}" placeholder="ej: Twin Laser Cannon">
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Mega-Daño (Dados)</label>
        <input type="text" class="form-input wep-damage" value="${data.damage || ''}" placeholder="ej: 6D10 por brazo">
      </div>
      <div class="form-group">
        <label>Alcance</label>
        <input type="text" class="form-input wep-range" value="${data.range || ''}" placeholder="ej: 12,7 km (8 millas)">
      </div>
    </div>
  `;
  container.appendChild(div);
}

// --------------------------------------------------------------------------
// 3. GESTOR VISUAL DE GALERÍA DE IMÁGENES
// --------------------------------------------------------------------------
function addGalleryRow(data = {}) {
  const container = document.getElementById('gallery-items-container');
  if (!container) return;

  const currentCover = document.getElementById('m_thumbnail').value;
  const isCover = data.url && data.url === currentCover;

  const div = document.createElement('div');
  div.className = 'gallery-admin-row';
  div.innerHTML = `
    <img src="${data.url || ''}" class="gallery-admin-thumb" alt="Preview" onerror="this.src='assets/images/mechas/destroid_raidar_x/b0eca7d9ebe0c448feae08c391418ea8.jpg'">
    
    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; gap: 8px;">
        <input type="text" class="form-input gal-url" value="${data.url || ''}" placeholder="Ruta: assets/images/mechas/... o URL" style="flex: 2;" oninput="syncRowThumb(this)">
        <button type="button" class="btn-action-secondary" style="padding: 6px 10px; font-size: 0.72rem; white-space: nowrap;" onclick="openAssetBrowserForGalleryRow(this)">📁 ELEGIR</button>
        <select class="form-select gal-type" style="flex: 1;">
          <option value="render" ${data.type === 'render' ? 'selected' : ''}>Render 3D</option>
          <option value="blueprint" ${data.type === 'blueprint' ? 'selected' : ''}>Plano Táctico</option>
          <option value="artwork" ${data.type === 'artwork' ? 'selected' : ''}>Ilustración / Arte</option>
          <option value="archive" ${data.type === 'archive' ? 'selected' : ''}>Archivo Militar</option>
          <option value="detail" ${data.type === 'detail' ? 'selected' : ''}>Detalle Técnico</option>
          <option value="weapons" ${data.type === 'weapons' ? 'selected' : ''}>Armamento</option>
        </select>
      </div>

      <div style="display: flex; gap: 8px;">
        <input type="text" class="form-input gal-title-es" value="${data.title_es || ''}" placeholder="Título en Español" style="flex: 1;">
        <input type="text" class="form-input gal-title-en" value="${data.title_en || ''}" placeholder="Title in English" style="flex: 1;">
      </div>
    </div>

    <button type="button" class="btn-set-cover ${isCover ? 'active' : ''}" onclick="setCoverImage(this)">
      ${isCover ? '★ PORTADA ACTUAL' : '☆ HACER PORTADA'}
    </button>

    <button type="button" class="dyn-list-remove" style="position:static; margin-left:8px;" onclick="this.parentElement.remove(); updateLivePreview();">✕</button>
  `;

  container.appendChild(div);
}

window.syncRowThumb = function(inputEl) {
  const row = inputEl.closest('.gallery-admin-row');
  const img = row.querySelector('.gallery-admin-thumb');
  if (img) img.src = inputEl.value;
};

window.setCoverImage = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const url = row.querySelector('.gal-url').value;
  if (!url) return;

  document.getElementById('m_thumbnail').value = url;
  
  // Actualizar todos los botones de portada
  document.querySelectorAll('.btn-set-cover').forEach(b => {
    b.classList.remove('active');
    b.textContent = '☆ HACER PORTADA';
  });

  btn.classList.add('active');
  btn.textContent = '★ PORTADA ACTUAL';

  updateLivePreview();
  window.tacticalAudio?.scan();
};

function updateLivePreview() {
  const preview = document.getElementById('admin-live-card');
  if (!preview) return;

  const name = document.getElementById('m_name').value || 'NOMBRE DE LA UNIDAD';
  const alias = document.getElementById('m_alias').value || 'DESIGNACIÓN';
  const faction = document.getElementById('m_faction_select')?.value || 'U.N. SPACY';
  const logo = document.getElementById('m_faction_logo')?.value || (faction.toLowerCase().includes('marte') || faction.toLowerCase().includes('mars') ? 'assets/images/ui/Mars_Base.png' : (faction.toLowerCase().includes('zentraedi') || faction.toLowerCase().includes('zentran') ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo_UNSpacy.png'));
  
  const isVar = document.getElementById('m_is_variable')?.checked || document.getElementById('m_category_select')?.value === 'veritech';
  const fighterImg = document.getElementById('m_mode_fighter_img')?.value.trim();
  const guardianImg = document.getElementById('m_mode_guardian_img')?.value.trim();
  const battloidImg = document.getElementById('m_mode_battloid_img')?.value.trim();

  let thumb = document.getElementById('m_thumbnail').value.trim();
  if (!thumb) {
    thumb = fighterImg || 'assets/images/mechas/destroid_raidar_x/b0eca7d9ebe0c448feae08c391418ea8.jpg';
  }

  const speed = parseFloat(document.getElementById('m_stat_speed_val').value) || 0;
  const armor = parseInt(document.getElementById('m_stat_armor_val').value) || 0;
  const firepower = parseInt(document.getElementById('m_stat_firepower_val').value) || 0;
  const sensors = parseInt(document.getElementById('m_stat_sensors_val').value) || 0;

  const varBadge = isVar ? `<span class="badge-tag" style="border-color: var(--un-cyan); color: var(--un-cyan); margin-left: 6px;">3-MODOS VERITECH</span>` : '';
  
  const modeSwitcher = (isVar && (fighterImg || guardianImg || battloidImg)) ? `
    <div style="display: flex; gap: 4px; justify-content: center; margin-top: 6px; background: rgba(0,0,0,0.7); padding: 4px; border-radius: 4px; border: 1px solid rgba(0,240,255,0.2);">
      <button type="button" style="padding: 2px 6px; font-size: 0.65rem; background: var(--un-cyan); color: #000; border: none; border-radius: 2px; cursor: pointer; font-weight: bold;" onclick="previewSwitchMode(this, '${fighterImg || thumb}')">CAZA</button>
      <button type="button" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(255,255,255,0.1); color: var(--text-muted); border: none; border-radius: 2px; cursor: pointer;" onclick="previewSwitchMode(this, '${guardianImg || thumb}')">GUARDIÁN</button>
      <button type="button" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(255,255,255,0.1); color: var(--text-muted); border: none; border-radius: 2px; cursor: pointer;" onclick="previewSwitchMode(this, '${battloidImg || thumb}')">BATTLOID</button>
    </div>
  ` : '';

  preview.innerHTML = `
    <div class="mecha-card" style="box-shadow: none;">
      <div class="card-header-status">
        <div class="card-faction-badge">
          <img src="${logo}" class="card-faction-icon" alt="${faction}" onerror="this.src='assets/images/ui/logo_UNSpacy.png'">
          <span class="faction-tag">${faction}</span>
        </div>
        <div style="display: flex; align-items: center;">
          ${varBadge}
          <span class="badge-tag" style="margin-left: 4px;">VISTA PREVIA</span>
        </div>
      </div>
      <div class="card-image-wrap" style="height: 180px;">
        <img id="admin-preview-img" src="${thumb}" alt="${name}" onerror="this.src='assets/images/mechas/destroid_raidar_x/b0eca7d9ebe0c448feae08c391418ea8.jpg'">
        <div class="image-overlay-hud"></div>
      </div>
      ${modeSwitcher}
      <div class="card-body">
        <div class="card-title-group">
          <h3 class="card-title">${name}</h3>
          <div class="card-alias">${alias}</div>
        </div>

        <div class="stats-bars-container">
          <div class="stat-row">
            <span class="stat-label">VELOCIDAD</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill speed" style="width: ${Math.min(100, Math.max(10, speed / 30))}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${speed} km/h</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">BLINDAJE</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill armor" style="width: ${Math.min(100, Math.max(10, armor / 5))}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${armor} CDM</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">FUEGO</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill firepower" style="width: ${Math.min(100, firepower)}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${firepower} Pts</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">SENSORES</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill sensors" style="width: ${Math.min(100, Math.max(10, sensors / 3.5))}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${sensors} km</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.previewSwitchMode = function(btn, imgUrl) {
  const imgEl = document.getElementById('admin-preview-img');
  if (imgEl && imgUrl) {
    imgEl.src = imgUrl;
  }
  btn.parentElement.querySelectorAll('button').forEach(b => {
    b.style.background = 'rgba(255,255,255,0.1)';
    b.style.color = 'var(--text-muted)';
    b.style.fontWeight = 'normal';
  });
  btn.style.background = 'var(--un-cyan)';
  btn.style.color = '#000';
  btn.style.fontWeight = 'bold';
  window.tacticalAudio?.scan();
};

function buildCurrentMechaJSON() {
  const id = document.getElementById('m_id').value.trim() || 'mecha_nuevo';
  const name = document.getElementById('m_name').value.trim() || 'Mecha';
  const alias = document.getElementById('m_alias').value.trim();
  
  const catSel = document.getElementById('m_category_select');
  const category = catSel ? catSel.value : 'destroid';

  const facSel = document.getElementById('m_faction_select');
  const faction_es = facSel ? facSel.value : 'U.N. Spacy';
  const faction_en = facSel?.selectedOptions[0]?.dataset?.en || faction_es;

  const typeSel = document.getElementById('m_type_select');
  const type_es = typeSel ? typeSel.value : 'Destroid';
  const type_en = typeSel?.selectedOptions[0]?.dataset?.en || type_es;

  const serSel = document.getElementById('m_series_select');
  const series_es = serSel ? serSel.value : 'La Saga Macross';
  const series_en = serSel?.selectedOptions[0]?.dataset?.en || series_es;

  const crew_es = document.getElementById('m_crew_es').value.trim() || 'Uno o dos';
  const thumbnail = document.getElementById('m_thumbnail').value.trim();

  const isVariable = Boolean(document.getElementById('m_is_variable')?.checked || category === 'veritech' || type_es.toLowerCase().includes('variable') || type_es.toLowerCase().includes('transformable'));

  let modesData = null;
  if (isVariable) {
    modesData = {
      fighter: {
        name_es: "Modo Caza / Jet",
        name_en: "Fighter Mode / Jet",
        image: document.getElementById('m_mode_fighter_img')?.value.trim() || thumbnail,
        length: document.getElementById('m_mode_fighter_length')?.value.trim() || '',
        wingspan: document.getElementById('m_mode_fighter_wingspan')?.value.trim() || '',
        height: document.getElementById('m_mode_fighter_height')?.value.trim() || '',
        max_speed: document.getElementById('m_mode_fighter_speed')?.value.trim() || '',
        notes_es: document.getElementById('m_mode_fighter_notes')?.value.trim() || '',
        notes_en: document.getElementById('m_mode_fighter_notes')?.value.trim() || ''
      },
      guardian: {
        name_es: "Modo Guardián (Gerwalk)",
        name_en: "Guardian Mode (Gerwalk)",
        image: document.getElementById('m_mode_guardian_img')?.value.trim() || thumbnail,
        length: document.getElementById('m_mode_guardian_length')?.value.trim() || '',
        wingspan: document.getElementById('m_mode_guardian_wingspan')?.value.trim() || '',
        height: document.getElementById('m_mode_guardian_height')?.value.trim() || '',
        speed: document.getElementById('m_mode_guardian_speed')?.value.trim() || '',
        notes_es: document.getElementById('m_mode_guardian_notes')?.value.trim() || '',
        notes_en: document.getElementById('m_mode_guardian_notes')?.value.trim() || ''
      },
      battloid: {
        name_es: "Modo Battloid (Humanoide)",
        name_en: "Battloid Mode (Humanoid)",
        image: document.getElementById('m_mode_battloid_img')?.value.trim() || thumbnail,
        height: document.getElementById('m_mode_battloid_height')?.value.trim() || '',
        width: document.getElementById('m_mode_battloid_width')?.value.trim() || '',
        depth: document.getElementById('m_mode_battloid_depth')?.value.trim() || '',
        ground_speed: document.getElementById('m_mode_battloid_speed')?.value.trim() || '',
        notes_es: document.getElementById('m_mode_battloid_notes')?.value.trim() || '',
        notes_en: document.getElementById('m_mode_battloid_notes')?.value.trim() || ''
      }
    };
  }

  const speedVal = parseFloat(document.getElementById('m_stat_speed_val').value) || 0;
  const armorVal = parseInt(document.getElementById('m_stat_armor_val').value) || 0;
  const firepowerVal = parseInt(document.getElementById('m_stat_firepower_val').value) || 0;
  const rangeVal = parseFloat(document.getElementById('m_stat_range_val').value) || 0;
  const sensorsVal = parseInt(document.getElementById('m_stat_sensors_val').value) || 0;
  const mobilityVal = parseInt(document.getElementById('m_stat_mobility_val').value) || 0;

  // MDC
  const mdcList = [];
  document.querySelectorAll('#mdc-items-container .dyn-list-item').forEach(el => {
    mdcList.push({
      location_es: el.querySelector('.mdc-loc-es')?.value || '',
      location_en: el.querySelector('.mdc-loc-en')?.value || '',
      mdc: parseInt(el.querySelector('.mdc-val')?.value || '100')
    });
  });

  // Weapons
  const wepList = [];
  document.querySelectorAll('#weapons-items-container .dyn-list-item').forEach(el => {
    wepList.push({
      name_es: el.querySelector('.wep-name-es')?.value || '',
      name_en: el.querySelector('.wep-name-en')?.value || '',
      damage: el.querySelector('.wep-damage')?.value || '',
      range: el.querySelector('.wep-range')?.value || ''
    });
  });

  // Galería de imágenes completa
  const imagesList = [];
  document.querySelectorAll('#gallery-items-container .gallery-admin-row').forEach(row => {
    const url = row.querySelector('.gal-url')?.value.trim();
    if (url) {
      imagesList.push({
        url: url,
        title_es: row.querySelector('.gal-title-es')?.value.trim() || name,
        title_en: row.querySelector('.gal-title-en')?.value.trim() || name,
        type: row.querySelector('.gal-type')?.value || 'render'
      });
    }
  });

  return {
    id: id,
    name: name,
    alias: alias,
    category: category,
    is_variable: isVariable,
    modes: modesData,
    series: { es: series_es, en: series_en },
    faction: { es: faction_es, en: faction_en },
    vehicle_type: { es: type_es, en: type_en },
    crew: { es: crew_es, en: crew_es },
    thumbnail: thumbnail,
    faction_logo: document.getElementById('m_faction_logo')?.value || (category === 'zentraedi' ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo_UNSpacy.png'),
    images: imagesList.length > 0 ? imagesList : [{ url: thumbnail, title_es: name, title_en: name, type: "render" }],
    stats: {
      speed: {
        value: speedVal,
        unit_es: "km/h",
        unit_en: "km/h",
        rating: Math.min(100, Math.round(speedVal > 500 ? speedVal / 40 : speedVal / 3)),
        label_es: `${speedVal} km/h`,
        label_en: `${speedVal} km/h`
      },
      armor: {
        value: armorVal,
        unit_es: "C.D.M.",
        unit_en: "M.D.C.",
        rating: Math.min(100, Math.round(armorVal / 5)),
        label_es: `${armorVal} C.D.M. Cuerpo`,
        label_en: `${armorVal} M.D.C. Main Body`
      },
      firepower: {
        value: firepowerVal,
        unit_es: "Pts",
        unit_en: "Pts",
        rating: firepowerVal,
        label_es: `${firepowerVal} Pts`,
        label_en: `${firepowerVal} Pts`
      },
      range: {
        value: rangeVal,
        unit_es: "km",
        unit_en: "km",
        rating: Math.min(100, Math.round(rangeVal * 7)),
        label_es: `${rangeVal} km`,
        label_en: `${rangeVal} km`
      },
      sensors: {
        value: sensorsVal,
        unit_es: "km",
        unit_en: "km",
        rating: Math.min(100, Math.round(sensorsVal / 3.5)),
        label_es: `${sensorsVal} km Radar`,
        label_en: `${sensorsVal} km Radar`
      },
      mobility: {
        value: mobilityVal,
        unit_es: "Pts",
        unit_en: "Pts",
        rating: mobilityVal,
        label_es: `${mobilityVal} Pts`,
        label_en: `${mobilityVal} Pts`
      }
    },
    dimensions: {
      height: { metric: document.getElementById('m_height').value },
      weight: { metric: document.getElementById('m_weight').value }
    },
    powerplant: {
      engine_es: document.getElementById('m_engine_es').value,
      engine_en: document.getElementById('m_engine_en').value
    },
    lore: {
      overview_es: document.getElementById('m_overview_es').value,
      overview_en: document.getElementById('m_overview_en').value,
      tactical_analysis_es: document.getElementById('m_tactical_es').value,
      tactical_analysis_en: document.getElementById('m_tactical_en').value
    },
    mdc_by_location: mdcList,
    weapons: wepList,
    special_equipment: currentMechaData?.special_equipment || []
  };
}

function setupExportButtons() {
  // 1. Botón Guardar Cambios (1 Clic en Disco)
  const btnSaveDirect = document.getElementById('btn-save-all-direct');
  if (btnSaveDirect) {
    btnSaveDirect.addEventListener('click', async () => {
      const data = buildCurrentMechaJSON();
      const consoleBox = document.getElementById('git-status-console');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color:var(--un-cyan);">[*] Guardando cambios en el disco duro local...</span>';
      }

      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mecha: data, taxonomies: currentTaxonomies })
        });

        if (res.ok) {
          const result = await res.json();
          window.tacticalAudio?.scan();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">✓ [ÉXITO] Archivos guardados en disco:</span>
              <br>• data/mechas/${data.id}.json
              <br>• data/manifest.json
              <br>• data/taxonomies.json
              <br><span style="color: var(--text-dim);">${result.message || ''}</span>
            `;
          }

          // Refrescar selector de mechas si es nuevo
          await loadAdminManifest();
          const select = document.getElementById('select-mecha-to-edit');
          if (select) select.value = data.id;

        } else {
          throw new Error("El servidor local respondió con error.");
        }
      } catch (err) {
        console.warn("Fallo guardado por API, usando fallback de descarga:", err);
        if (consoleBox) {
          consoleBox.innerHTML = '<span style="color: var(--skull-amber);">[!] Servidor API no disponible. Descargando archivos manualmente...</span>';
        }
        // Fallback: descarga directa si se ejecutó sin server.py
        downloadJSON(data, `${data.id}.json`);
      }
    });
  }

  // 2. Botón Subir a GitHub (Git Push)
  const btnGitPush = document.getElementById('btn-git-push-direct');
  if (btnGitPush) {
    btnGitPush.addEventListener('click', async () => {
      const data = buildCurrentMechaJSON();
      const consoleBox = document.getElementById('git-status-console');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color: var(--skull-amber); font-weight: bold;">[*] Ejecutando protocolo militar Git: add, commit y push a GitHub...</span>\nPor favor espera unos segundos...';
      }

      btnGitPush.disabled = true;
      btnGitPush.style.opacity = '0.5';

      try {
        const res = await fetch('/api/git-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commitMessage: `Update Robotech Codex: ${data.name} (${data.id})` })
        });

        const result = await res.json();
        btnGitPush.disabled = false;
        btnGitPush.style.opacity = '1';

        if (res.ok && result.success) {
          window.tacticalAudio?.openDossier();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">🚀 [GIT PUSH COMPLETADO CON ÉXITO]</span>
              <br><span style="color: #fff;">Repositorio: github.com/rick-0019/Robotech-Encyclopedia</span>
              <pre style="margin-top:6px; color:var(--text-muted); font-size:0.7rem;">${result.logs || 'Cambios sincronizados con GitHub.'}</pre>
            `;
          }
        } else {
          window.tacticalAudio?.alert();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--veritech-red); font-weight: bold;">✕ [AVISO / REPORTE GIT]:</span>
              <pre style="margin-top:6px; color:#ff9999; font-size:0.7rem;">${result.error || result.logs || 'Verifica tus credenciales de Git o conexión.'}</pre>
            `;
          }
        }
      } catch (err) {
        btnGitPush.disabled = false;
        btnGitPush.style.opacity = '1';
        window.tacticalAudio?.alert();
        if (consoleBox) {
          consoleBox.innerHTML = `<span style="color: var(--veritech-red);">✕ Error de comunicación con server.py: ${err.message}</span>`;
        }
      }
    });
  }

  // 3. Toggle de exportación manual
  const btnToggleManual = document.getElementById('btn-toggle-manual-export');
  const manualBlock = document.getElementById('manual-export-block');
  if (btnToggleManual && manualBlock) {
    btnToggleManual.addEventListener('click', () => {
      manualBlock.style.display = manualBlock.style.display === 'none' ? 'flex' : 'none';
    });
  }

  // Descargas manuales opcionales
  document.getElementById('btn-export-mecha')?.addEventListener('click', () => {
    const data = buildCurrentMechaJSON();
    downloadJSON(data, `${data.id}.json`);
  });

  document.getElementById('btn-export-manifest')?.addEventListener('click', () => {
    if (!currentManifest) return;
    downloadJSON(currentManifest, 'manifest.json');
  });
}

function downloadJSON(obj, filename) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  window.tacticalAudio?.scan();
}

function updateFactionLogoPreview() {
  const sel = document.getElementById('m_faction_logo');
  const img = document.getElementById('faction_logo_preview');
  if (!sel || !img) return;
  let val = sel.value;
  if (!val) {
    const cat = document.getElementById('m_category_select')?.value || '';
    const fac = document.getElementById('m_faction_select')?.value || '';
    val = (cat === 'zentraedi' || fac.toLowerCase().includes('zentraedi') || fac.toLowerCase().includes('zentran')) 
      ? 'assets/images/ui/logo_zentran.png' 
      : 'assets/images/ui/logo_UNSpacy.png';
  }
  img.src = val;
}

// --------------------------------------------------------------------------
// 4. EXPLORADOR TÁCTICO DE IMÁGENES / ASSET BROWSER
// --------------------------------------------------------------------------
let currentAssetTarget = null;
let cachedAssetsList = [];
let cachedFoldersList = [];

window.openAssetBrowser = async function(target = 'm_thumbnail') {
  currentAssetTarget = target;
  const modal = document.getElementById('asset-browser-modal');
  if (modal) modal.style.display = 'flex';
  window.tacticalAudio?.hover();
  await loadProjectAssets();
};

window.openAssetBrowserForGalleryRow = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const input = row ? row.querySelector('.gal-url') : null;
  if (input) {
    window.openAssetBrowser(input);
  }
};

window.openAssetBrowserForNewGalleryItem = function() {
  window.openAssetBrowser('new_gallery_row');
};

window.closeAssetBrowser = function() {
  const modal = document.getElementById('asset-browser-modal');
  if (modal) modal.style.display = 'none';
  window.tacticalAudio?.click();
};

async function loadProjectAssets() {
  const label = document.getElementById('asset-count-label');
  if (label) label.textContent = 'Explorando archivos en assets/images/...';

  try {
    const res = await fetch(`/api/browse-images?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.images)) {
        cachedAssetsList = data.images;
        if (Array.isArray(data.folders)) {
          cachedFoldersList = data.folders;
        }
      }
    }
  } catch (err) {
    console.warn("No se pudo conectar a /api/browse-images, usando listado fallback:", err);
  }

  // Si falló o lista vacía, construir catálogo desde manifest
  if (!cachedAssetsList || cachedAssetsList.length === 0) {
    const fallbackImages = new Set();
    fallbackImages.add('assets/images/ui/logo_UNSpacy.png');
    fallbackImages.add('assets/images/ui/logo_zentran.png');
    (currentManifest?.mechas || []).forEach(m => {
      if (m.thumbnail && m.thumbnail.startsWith('assets/')) fallbackImages.add(m.thumbnail);
    });
    cachedAssetsList = Array.from(fallbackImages).map(p => {
      const parts = p.split('/');
      const name = parts[parts.length - 1];
      const folder = parts.slice(2, -1).join('/') || 'raíz';
      return { path: p, name: name, folder: folder, size_kb: 'OK' };
    });
  }

  // Poblar filtro de carpetas
  const folderFilter = document.getElementById('asset-folder-filter');
  if (folderFilter) {
    const foldersSet = new Set(cachedAssetsList.map(a => a.folder).filter(f => f && f !== 'raíz'));
    cachedFoldersList.forEach(f => foldersSet.add(f));
    const folders = Array.from(foldersSet).sort();
    const curVal = folderFilter.value || 'all';
    folderFilter.innerHTML = '<option value="all">📂 Todas las Carpetas</option>' + 
      folders.map(f => `<option value="${f}">📁 ${f}</option>`).join('');
    folderFilter.value = folders.includes(curVal) ? curVal : 'all';
  }

  filterAssetBrowserGrid();
}

window.filterAssetBrowserGrid = function() {
  const container = document.getElementById('asset-grid-container');
  const label = document.getElementById('asset-count-label');
  const folderVal = document.getElementById('asset-folder-filter')?.value || 'all';
  const query = (document.getElementById('asset-search-input')?.value || '').toLowerCase().trim();

  if (!container) return;

  const filtered = cachedAssetsList.filter(item => {
    if (folderVal !== 'all' && item.folder !== folderVal && !item.folder.startsWith(folderVal + '/')) return false;
    if (query && !item.name.toLowerCase().includes(query) && !item.folder.toLowerCase().includes(query)) return false;
    return true;
  });

  if (label) {
    label.textContent = `${filtered.length} imágenes encontradas`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 30px; text-align: center; color: var(--text-dim);">
        <p style="font-size: 1.1rem; margin-bottom: 6px;">No se encontraron imágenes en este criterio.</p>
        <p style="font-size: 0.8rem;">Podés usar el botón <strong>"Subir desde mi PC (Windows)"</strong> para añadir imágenes nuevas.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="asset-item-card" onclick="selectAsset('${item.path}')" title="${item.path}">
      <img src="${item.path}" class="asset-item-thumb" alt="${item.name}" loading="lazy">
      <div class="asset-item-details">
        <span class="asset-item-name" title="${item.name}">${item.name}</span>
        <span class="asset-item-meta">${item.folder}</span>
      </div>
    </div>
  `).join('');
};

window.selectAsset = function(path) {
  if (typeof currentAssetTarget === 'string') {
    if (currentAssetTarget === 'new_gallery_row') {
      const filename = path.split('/').pop().replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      addGalleryRow({
        url: path,
        title_es: filename,
        title_en: filename,
        type: 'render'
      });
      updateLivePreview();
    } else if (currentAssetTarget === 'new_char_gallery_row') {
      const filename = path.split('/').pop().replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      addCharGalleryRow({
        url: path,
        title_es: filename,
        title_en: filename,
        type_es: 'Retrato Oficial',
        type_en: 'Official Portrait'
      });
      updateLiveCharPreview();
    } else {
      const targetInput = document.getElementById(currentAssetTarget);
      if (targetInput) {
        targetInput.value = path;
        if (currentAssetTarget === 'm_faction_logo') {
          updateFactionLogoPreview();
        } else if (currentAssetTarget === 'c_faction_logo') {
          updateCharFactionLogoPreview();
        } else if (currentAssetTarget === 's_faction_logo') {
          updateShipFactionLogoPreview();
        } else if (currentAssetTarget.startsWith('m_mode_')) {
          const mode = currentAssetTarget.replace('m_mode_', '').replace('_img', '');
          updateModePreview(mode);
        }
        updateLivePreview();
        updateLiveCharPreview();
        updateLiveShipPreview();
      }
    }
  } else if (currentAssetTarget && typeof currentAssetTarget === 'object' && currentAssetTarget.tagName === 'INPUT') {
    currentAssetTarget.value = path;
    if (typeof syncCharRowThumb === 'function') syncCharRowThumb(currentAssetTarget);
    if (typeof syncShipRowThumb === 'function') syncShipRowThumb(currentAssetTarget);
    if (typeof syncRowThumb === 'function') syncRowThumb(currentAssetTarget);
    updateLivePreview();
    updateLiveCharPreview();
    updateLiveShipPreview();
  }

  window.tacticalAudio?.scan();
  closeAssetBrowser();
};

window.handleNativeFileSelected = async function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const statusEl = document.getElementById('asset-upload-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<span style="color:var(--un-cyan);">[*] Leyendo archivo <strong>${file.name}</strong>...</span>`;
  }

  // Determinar carpeta destino según módulo activo
  const selectedFolder = document.getElementById('asset-folder-filter')?.value;
  const mechaId = document.getElementById('m_id')?.value?.trim();
  const charId = document.getElementById('c_id')?.value?.trim();
  const shipId = document.getElementById('s_id')?.value?.trim();
  let folder = 'uploads';
  if (selectedFolder && selectedFolder !== 'all') {
    folder = selectedFolder;
  } else if (activeAdminModule === 'ships' && shipId) {
    folder = `naves/${shipId}`;
  } else if (activeAdminModule === 'characters' && charId) {
    folder = `personajes/${charId}`;
  } else if (mechaId) {
    folder = mechaId;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;

    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--skull-amber);">[*] Guardando en disco duro en [${folder}]: ${file.name}...</span>`;
    }

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: folder,
          filename: file.name,
          data: base64Data
        })
      });

      const json = await res.json();
      if (json.success) {
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#10b981;">✓ ¡Archivo guardado exitosamente en el disco duro!</span>`;
          setTimeout(() => { statusEl.style.display = 'none'; }, 2500);
        }
        await loadProjectAssets();
        selectAsset(json.path);
      } else {
        throw new Error(json.error || 'Error al guardar');
      }
    } catch (err) {
      console.warn("No se pudo subir vía /api/upload-image (posible entorno estático), usando dataUrl:", err);
      selectAsset(base64Data);
      if (statusEl) statusEl.style.display = 'none';
    }

    event.target.value = '';
  };

  reader.readAsDataURL(file);
};

// ==========================================================================
// 5. GESTIÓN DEL MÓDULO DE PERSONAJES (CRUD COMPLETO)
// ==========================================================================

function setupModuleView(moduleName) {
  activeAdminModule = moduleName;
  const layoutMechas = document.getElementById('admin-layout-mechas');
  const layoutChars = document.getElementById('admin-layout-characters');
  const layoutShips = document.getElementById('admin-layout-ships');
  const topMechas = document.getElementById('top-mechas-controls');
  const topChars = document.getElementById('top-characters-controls');
  const topShips = document.getElementById('top-ships-controls');
  const titleBadge = document.getElementById('admin-title-badge');
  const subtitle = document.getElementById('admin-subtitle');

  if (moduleName === 'ships') {
    if (layoutMechas) layoutMechas.style.display = 'none';
    if (layoutChars) layoutChars.style.display = 'none';
    if (layoutShips) layoutShips.style.display = 'grid';
    if (topMechas) topMechas.style.display = 'none';
    if (topChars) topChars.style.display = 'none';
    if (topShips) topShips.style.display = 'flex';
    if (titleBadge) titleBadge.textContent = 'REGISTRO // NAVES CAPITALES';
    if (subtitle) subtitle.textContent = 'GESTIÓN CRUD DE FORTALEZAS Y FLOTAS DE COMBATE SDF';
    document.title = 'Robotech Admin Studio // Naves Capitales';
  } else if (moduleName === 'characters') {
    if (layoutMechas) layoutMechas.style.display = 'none';
    if (layoutChars) layoutChars.style.display = 'grid';
    if (layoutShips) layoutShips.style.display = 'none';
    if (topMechas) topMechas.style.display = 'none';
    if (topChars) topChars.style.display = 'flex';
    if (topShips) topShips.style.display = 'none';
    if (titleBadge) titleBadge.textContent = 'EXPEDIENTES // PERSONAJES';
    if (subtitle) subtitle.textContent = 'GESTIÓN CRUD DE PERSONAJES Y ASES MILITARES SDF-1';
    document.title = 'Robotech Admin Studio // Personajes';
  } else {
    if (layoutChars) layoutChars.style.display = 'none';
    if (layoutShips) layoutShips.style.display = 'none';
    if (layoutMechas) layoutMechas.style.display = 'grid';
    if (topChars) topChars.style.display = 'none';
    if (topShips) topShips.style.display = 'none';
    if (topMechas) topMechas.style.display = 'flex';
    if (titleBadge) titleBadge.textContent = 'CODEX // MECHAS';
    if (subtitle) subtitle.textContent = 'GESTIÓN CRUD DE MECHAS Y VEHÍCULOS DE COMBATE';
    document.title = 'Robotech Admin Studio // Mechas';
  }
}

window.switchAdminModule = function(moduleName) {
  setupModuleView(moduleName);
  if (moduleName === 'ships') {
    if (!currentShipManifest) loadAdminShipManifest();
    updateLiveShipPreview();
  } else if (moduleName === 'characters') {
    if (!currentCharManifest) loadAdminCharManifest();
    updateLiveCharPreview();
  } else {
    if (!currentManifest) loadAdminManifest();
    updateLivePreview();
  }
  window.tacticalAudio?.click();
};

async function loadAdminCharManifest() {
  try {
    const res = await fetch(`data/manifest_personajes.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Could not load manifest_personajes.json");
    currentCharManifest = await res.json();
    populateCharSelect();
  } catch (err) {
    console.error("Error loading character manifest in admin:", err);
  }
}

function populateCharSelect() {
  const select = document.getElementById('select-character-to-edit');
  if (!select || !currentCharManifest) return;

  select.innerHTML = '<option value="">-- SELECCIONAR PERSONAJE EXISTENTE --</option>';
  (currentCharManifest.characters || []).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.rank?.es || c.category || c.id})`;
    select.appendChild(opt);
  });

  select.onchange = async (e) => {
    const id = e.target.value;
    if (id) {
      await loadCharacterIntoForm(id);
    } else {
      initNewCharacter();
    }
  };

  const btnNew = document.getElementById('btn-new-character');
  if (btnNew) {
    btnNew.onclick = () => {
      initNewCharacter();
      select.value = '';
    };
  }

  // Preseleccionar primer personaje (ej: Lisa Hayes)
  if (select.options.length > 1 && !currentCharData) {
    select.selectedIndex = 1;
    loadCharacterIntoForm(select.value);
  }
}

async function loadCharacterIntoForm(id) {
  try {
    const res = await fetch(`data/personajes/${id}.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load character data for ${id}`);
    const data = await res.json();
    currentCharData = data;

    // 1. Identificación y Rol
    const elId = document.getElementById('c_id');
    if (elId) elId.value = data.id || '';
    const elName = document.getElementById('c_name');
    if (elName) elName.value = data.name || '';
    const elJp = document.getElementById('c_japanese_name');
    if (elJp) elJp.value = data.japanese_name || '';
    const elCall = document.getElementById('c_callsign');
    if (elCall) elCall.value = data.callsign || '';
    const elCat = document.getElementById('c_category');
    if (elCat && data.category) elCat.value = data.category;
    const elSer = document.getElementById('c_series_select');
    if (elSer && data.series?.es) elSer.value = data.series.es;

    const elRankEs = document.getElementById('c_rank_es');
    if (elRankEs) elRankEs.value = data.rank?.es || '';
    const elRankEn = document.getElementById('c_rank_en');
    if (elRankEn) elRankEn.value = data.rank?.en || '';
    const elRoleEs = document.getElementById('c_role_es');
    if (elRoleEs) elRoleEs.value = data.role?.es || '';
    const elRoleEn = document.getElementById('c_role_en');
    if (elRoleEn) elRoleEn.value = data.role?.en || '';
    const elAssEs = document.getElementById('c_assignment_es');
    if (elAssEs) elAssEs.value = data.assignment?.es || '';
    const elAssEn = document.getElementById('c_assignment_en');
    if (elAssEn) elAssEn.value = data.assignment?.en || '';

    const elFac = document.getElementById('c_faction_select');
    if (elFac && data.faction?.es) elFac.value = data.faction.es;
    const elLogo = document.getElementById('c_faction_logo');
    if (elLogo) {
      elLogo.value = data.faction_logo || 'assets/images/ui/logo_UNSpacy.png';
      window.updateCharFactionLogoPreview();
    }

    const elThumb = document.getElementById('c_thumbnail');
    if (elThumb) elThumb.value = data.thumbnail || '';

    // 2. Aptitudes
    const apt = data.aptitudes || {};
    const stats = data.stats || {};
    const elCmd = document.getElementById('c_stat_command');
    if (elCmd) elCmd.value = apt.command?.value || stats.command || 90;
    const elStr = document.getElementById('c_stat_strategy');
    if (elStr) elStr.value = apt.strategy?.value || stats.strategy || 90;
    const elRes = document.getElementById('c_stat_resolve');
    if (elRes) elRes.value = apt.resolve?.value || stats.resolve || 85;
    const elPil = document.getElementById('c_stat_piloting');
    if (elPil) elPil.value = apt.piloting?.value || stats.piloting || 70;

    // 3. Biométricos
    const elBirth = document.getElementById('c_birth_date');
    if (elBirth) elBirth.value = data.birth_date || '';
    const elBPlaceEs = document.getElementById('c_birth_place_es');
    if (elBPlaceEs) elBPlaceEs.value = data.birth_place?.es || '';
    const elBPlaceEn = document.getElementById('c_birth_place_en');
    if (elBPlaceEn) elBPlaceEn.value = data.birth_place?.en || '';
    const elBlood = document.getElementById('c_blood_type');
    if (elBlood) elBlood.value = data.blood_type || '';
    const elH = document.getElementById('c_height');
    if (elH) elH.value = data.height || '';
    const elW = document.getElementById('c_weight');
    if (elW) elW.value = data.weight || '';

    // 4. Dossier y Resumen
    const elSumEs = document.getElementById('c_summary_es');
    if (elSumEs) elSumEs.value = data.summary?.es || (data.lore?.overview_es ? data.lore.overview_es.substring(0, 160) + '...' : '');
    const elSumEn = document.getElementById('c_summary_en');
    if (elSumEn) elSumEn.value = data.summary?.en || (data.lore?.overview_en ? data.lore.overview_en.substring(0, 160) + '...' : '');
    const elOverEs = document.getElementById('c_overview_es');
    if (elOverEs) elOverEs.value = data.lore?.overview_es || '';
    const elOverEn = document.getElementById('c_overview_en');
    if (elOverEn) elOverEn.value = data.lore?.overview_en || '';
    const elTacEs = document.getElementById('c_tactical_es');
    if (elTacEs) elTacEs.value = data.lore?.tactical_analysis_es || '';
    const elTacEn = document.getElementById('c_tactical_en');
    if (elTacEn) elTacEn.value = data.lore?.tactical_analysis_en || '';

    // 5. Hoja de Servicio
    const srvContainer = document.getElementById('char-service-container');
    if (srvContainer) {
      srvContainer.innerHTML = '';
      (data.service_record || []).forEach(row => addCharServiceRow(row));
    }

    // 6. Relaciones
    const relContainer = document.getElementById('char-relations-container');
    if (relContainer) {
      relContainer.innerHTML = '';
      (data.relationships || []).forEach(row => addCharRelationRow(row));
    }

    // 7. Condecoraciones
    const elDec = document.getElementById('c_decorations');
    if (elDec) elDec.value = (data.decorations || []).join('\n');

    // 8. Galería
    const galContainer = document.getElementById('char-gallery-container');
    if (galContainer) {
      galContainer.innerHTML = '';
      (data.images || []).forEach(row => addCharGalleryRow(row));
    }

    updateLiveCharPreview();
  } catch (err) {
    console.error("Error loading character into form:", err);
  }
}

function initNewCharacter() {
  currentCharData = null;
  const form = document.getElementById('crud-form-char');
  if (form) form.reset();

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('c_id', 'nuevo_personaje');
  setVal('c_name', 'Nuevo Personaje');
  setVal('c_japanese_name', '');
  setVal('c_callsign', '');
  setVal('c_category', 'command');
  setVal('c_series_select', 'La Saga Macross (Primera Guerra Robotech)');
  setVal('c_rank_es', 'Oficial / Piloto');
  setVal('c_rank_en', 'Officer / Pilot');
  setVal('c_role_es', 'Operaciones Tácticas');
  setVal('c_role_en', 'Tactical Operations');
  setVal('c_assignment_es', 'Fuerza de Defensa Robotech');
  setVal('c_assignment_en', 'Robotech Defense Force');
  setVal('c_faction_select', 'U.N. Spacy');
  setVal('c_faction_logo', 'assets/images/ui/logo_UNSpacy.png');
  window.updateCharFactionLogoPreview();
  setVal('c_thumbnail', 'assets/images/ui/logo_UNSpacy.png');

  setVal('c_stat_command', 85);
  setVal('c_stat_strategy', 85);
  setVal('c_stat_resolve', 85);
  setVal('c_stat_piloting', 75);

  setVal('c_birth_date', '');
  setVal('c_birth_place_es', 'Tierra');
  setVal('c_birth_place_en', 'Earth');
  setVal('c_blood_type', 'O+');
  setVal('c_height', '');
  setVal('c_weight', '');

  setVal('c_summary_es', '');
  setVal('c_summary_en', '');
  setVal('c_overview_es', '');
  setVal('c_overview_en', '');
  setVal('c_tactical_es', '');
  setVal('c_tactical_en', '');

  const srvContainer = document.getElementById('char-service-container');
  if (srvContainer) {
    srvContainer.innerHTML = '';
    addCharServiceRow({ period: '2009 - 2011', assignment_es: 'Asignación Inicial', assignment_en: 'Initial Assignment' });
  }

  const relContainer = document.getElementById('char-relations-container');
  if (relContainer) relContainer.innerHTML = '';
  setVal('c_decorations', '');

  const galContainer = document.getElementById('char-gallery-container');
  if (galContainer) {
    galContainer.innerHTML = '';
    addCharGalleryRow({
      url: 'assets/images/ui/logo_UNSpacy.png',
      title_es: 'Retrato de Servicio',
      title_en: 'Service Portrait',
      type_es: 'Retrato Oficial',
      type_en: 'Official Portrait'
    });
  }

  updateLiveCharPreview();
}

window.addCharServiceRow = function(data = {}) {
  const container = document.getElementById('char-service-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.closest('.dyn-list-item').remove();" title="Eliminar fila">✕</button>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Período / Año</label>
        <input type="text" class="form-input srv-period" placeholder="ej: 2009 - 2011" value="${data.period || ''}">
      </div>
      <div class="form-group">
        <label>Asignación (Español)</label>
        <input type="text" class="form-input srv-es" placeholder="Destino militar en español" value="${data.assignment_es || ''}">
      </div>
      <div class="form-group">
        <label>Asignación (English)</label>
        <input type="text" class="form-input srv-en" placeholder="Assignment in English" value="${data.assignment_en || ''}">
      </div>
    </div>
  `;
  container.appendChild(div);
};

window.addCharRelationRow = function(data = {}) {
  const container = document.getElementById('char-relations-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.closest('.dyn-list-item').remove();" title="Eliminar fila">✕</button>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Nombre del Personaje</label>
        <input type="text" class="form-input rel-name" placeholder="ej: Rick Hunter" value="${data.name || ''}">
      </div>
      <div class="form-group">
        <label>Vínculo (Español)</label>
        <input type="text" class="form-input rel-type-es" placeholder="ej: Compañero de Armas // Esposo" value="${data.relation_es || ''}">
      </div>
      <div class="form-group">
        <label>Vínculo (English)</label>
        <input type="text" class="form-input rel-type-en" placeholder="ej: Combat Partner // Husband" value="${data.relation_en || ''}">
      </div>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label>Notas de la Relación (Español)</label>
      <textarea class="form-textarea rel-notes" style="min-height: 50px;" placeholder="Detalles de la interacción militar o personal...">${data.notes_es || ''}</textarea>
    </div>
  `;
  container.appendChild(div);
};

window.addCharGalleryRow = function(data = {}) {
  const container = document.getElementById('char-gallery-container');
  if (!container) return;
  const thumbUrl = data.url || 'assets/images/ui/logo_UNSpacy.png';
  const isCover = document.getElementById('c_thumbnail')?.value === thumbUrl;
  const div = document.createElement('div');
  div.className = 'gallery-admin-row';
  div.innerHTML = `
    <img src="${thumbUrl}" class="gallery-admin-thumb" alt="Preview" onerror="this.src='assets/images/ui/logo_UNSpacy.png'">
    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; gap: 8px;">
        <input type="text" class="form-input gal-char-url" placeholder="assets/images/personajes/... o URL" value="${data.url || ''}" oninput="syncCharRowThumb(this); updateLiveCharPreview();">
        <button type="button" class="btn-action-secondary" onclick="openAssetBrowserForCharGalleryRow(this)" style="padding: 4px 10px; font-size: 0.72rem; white-space: nowrap;">
          📁 ELEGIR
        </button>
      </div>
      <div class="form-grid-3" style="gap: 6px;">
        <input type="text" class="form-input gal-char-title-es" placeholder="Título foto (Español)" value="${data.title_es || ''}">
        <input type="text" class="form-input gal-char-title-en" placeholder="Title (English)" value="${data.title_en || ''}">
        <select class="form-select gal-char-type-es">
          <option value="Retrato Oficial" ${data.type_es === 'Retrato Oficial' ? 'selected' : ''}>Retrato Oficial</option>
          <option value="Misión Operativa" ${data.type_es === 'Misión Operativa' ? 'selected' : ''}>Misión Operativa</option>
          <option value="Registro Personal" ${data.type_es === 'Registro Personal' ? 'selected' : ''}>Registro Personal</option>
          <option value="Historial Temprano" ${data.type_es === 'Historial Temprano' ? 'selected' : ''}>Historial Temprano</option>
          <option value="Archivo Táctico" ${data.type_es === 'Archivo Táctico' ? 'selected' : ''}>Archivo Táctico</option>
          <option value="En Operación" ${data.type_es === 'En Operación' ? 'selected' : ''}>En Operación</option>
          <option value="Condecoración" ${data.type_es === 'Condecoración' ? 'selected' : ''}>Condecoración</option>
          <option value="Vigilancia Radar" ${data.type_es === 'Vigilancia Radar' ? 'selected' : ''}>Vigilancia Radar</option>
        </select>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
      <button type="button" class="btn-set-cover ${isCover ? 'active' : ''}" onclick="setAsCharThumbnail(this)">
        ${isCover ? '★ PORTADA ACTUAL' : '☆ HACER PORTADA'}
      </button>
      <button type="button" class="dyn-list-remove" style="position: static;" onclick="this.closest('.gallery-admin-row').remove(); updateLiveCharPreview();">✕</button>
    </div>
  `;
  container.appendChild(div);
};

window.syncCharRowThumb = function(input) {
  const row = input.closest('.gallery-admin-row');
  const img = row ? row.querySelector('.gallery-admin-thumb') : null;
  if (img) img.src = input.value || 'assets/images/ui/logo_UNSpacy.png';
};

window.setAsCharThumbnail = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const urlInp = row ? row.querySelector('.gal-char-url') : null;
  if (!urlInp || !urlInp.value) return;

  const thumbInput = document.getElementById('c_thumbnail');
  if (thumbInput) thumbInput.value = urlInp.value;

  document.querySelectorAll('#char-gallery-container .btn-set-cover').forEach(b => {
    b.classList.remove('active');
    b.textContent = '☆ HACER PORTADA';
  });
  btn.classList.add('active');
  btn.textContent = '★ PORTADA ACTUAL';

  updateLiveCharPreview();
  window.tacticalAudio?.scan();
};

window.openAssetBrowserForCharGalleryRow = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const input = row ? row.querySelector('.gal-char-url') : null;
  if (input) {
    window.openAssetBrowser(input);
  }
};

window.openAssetBrowserForNewCharGalleryItem = function() {
  window.openAssetBrowser('new_char_gallery_row');
};

window.updateCharFactionFromSelect = function() {
  const sel = document.getElementById('c_faction_select');
  const logoInp = document.getElementById('c_faction_logo');
  if (!sel || !logoInp) return;
  const opt = sel.selectedOptions[0];
  const logo = opt?.dataset?.logo;
  if (logo) {
    logoInp.value = logo;
  } else {
    const val = sel.value.toLowerCase();
    if (val.includes('marte') || val.includes('mars')) {
      logoInp.value = 'assets/images/ui/Mars_Base.png';
    } else if (val.includes('zentraedi') || val.includes('zentran')) {
      logoInp.value = 'assets/images/ui/logo_zentran.png';
    } else {
      logoInp.value = 'assets/images/ui/logo_UNSpacy.png';
    }
  }
  updateCharFactionLogoPreview();
  updateLiveCharPreview();
};

window.updateCharFactionLogoPreview = function() {
  const inp = document.getElementById('c_faction_logo');
  const img = document.getElementById('char_faction_logo_preview');
  if (inp && img) {
    img.src = inp.value || 'assets/images/ui/logo_UNSpacy.png';
  }
};

function updateLiveCharPreview() {
  const preview = document.getElementById('admin-live-char-card');
  if (!preview) return;

  const name = document.getElementById('c_name')?.value || 'NOMBRE DEL PERSONAJE';
  const rank = document.getElementById('c_rank_es')?.value || 'RANGO MILITAR';
  const assignment = document.getElementById('c_assignment_es')?.value || 'ASIGNACIÓN OPERATIVA';
  const faction = document.getElementById('c_faction_select')?.value || 'U.N. Spacy';
  const logo = document.getElementById('c_faction_logo')?.value || 'assets/images/ui/logo_UNSpacy.png';
  const thumb = document.getElementById('c_thumbnail')?.value || 'assets/images/ui/logo_UNSpacy.png';
  const summary = document.getElementById('c_summary_es')?.value || 'Resumen biográfico táctico del personaje...';

  const cmd = parseInt(document.getElementById('c_stat_command')?.value) || 85;
  const str = parseInt(document.getElementById('c_stat_strategy')?.value) || 85;
  const res = parseInt(document.getElementById('c_stat_resolve')?.value) || 85;
  const pil = parseInt(document.getElementById('c_stat_piloting')?.value) || 75;

  preview.innerHTML = `
    <div class="mecha-card" style="box-shadow: none;">
      <div class="card-header-status">
        <div class="card-faction-badge" title="${faction}">
          <img src="${logo}" class="card-faction-icon" alt="${faction}" onerror="this.src='assets/images/ui/logo_UNSpacy.png'">
          <span class="faction-tag">${faction}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span class="badge-tag" style="border-color: var(--skull-amber); color: var(--skull-amber);">EXPEDIENTE</span>
        </div>
      </div>

      <div class="card-image-wrap" style="height: 220px; position: relative;">
        <img src="${thumb}" alt="${name}" onerror="this.src='assets/images/ui/logo_UNSpacy.png'" style="object-position: center 15%;">
        <div class="image-overlay-hud"></div>
      </div>

      <div class="card-body">
        <div class="card-title-group">
          <h3 class="card-title">${name}</h3>
          <div class="card-alias">${rank}</div>
        </div>

        <div style="margin-bottom: 8px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--un-cyan); letter-spacing: 0.8px;">
          ⌖ ${assignment}
        </div>

        <p class="card-summary">${summary}</p>

        <div class="stats-bars-container">
          <div class="stat-row">
            <span class="stat-label">MANDO</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill speed" style="width: ${cmd}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${cmd}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">ESTRATEGIA</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill armor" style="width: ${str}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${str}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">RESOLUCIÓN</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill sensors" style="width: ${res}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${res}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">PILOTAJE</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill firepower" style="width: ${pil}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${pil}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildCurrentCharJSON() {
  const id = document.getElementById('c_id')?.value.trim() || 'nuevo_personaje';
  const name = document.getElementById('c_name')?.value.trim() || 'Nuevo Personaje';
  const jp = document.getElementById('c_japanese_name')?.value.trim() || '';
  const callsign = document.getElementById('c_callsign')?.value.trim() || '';
  const category = document.getElementById('c_category')?.value || 'command';

  const serSel = document.getElementById('c_series_select');
  const series_es = serSel ? serSel.value : 'La Saga Macross (Primera Guerra Robotech)';
  const series_en = serSel?.selectedOptions[0]?.dataset?.en || series_es;

  const rank_es = document.getElementById('c_rank_es')?.value.trim() || '';
  const rank_en = document.getElementById('c_rank_en')?.value.trim() || rank_es;

  const role_es = document.getElementById('c_role_es')?.value.trim() || '';
  const role_en = document.getElementById('c_role_en')?.value.trim() || role_es;

  const assign_es = document.getElementById('c_assignment_es')?.value.trim() || '';
  const assign_en = document.getElementById('c_assignment_en')?.value.trim() || assign_es;

  const facSel = document.getElementById('c_faction_select');
  const faction_es = facSel ? facSel.value : 'U.N. Spacy';
  const faction_en = facSel?.selectedOptions[0]?.dataset?.en || faction_es;
  const faction_logo = document.getElementById('c_faction_logo')?.value || 'assets/images/ui/logo_UNSpacy.png';

  const thumbnail = document.getElementById('c_thumbnail')?.value.trim() || 'assets/images/ui/logo_UNSpacy.png';

  const cmdVal = parseInt(document.getElementById('c_stat_command')?.value) || 85;
  const strVal = parseInt(document.getElementById('c_stat_strategy')?.value) || 85;
  const resVal = parseInt(document.getElementById('c_stat_resolve')?.value) || 85;
  const pilVal = parseInt(document.getElementById('c_stat_piloting')?.value) || 75;

  const birth_date = document.getElementById('c_birth_date')?.value.trim() || '';
  const birth_place_es = document.getElementById('c_birth_place_es')?.value.trim() || '';
  const birth_place_en = document.getElementById('c_birth_place_en')?.value.trim() || birth_place_es;
  const blood_type = document.getElementById('c_blood_type')?.value.trim() || '';
  const height = document.getElementById('c_height')?.value.trim() || '';
  const weight = document.getElementById('c_weight')?.value.trim() || '';

  const summary_es = document.getElementById('c_summary_es')?.value.trim() || '';
  const summary_en = document.getElementById('c_summary_en')?.value.trim() || summary_es;
  const overview_es = document.getElementById('c_overview_es')?.value.trim() || '';
  const overview_en = document.getElementById('c_overview_en')?.value.trim() || overview_es;
  const tactical_es = document.getElementById('c_tactical_es')?.value.trim() || '';
  const tactical_en = document.getElementById('c_tactical_en')?.value.trim() || tactical_es;

  // Hoja de Servicio
  const serviceList = [];
  document.querySelectorAll('#char-service-container .dyn-list-item').forEach(el => {
    const period = el.querySelector('.srv-period')?.value.trim();
    const ass_es = el.querySelector('.srv-es')?.value.trim();
    const ass_en = el.querySelector('.srv-en')?.value.trim();
    if (period || ass_es) {
      serviceList.push({
        period: period,
        assignment_es: ass_es,
        assignment_en: ass_en || ass_es
      });
    }
  });

  // Relaciones
  const relList = [];
  document.querySelectorAll('#char-relations-container .dyn-list-item').forEach(el => {
    const relName = el.querySelector('.rel-name')?.value.trim();
    const rel_es = el.querySelector('.rel-type-es')?.value.trim();
    const rel_en = el.querySelector('.rel-type-en')?.value.trim();
    const notes = el.querySelector('.rel-notes')?.value.trim();
    if (relName) {
      relList.push({
        name: relName,
        relation_es: rel_es,
        relation_en: rel_en || rel_es,
        notes_es: notes
      });
    }
  });

  // Condecoraciones
  const decRaw = document.getElementById('c_decorations')?.value || '';
  const decorations = decRaw.split('\n').map(d => d.trim()).filter(d => d.length > 0);

  // Galería
  const imagesList = [];
  document.querySelectorAll('#char-gallery-container .gallery-admin-row').forEach(row => {
    const url = row.querySelector('.gal-char-url')?.value.trim();
    if (url) {
      const typeEs = row.querySelector('.gal-char-type-es')?.value || 'Retrato Oficial';
      const typeMapEn = {
        'Retrato Oficial': 'Official Portrait',
        'Misión Operativa': 'Field Mission',
        'Registro Personal': 'Personal Log',
        'Historial Temprano': 'Early Career',
        'Archivo Táctico': 'Tactical File',
        'En Operación': 'In Operation',
        'Condecoración': 'Commendation',
        'Vigilancia Radar': 'Radar Surveillance'
      };
      imagesList.push({
        url: url,
        title_es: row.querySelector('.gal-char-title-es')?.value.trim() || name,
        title_en: row.querySelector('.gal-char-title-en')?.value.trim() || name,
        type_es: typeEs,
        type_en: typeMapEn[typeEs] || typeEs
      });
    }
  });

  return {
    id: id,
    name: name,
    japanese_name: jp,
    callsign: callsign,
    rank: { es: rank_es, en: rank_en },
    role: { es: role_es, en: role_en },
    category: category,
    faction: { es: faction_es, en: faction_en },
    faction_logo: faction_logo,
    series: { es: series_es, en: series_en },
    assignment: { es: assign_es, en: assign_en },
    birth_date: birth_date,
    birth_place: { es: birth_place_es, en: birth_place_en },
    blood_type: blood_type,
    height: height,
    weight: weight,
    thumbnail: thumbnail,
    images: imagesList.length > 0 ? imagesList : [{ url: thumbnail, title_es: name, title_en: name, type_es: "Retrato Oficial", type_en: "Official Portrait" }],
    summary: { es: summary_es, en: summary_en },
    lore: {
      overview_es: overview_es,
      overview_en: overview_en,
      tactical_analysis_es: tactical_es,
      tactical_analysis_en: tactical_en
    },
    aptitudes: {
      command: {
        value: cmdVal,
        label_es: "Mando y Liderazgo Táctico",
        label_en: "Command & Tactical Leadership",
        desc_es: "Capacidad para comandar flotas y operaciones tácticas a gran escala."
      },
      strategy: {
        value: strVal,
        label_es: "Estrategia e Inteligencia Militar",
        label_en: "Strategic Intelligence & Planning",
        desc_es: "Maestría en análisis balístico, predicción de movimientos y logística bélica."
      },
      resolve: {
        value: resVal,
        label_es: "Resolución y Templanza bajo Fuego",
        label_en: "Poise & Crisis Resolution",
        desc_es: "Serenidad mental y toma de decisiones crítica en condiciones extremas."
      },
      piloting: {
        value: pilVal,
        label_es: "Habilidad de Vuelo y Pilotaje",
        label_en: "Flight & Piloting Proficiency",
        desc_es: "Aptitud de pilotaje de cazas aeroespaciales y maniobras de evasión."
      }
    },
    stats: {
      command: cmdVal,
      strategy: strVal,
      resolve: resVal,
      piloting: pilVal
    },
    service_record: serviceList,
    relationships: relList,
    decorations: decorations
  };
}

function setupCharEventListeners() {
  document.getElementById('crud-form-char')?.addEventListener('input', () => {
    updateLiveCharPreview();
  });
}

function setupCharExportButtons() {
  const btnSaveChar = document.getElementById('btn-save-char-direct');
  if (btnSaveChar) {
    btnSaveChar.addEventListener('click', async () => {
      const data = buildCurrentCharJSON();
      const consoleBox = document.getElementById('git-status-console-char');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color:var(--un-cyan);">[*] Guardando expediente militar en el disco duro local...</span>';
      }

      try {
        const res = await fetch('/api/save-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character: data })
        });

        if (res.ok) {
          const result = await res.json();
          window.tacticalAudio?.scan();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">✓ [ÉXITO] Expediente guardado en disco:</span>
              <br>• data/personajes/${data.id}.json
              <br>• data/manifest_personajes.json
              <br><span style="color: var(--text-dim);">${result.message || ''}</span>
            `;
          }

          // Refrescar selector de personajes
          await loadAdminCharManifest();
          const select = document.getElementById('select-character-to-edit');
          if (select) select.value = data.id;

        } else {
          throw new Error("El servidor local respondió con error.");
        }
      } catch (err) {
        console.warn("Fallo guardado por API /api/save-character, usando fallback:", err);
        if (consoleBox) {
          consoleBox.innerHTML = '<span style="color: var(--skull-amber);">[!] Servidor API no disponible. Descargando archivo JSON manualmente...</span>';
        }
        downloadJSON(data, `${data.id}.json`);
      }
    });
  }

  // 2. Botón Subir Personaje a GitHub (Git Push)
  const btnGitPushChar = document.getElementById('btn-git-push-char');
  if (btnGitPushChar) {
    btnGitPushChar.addEventListener('click', async () => {
      const data = buildCurrentCharJSON();
      const consoleBox = document.getElementById('git-status-console-char');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color: var(--skull-amber); font-weight: bold;">[*] Ejecutando protocolo militar Git: add, commit y push a GitHub...</span>\nPor favor espera unos segundos...';
      }

      btnGitPushChar.disabled = true;
      btnGitPushChar.style.opacity = '0.5';

      try {
        const res = await fetch('/api/git-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commitMessage: `Update Robotech Personnel: ${data.name} (${data.id})` })
        });

        const result = await res.json();
        btnGitPushChar.disabled = false;
        btnGitPushChar.style.opacity = '1';

        if (result.success) {
          window.tacticalAudio?.scan();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">✓ [ÉXITO] Cambios sincronizados y subidos a GitHub:</span>
              <pre style="margin-top:6px; color:#a3e635; font-size:0.7rem;">${result.logs || 'Push exitoso.'}</pre>
            `;
          }
        } else {
          window.tacticalAudio?.alert();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--veritech-red); font-weight: bold;">✕ [AVISO / REPORTE GIT]:</span>
              <pre style="margin-top:6px; color:#ff9999; font-size:0.7rem;">${result.error || result.logs || 'Verifica tus credenciales de Git o conexión.'}</pre>
            `;
          }
        }
      } catch (err) {
        btnGitPushChar.disabled = false;
        btnGitPushChar.style.opacity = '1';
        window.tacticalAudio?.alert();
        if (consoleBox) {
          consoleBox.innerHTML = `<span style="color: var(--veritech-red);">✕ Error de comunicación con server.py: ${err.message}</span>`;
        }
      }
    });
  }

  // 3. Descarga manual opcional
  const btnDlChar = document.getElementById('btn-download-char-json');
  if (btnDlChar) {
    btnDlChar.addEventListener('click', () => {
      const data = buildCurrentCharJSON();
      downloadJSON(data, `${data.id}.json`);
    });
  }
}

window.addMdcRow = addMdcRow;
window.addWeaponRow = addWeaponRow;
window.addGalleryRow = addGalleryRow;
window.updateLivePreview = updateLivePreview;
window.updateLiveCharPreview = updateLiveCharPreview;
window.updateFactionLogoPreview = updateFactionLogoPreview;

// ==========================================================================
// 6. GESTIÓN DEL MÓDULO DE NAVES CAPITALES (CRUD COMPLETO)
// ==========================================================================

async function loadAdminShipManifest() {
  try {
    const res = await fetch(`data/manifest_naves.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Could not load manifest_naves.json");
    currentShipManifest = await res.json();
    populateShipSelect();
  } catch (err) {
    console.error("Error loading ships manifest in admin:", err);
  }
}

function populateShipSelect() {
  const select = document.getElementById('select-ship-to-edit');
  if (!select || !currentShipManifest) return;

  select.innerHTML = '<option value="">-- SELECCIONAR NAVE EXISTENTE --</option>';
  (currentShipManifest.ships || []).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.class_name?.es || s.category || s.id})`;
    select.appendChild(opt);
  });

  select.onchange = async (e) => {
    const id = e.target.value;
    if (id) {
      await loadShipIntoForm(id);
    } else {
      initNewShip();
    }
  };

  const btnNew = document.getElementById('btn-new-ship');
  if (btnNew) {
    btnNew.onclick = () => {
      initNewShip();
      select.value = '';
    };
  }

  // Preseleccionar primera nave (ej: SDF-1 Macross)
  if (select.options.length > 1 && !currentShipData) {
    select.selectedIndex = 1;
    loadShipIntoForm(select.value);
  }
}

async function loadShipIntoForm(id) {
  try {
    const res = await fetch(`data/naves/${id}.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load ship data for ${id}`);
    const data = await res.json();
    currentShipData = data;

    // 1. Identificación y Mando
    const setVal = (elemId, val) => { const el = document.getElementById(elemId); if (el) el.value = val || ''; };
    setVal('s_id', data.id);
    setVal('s_name', data.name);
    setVal('s_category', data.category || 'fortress');
    setVal('s_class_name_es', data.class_name?.es);
    setVal('s_class_name_en', data.class_name?.en);
    setVal('s_series_select', data.series?.es || 'La Saga Macross (Primera Guerra Robotech)');
    setVal('s_faction_select', data.faction?.es || 'U.N. Spacy // Tierra Unificada');
    setVal('s_faction_logo', data.faction_logo || 'assets/images/ui/logo_UNSpacy.png');
    updateShipFactionLogoPreview();
    setVal('s_thumbnail', data.thumbnail);
    setVal('s_commissioned', data.commissioned);
    setVal('s_command_es', data.commanding_officer?.es);
    setVal('s_complement_es', data.complement?.es);
    setVal('s_airgroup_es', data.air_group?.es);
    setVal('s_docked_es', data.docked_vessels?.es);

    // 2. Modos Modulares
    const chkMod = document.getElementById('s_is_modular');
    if (chkMod) chkMod.checked = !!data.is_modular;
    toggleShipModularSection(!!data.is_modular);

    const cr = data.modes?.cruiser || {};
    setVal('s_mode_cruiser_name_es', cr.name_es || 'Modo Crucero de Batalla Aeroespacial');
    setVal('s_mode_cruiser_name_en', cr.name_en || 'Aerospace Battle Cruiser Mode');
    setVal('s_mode_cruiser_img', cr.image || '');
    setVal('s_mode_cruiser_length', cr.length || '1.210 m');
    setVal('s_mode_cruiser_width', cr.width || '496 m');
    setVal('s_mode_cruiser_height', cr.height || '312 m');
    setVal('s_mode_cruiser_desc_es', cr.desc_es || '');

    const at = data.modes?.attack || {};
    setVal('s_mode_attack_name_es', at.name_es || 'Modo Ataque Humanoide (Attack Mode / Stormer)');
    setVal('s_mode_attack_name_en', at.name_en || 'Humanoid Attack Mode (Stormer)');
    setVal('s_mode_attack_img', at.image || '');
    setVal('s_mode_attack_height', at.height || '1.200 m');
    setVal('s_mode_attack_width', at.width || '600 m');
    setVal('s_mode_attack_length', at.length || '1.200 m');
    setVal('s_mode_attack_desc_es', at.desc_es || '');

    // 3. Dimensiones y Propulsión
    setVal('s_dim_length', data.dimensions?.length || '1.210 m');
    setVal('s_dim_width', data.dimensions?.width || '496 m');
    setVal('s_dim_height', data.dimensions?.height || '312 m');
    setVal('s_dim_mass', data.dimensions?.mass || '18.000.000 toneladas');
    setVal('s_prop_engines_es', data.propulsion?.engines_es || '');
    setVal('s_prop_fold_es', data.propulsion?.fold_system_es || '');
    setVal('s_def_armor_es', data.defenses?.armor_es || '');
    setVal('s_def_shields_es', data.defenses?.shields_es || '');

    // 4. Estadísticas
    setVal('s_stat_firepower', data.stats?.firepower || 100);
    setVal('s_stat_armor', data.stats?.armor || 98);
    setVal('s_stat_capacity', data.stats?.capacity || 96);
    setVal('s_stat_range', data.stats?.range || 92);

    // 5. Resumen e Historia
    setVal('s_summary_es', data.summary?.es || (data.lore?.overview_es ? data.lore.overview_es.substring(0, 160) + '...' : ''));
    setVal('s_summary_en', data.summary?.en || (data.lore?.overview_en ? data.lore.overview_en.substring(0, 160) + '...' : ''));
    setVal('s_overview_es', data.lore?.overview_es || '');
    setVal('s_tactical_es', data.lore?.tactical_analysis_es || '');

    // 6. Armamento
    const wContainer = document.getElementById('ship-weapons-container');
    if (wContainer) {
      wContainer.innerHTML = '';
      (data.weapons || []).forEach(w => addShipWeaponRow(w));
    }

    // 7. Secciones Internas
    const secContainer = document.getElementById('ship-sections-container');
    if (secContainer) {
      secContainer.innerHTML = '';
      (data.internal_sections || []).forEach(sec => addShipSectionRow(sec));
    }

    // 8. Galería
    const galContainer = document.getElementById('ship-gallery-container');
    if (galContainer) {
      galContainer.innerHTML = '';
      (data.images || []).forEach(img => addShipGalleryRow(img));
    }

    updateLiveShipPreview();
  } catch (err) {
    console.error("Error loading ship into form:", err);
  }
}

function initNewShip() {
  currentShipData = null;
  const form = document.getElementById('crud-form-ship');
  if (form) form.reset();

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('s_id', 'nueva_nave');
  setVal('s_name', 'Nueva Nave Capital');
  setVal('s_category', 'fortress');
  setVal('s_class_name_es', 'Crucero Estelar Pesado');
  setVal('s_class_name_en', 'Heavy Space Cruiser');
  setVal('s_series_select', 'La Saga Macross (Primera Guerra Robotech)');
  setVal('s_faction_select', 'U.N. Spacy // Tierra Unificada');
  setVal('s_faction_logo', 'assets/images/ui/logo_UNSpacy.png');
  updateShipFactionLogoPreview();
  setVal('s_thumbnail', 'assets/images/ui/logo_UNSpacy.png');
  setVal('s_commissioned', '2010');
  setVal('s_command_es', 'Comandante en Jefe');
  setVal('s_complement_es', 'Tripulación Militar: ~5.000');
  setVal('s_airgroup_es', '60 Cazas Veritech');
  setVal('s_docked_es', 'Lanzaderas auxiliares');

  const chkMod = document.getElementById('s_is_modular');
  if (chkMod) chkMod.checked = false;
  toggleShipModularSection(false);

  setVal('s_dim_length', '600 m');
  setVal('s_dim_width', '250 m');
  setVal('s_dim_height', '180 m');
  setVal('s_dim_mass', '4.000.000 toneladas');
  setVal('s_prop_engines_es', 'Reactores Termonucleares Robotech');
  setVal('s_prop_fold_es', 'Generador Fold Estándar');
  setVal('s_def_armor_es', 'Casco Blindado C.D.M.');
  setVal('s_def_shields_es', 'Barrera Puntual Defensiva');

  setVal('s_stat_firepower', 90);
  setVal('s_stat_armor', 90);
  setVal('s_stat_capacity', 85);
  setVal('s_stat_range', 90);

  setVal('s_summary_es', '');
  setVal('s_summary_en', '');
  setVal('s_overview_es', '');
  setVal('s_tactical_es', '');

  const wContainer = document.getElementById('ship-weapons-container');
  if (wContainer) {
    wContainer.innerHTML = '';
    addShipWeaponRow({ name_es: 'Baterías de Cañones Láser Pesados', damage: '2.000 C.D.M.', range: '500 km', desc_es: 'Defensa primaria de superficie.' });
  }

  const secContainer = document.getElementById('ship-sections-container');
  if (secContainer) {
    secContainer.innerHTML = '';
    addShipSectionRow({ name_es: 'Puente de Mando', desc_es: 'Centro de control táctico y comunicaciones.' });
  }

  const galContainer = document.getElementById('ship-gallery-container');
  if (galContainer) {
    galContainer.innerHTML = '';
    addShipGalleryRow({ url: 'assets/images/ui/logo_UNSpacy.png', title_es: 'Perfil Táctico', title_en: 'Tactical Profile', type_es: 'Diseño Esquemático', type_en: 'Schematic Design' });
  }

  updateLiveShipPreview();
}

window.toggleShipModularSection = function(checked) {
  const container = document.getElementById('ship-modes-container');
  if (container) {
    container.style.display = checked ? 'block' : 'none';
  }
};

window.updateShipFactionFromSelect = function() {
  const sel = document.getElementById('s_faction_select');
  const logoInput = document.getElementById('s_faction_logo');
  if (!sel || !logoInput) return;
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.logo) {
    logoInput.value = opt.dataset.logo;
    updateShipFactionLogoPreview();
  }
  updateLiveShipPreview();
};

window.updateShipFactionLogoPreview = function() {
  const input = document.getElementById('s_faction_logo');
  const preview = document.getElementById('ship_faction_logo_preview');
  if (input && preview) {
    preview.src = input.value.trim() || 'assets/images/ui/logo_UNSpacy.png';
  }
};

window.addShipWeaponRow = function(data = {}) {
  const container = document.getElementById('ship-weapons-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.closest('.dyn-list-item').remove();" title="Eliminar arma">✕</button>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Nombre del Sistema (Español)</label>
        <input type="text" class="form-input shp-wpn-es" placeholder="ej: Cañón Principal de Haz Robotech" value="${data.name_es || ''}">
      </div>
      <div class="form-group">
        <label>Nombre del Sistema (English)</label>
        <input type="text" class="form-input shp-wpn-en" placeholder="ej: Main Particle Beam Cannon" value="${data.name_en || ''}">
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Daño Estimado (C.D.M. o Efecto)</label>
        <input type="text" class="form-input shp-wpn-dmg" placeholder="ej: Destrucción Masiva / 3.500 C.D.M." value="${data.damage || ''}">
      </div>
      <div class="form-group">
        <label>Alcance Efectivo</label>
        <input type="text" class="form-input shp-wpn-rng" placeholder="ej: 120.000 km" value="${data.range || ''}">
      </div>
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label>Descripción del Arma (Español)</label>
      <textarea class="form-textarea shp-wpn-desc-es" style="min-height:50px;" placeholder="Detalles de disparo, recarga y ángulo de cobertura...">${data.desc_es || ''}</textarea>
    </div>
  `;
  container.appendChild(div);
};

window.addShipSectionRow = function(data = {}) {
  const container = document.getElementById('ship-sections-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.closest('.dyn-list-item').remove();" title="Eliminar sección">✕</button>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Nombre de la Sección (Español)</label>
        <input type="text" class="form-input shp-sec-es" placeholder="ej: Macross City (Metrópolis Interior)" value="${data.name_es || ''}">
      </div>
      <div class="form-group">
        <label>Nombre de la Sección (English)</label>
        <input type="text" class="form-input shp-sec-en" placeholder="ej: Macross City (Interior Metropolis)" value="${data.name_en || ''}">
      </div>
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label>Descripción Operativa (Español)</label>
      <textarea class="form-textarea shp-sec-desc-es" style="min-height:50px;" placeholder="Ubicación, funciones y características de la sección...">${data.desc_es || ''}</textarea>
    </div>
  `;
  container.appendChild(div);
};

window.addShipGalleryRow = function(data = {}) {
  const container = document.getElementById('ship-gallery-container');
  if (!container) return;
  const thumbUrl = data.url || 'assets/images/ui/logo_UNSpacy.png';
  const isCover = document.getElementById('s_thumbnail')?.value === thumbUrl;
  const div = document.createElement('div');
  div.className = 'gallery-admin-row';
  div.innerHTML = `
    <img src="${thumbUrl}" class="gallery-admin-thumb" alt="Preview" onerror="this.src='assets/images/ui/logo_UNSpacy.png'">
    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; gap: 8px;">
        <input type="text" class="form-input gal-ship-url" placeholder="assets/images/naves/... o URL" value="${data.url || ''}" oninput="syncShipRowThumb(this); updateLiveShipPreview();">
        <button type="button" class="btn-action-secondary" onclick="openAssetBrowserForShipGalleryRow(this)" style="padding: 4px 10px; font-size: 0.72rem; white-space: nowrap;">
          📁 ELEGIR
        </button>
      </div>
      <div class="form-grid-3" style="gap: 6px;">
        <input type="text" class="form-input gal-ship-title-es" placeholder="Título foto (Español)" value="${data.title_es || ''}">
        <input type="text" class="form-input gal-ship-title-en" placeholder="Title (English)" value="${data.title_en || ''}">
        <select class="form-select gal-ship-type-es">
          <option value="Pintura Oficial" ${data.type_es === 'Pintura Oficial' ? 'selected' : ''}>Pintura Oficial</option>
          <option value="Diseño Esquemático" ${data.type_es === 'Diseño Esquemático' ? 'selected' : ''}>Diseño Esquemático</option>
          <option value="Render de Estudio" ${data.type_es === 'Render de Estudio' ? 'selected' : ''}>Render de Estudio</option>
          <option value="Lineart Estructural" ${data.type_es === 'Lineart Estructural' ? 'selected' : ''}>Lineart Estructural</option>
          <option value="Vista Dorsal / Popa" ${data.type_es === 'Vista Dorsal / Popa' ? 'selected' : ''}>Vista Dorsal / Popa</option>
          <option value="Torre de Mando" ${data.type_es === 'Torre de Mando' ? 'selected' : ''}>Torre de Mando</option>
          <option value="Arte Conceptual" ${data.type_es === 'Arte Conceptual' ? 'selected' : ''}>Arte Conceptual</option>
          <option value="Emblema / Insignia" ${data.type_es === 'Emblema / Insignia' ? 'selected' : ''}>Emblema / Insignia</option>
        </select>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
      <button type="button" class="btn-set-cover ${isCover ? 'active' : ''}" onclick="setAsShipThumbnail(this)">
        ${isCover ? '★ PORTADA ACTUAL' : '☆ HACER PORTADA'}
      </button>
      <button type="button" class="dyn-list-remove" style="position: static;" onclick="this.closest('.gallery-admin-row').remove(); updateLiveShipPreview();">✕</button>
    </div>
  `;
  container.appendChild(div);
};

window.setAsShipThumbnail = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const urlInp = row ? row.querySelector('.gal-ship-url') : null;
  if (!urlInp || !urlInp.value) return;

  const thumbInput = document.getElementById('s_thumbnail');
  if (thumbInput) thumbInput.value = urlInp.value;

  document.querySelectorAll('#ship-gallery-container .btn-set-cover').forEach(b => {
    b.classList.remove('active');
    b.textContent = '☆ HACER PORTADA';
  });
  btn.classList.add('active');
  btn.textContent = '★ PORTADA ACTUAL';

  updateLiveShipPreview();
};

window.syncShipRowThumb = function(input) {
  const row = input.closest('.gallery-admin-row');
  const img = row?.querySelector('.gallery-admin-thumb');
  if (img) img.src = input.value.trim() || 'assets/images/ui/logo_UNSpacy.png';
};

window.openAssetBrowserForNewShipGalleryItem = function() {
  openAssetBrowserCallback((chosenPath) => {
    addShipGalleryRow({
      url: chosenPath,
      title_es: 'Fotografía Naval',
      title_en: 'Naval Photo',
      type_es: 'Pintura Oficial',
      type_en: 'Official Art'
    });
    updateLiveShipPreview();
  });
};

window.openAssetBrowserForShipGalleryRow = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const input = row?.querySelector('.gal-ship-url');
  if (input) {
    openAssetBrowserCallback((chosenPath) => {
      input.value = chosenPath;
      syncShipRowThumb(input);
      updateLiveShipPreview();
    });
  }
};

function buildCurrentShipJSON() {
  const getVal = (id) => (document.getElementById(id)?.value || '').trim();
  const id = getVal('s_id') || 'nueva_nave';
  const name = getVal('s_name') || 'Nueva Nave Capital';
  const category = getVal('s_category') || 'fortress';
  const class_es = getVal('s_class_name_es') || 'Crucero Estelar';
  const class_en = getVal('s_class_name_en') || 'Space Cruiser';
  const series_es = getVal('s_series_select') || 'La Saga Macross (Primera Guerra Robotech)';
  const faction_es = getVal('s_faction_select') || 'U.N. Spacy // Tierra Unificada';
  const faction_logo = getVal('s_faction_logo') || 'assets/images/ui/logo_UNSpacy.png';
  const thumbnail = getVal('s_thumbnail') || 'assets/images/ui/logo_UNSpacy.png';
  const commissioned = getVal('s_commissioned') || 'Febrero de 2009';
  const command_es = getVal('s_command_es') || '';
  const complement_es = getVal('s_complement_es') || '';
  const airgroup_es = getVal('s_airgroup_es') || '';
  const docked_es = getVal('s_docked_es') || '';

  const is_modular = document.getElementById('s_is_modular')?.checked ?? true;

  const cruiserData = {
    name_es: getVal('s_mode_cruiser_name_es') || 'Modo Crucero de Batalla Aeroespacial',
    name_en: getVal('s_mode_cruiser_name_en') || 'Aerospace Battle Cruiser Mode',
    image: getVal('s_mode_cruiser_img') || thumbnail,
    length: getVal('s_mode_cruiser_length') || '1.210 m',
    width: getVal('s_mode_cruiser_width') || '496 m',
    height: getVal('s_mode_cruiser_height') || '312 m',
    desc_es: getVal('s_mode_cruiser_desc_es') || '',
    desc_en: 'Primary streamlined configuration for interplanetary cruise and orbital insertion.'
  };

  const attackData = {
    name_es: getVal('s_mode_attack_name_es') || 'Modo Ataque Humanoide (Attack Mode / Stormer)',
    name_en: getVal('s_mode_attack_name_en') || 'Humanoid Attack Mode (Stormer)',
    image: getVal('s_mode_attack_img') || thumbnail,
    length: getVal('s_mode_attack_length') || '1.200 m',
    width: getVal('s_mode_attack_width') || '600 m',
    height: getVal('s_mode_attack_height') || '1.200 m',
    desc_es: getVal('s_mode_attack_desc_es') || '',
    desc_en: 'Humanoid combat configuration where the hull articulates to bridge power conduits to the Main Gun.'
  };

  const dimensions = {
    length: getVal('s_dim_length') || '1.210 m',
    width: getVal('s_dim_width') || '496 m',
    height: getVal('s_dim_height') || '312 m',
    mass: getVal('s_dim_mass') || '18.000.000 toneladas'
  };

  const propulsion = {
    engines_es: getVal('s_prop_engines_es') || 'Motores Termonucleares Robotech',
    engines_en: 'Robotech Thermonuclear Engines',
    fold_system_es: getVal('s_prop_fold_es') || 'Generador Hiperespacial Fold Drive',
    fold_system_en: 'Robotech Space Fold Drive Generator'
  };

  const defenses = {
    armor_es: getVal('s_def_armor_es') || 'Superaleación Blindada Robotech',
    armor_en: 'Robotech High-Density Superalloy Hull',
    shields_es: getVal('s_def_shields_es') || 'Sistema de Barrera Puntual',
    shields_en: 'Pin-Point Barrier System (PPB)'
  };

  const fpVal = parseInt(getVal('s_stat_firepower')) || 100;
  const armVal = parseInt(getVal('s_stat_armor')) || 98;
  const capVal = parseInt(getVal('s_stat_capacity')) || 96;
  const rngVal = parseInt(getVal('s_stat_range')) || 92;

  const summary_es = getVal('s_summary_es');
  const summary_en = getVal('s_summary_en') || summary_es;
  const overview_es = getVal('s_overview_es');
  const tactical_es = getVal('s_tactical_es');

  // Armamento
  const weaponsList = [];
  document.querySelectorAll('#ship-weapons-container .dyn-list-item').forEach(item => {
    const wNameEs = item.querySelector('.shp-wpn-es')?.value.trim();
    if (wNameEs) {
      weaponsList.push({
        name_es: wNameEs,
        name_en: item.querySelector('.shp-wpn-en')?.value.trim() || wNameEs,
        damage: item.querySelector('.shp-wpn-dmg')?.value.trim() || 'Variable',
        range: item.querySelector('.shp-wpn-rng')?.value.trim() || 'Variable',
        desc_es: item.querySelector('.shp-wpn-desc-es')?.value.trim() || '',
        desc_en: item.querySelector('.shp-wpn-desc-es')?.value.trim() || ''
      });
    }
  });

  // Secciones
  const sectionsList = [];
  document.querySelectorAll('#ship-sections-container .dyn-list-item').forEach(item => {
    const sNameEs = item.querySelector('.shp-sec-es')?.value.trim();
    if (sNameEs) {
      sectionsList.push({
        name_es: sNameEs,
        name_en: item.querySelector('.shp-sec-en')?.value.trim() || sNameEs,
        desc_es: item.querySelector('.shp-sec-desc-es')?.value.trim() || '',
        desc_en: item.querySelector('.shp-sec-desc-es')?.value.trim() || ''
      });
    }
  });

  // Galería
  const imagesList = [];
  document.querySelectorAll('#ship-gallery-container .gallery-admin-row').forEach(row => {
    const url = row.querySelector('.gal-ship-url')?.value.trim();
    if (url) {
      const typeEs = row.querySelector('.gal-ship-type-es')?.value || 'Pintura Oficial';
      const typeMapEn = {
        'Pintura Oficial': 'Official Art',
        'Diseño Esquemático': 'Schematic Design',
        'Render de Estudio': 'Studio Render',
        'Lineart Estructural': 'Structural Lineart',
        'Vista Dorsal / Popa': 'Dorsal / Aft View',
        'Torre de Mando': 'Command Tower',
        'Arte Conceptual': 'Concept Art',
        'Emblema / Insignia': 'Naval Insignia'
      };
      imagesList.push({
        url: url,
        title_es: row.querySelector('.gal-ship-title-es')?.value.trim() || name,
        title_en: row.querySelector('.gal-ship-title-en')?.value.trim() || name,
        type_es: typeEs,
        type_en: typeMapEn[typeEs] || typeEs
      });
    }
  });

  return {
    id: id,
    name: name,
    class_name: { es: class_es, en: class_en },
    category: category,
    faction: { es: faction_es, en: faction_es },
    faction_logo: faction_logo,
    series: { es: series_es, en: series_es },
    commissioned: commissioned,
    commanding_officer: { es: command_es, en: command_es },
    complement: { es: complement_es, en: complement_es },
    air_group: { es: airgroup_es, en: airgroup_es },
    docked_vessels: { es: docked_es, en: docked_es },
    thumbnail: thumbnail,
    is_modular: is_modular,
    modes: is_modular ? { cruiser: cruiserData, attack: attackData } : null,
    dimensions: dimensions,
    propulsion: propulsion,
    defenses: defenses,
    stats: {
      firepower: fpVal,
      armor: armVal,
      capacity: capVal,
      range: rngVal
    },
    stats_detail: {
      firepower: { value: fpVal, label_es: "Potencia de Fuego Absoluta", label_en: "Absolute Firepower Rating", desc_es: "Evaluación de daño destructivo de las baterías principales y cañones de partículas." },
      armor: { value: armVal, label_es: "Resistencia Estructural y Blindaje", label_en: "Structural Hull Resilience", desc_es: "Capacidad de absorción de daño en blindaje C.D.M. y barreras energéticas." },
      capacity: { value: capVal, label_es: "Capacidad de Hangar y Tropas", label_en: "Hangar & Troop Capacity", desc_es: "Almacén para escuadrones Veritech, batallones de Destroids y personal." },
      range: { value: rngVal, label_es: "Alcance Operativo y Autonomía", label_en: "Operational Range & Endurance", desc_es: "Autonomía de navegación estelar y alcance de tiro balístico." }
    },
    weapons: weaponsList,
    internal_sections: sectionsList,
    lore: {
      overview_es: overview_es,
      overview_en: overview_es,
      tactical_analysis_es: tactical_es,
      tactical_analysis_en: tactical_es
    },
    summary: {
      es: summary_es || (overview_es ? overview_es.substring(0, 160) + '...' : ''),
      en: summary_en || (overview_es ? overview_es.substring(0, 160) + '...' : '')
    },
    images: imagesList.length > 0 ? imagesList : [{ url: thumbnail, title_es: name, title_en: name, type_es: "Pintura Oficial", type_en: "Official Art" }]
  };
}

function updateLiveShipPreview() {
  const container = document.getElementById('admin-live-ship-card');
  if (!container) return;

  const data = buildCurrentShipJSON();
  const catLabel = data.category ? data.category.toUpperCase() : 'FORTRESS';
  const factionText = data.faction?.es || 'U.N. Spacy';
  const summaryText = data.summary?.es || data.lore?.overview_es || 'Sin resumen disponible.';

  container.innerHTML = `
    <div class="mecha-card" style="box-shadow:none;">
      <div class="card-header-status">
        <div class="card-faction-badge" title="${factionText}">
          <img src="${data.faction_logo || 'assets/images/ui/logo_UNSpacy.png'}" class="card-faction-icon" alt="Faction">
          <span class="faction-tag">${factionText}</span>
        </div>
        <span class="card-category-tag">${data.is_modular ? 'MODULAR // TRANSFORMABLE' : 'CAPITAL SHIP'}</span>
      </div>

      <div class="card-image-wrap" style="position:relative; height: 230px;">
        <img src="${data.thumbnail || 'assets/images/ui/logo_UNSpacy.png'}" alt="${data.name}" style="object-position: center center;">
        <div class="image-overlay-hud"></div>
        <div style="position:absolute; bottom:8px; right:8px; background:rgba(6,16,29,0.85); border:1px solid var(--un-cyan); padding:2px 6px; font-family:var(--font-hud); font-size:0.65rem; color:var(--un-cyan); letter-spacing:1px;">
          CLASE: ${catLabel}
        </div>
      </div>

      <div class="card-body">
        <div class="card-title-group">
          <h3 class="card-title">${data.name}</h3>
          <div class="card-alias">${data.class_name?.es || 'Clase de Batalla'}</div>
        </div>

        <div style="margin-bottom: 8px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--hud-amber); letter-spacing: 0.8px;">
          ⌖ ${data.series?.es || ''}
        </div>

        <p class="card-summary">${summaryText}</p>

        <div class="stats-bars-container">
          <div class="stat-row">
            <span class="stat-label">FUEGO</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill firepower" style="width: ${data.stats.firepower}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${data.stats.firepower}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">BLINDAJE</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill armor" style="width: ${data.stats.armor}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${data.stats.armor}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">CAPACIDAD</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill speed" style="width: ${data.stats.capacity}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${data.stats.capacity}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">ALCANCE</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill sensors" style="width: ${data.stats.range}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${data.stats.range}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupShipEventListeners() {
  document.getElementById('crud-form-ship')?.addEventListener('input', () => {
    updateLiveShipPreview();
  });
}

function setupShipExportButtons() {
  // 1. Guardar directo en disco
  const btnSaveShip = document.getElementById('btn-save-ship-direct');
  if (btnSaveShip) {
    btnSaveShip.addEventListener('click', async () => {
      const data = buildCurrentShipJSON();
      const consoleBox = document.getElementById('git-status-console-ship');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color:var(--un-cyan);">[*] Guardando expediente naval militar en el disco duro local...</span>';
      }

      try {
        const res = await fetch('/api/save-ship', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ship: data })
        });

        if (res.ok) {
          const result = await res.json();
          window.tacticalAudio?.scan();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">✓ [ÉXITO] Ficha naval guardada en disco:</span>
              <br>• data/naves/${data.id}.json
              <br>• data/manifest_naves.json
              <br><span style="color: var(--text-dim);">${result.message || ''}</span>
            `;
          }

          // Refrescar selector de naves
          await loadAdminShipManifest();
          const select = document.getElementById('select-ship-to-edit');
          if (select) select.value = data.id;

        } else {
          throw new Error("El servidor local respondió con error.");
        }
      } catch (err) {
        console.warn("Fallo guardado por API /api/save-ship, usando fallback:", err);
        if (consoleBox) {
          consoleBox.innerHTML = '<span style="color: var(--skull-amber);">[!] Servidor API no disponible. Descargando archivo JSON manualmente...</span>';
        }
        downloadJSON(data, `${data.id}.json`);
      }
    });
  }

  // 2. Botón Subir Nave a GitHub (Git Push)
  const btnGitPushShip = document.getElementById('btn-git-push-ship');
  if (btnGitPushShip) {
    btnGitPushShip.addEventListener('click', async () => {
      const data = buildCurrentShipJSON();
      const consoleBox = document.getElementById('git-status-console-ship');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color: var(--skull-amber); font-weight: bold;">[*] Ejecutando protocolo militar Git: add, commit y push a GitHub...</span>\nPor favor espera unos segundos...';
      }

      btnGitPushShip.disabled = true;
      btnGitPushShip.style.opacity = '0.6';

      try {
        // Primero asegurar que la nave esté guardada en el disco
        await fetch('/api/save-ship', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ship: data })
        });

        const res = await fetch('/api/git-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commitMessage: `Update Robotech Capital Ships: ${data.name} (${data.id})` })
        });

        const result = await res.json();
        btnGitPushShip.disabled = false;
        btnGitPushShip.style.opacity = '1';

        if (result.success) {
          window.tacticalAudio?.scan();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">✓ [ÉXITO] Cambios sincronizados y subidos a GitHub:</span>
              <pre style="margin-top:6px; color:#a3e635; font-size:0.7rem;">${result.logs || 'Push exitoso.'}</pre>
            `;
          }
        } else {
          window.tacticalAudio?.alert();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--veritech-red); font-weight: bold;">✕ [AVISO / REPORTE GIT]:</span>
              <pre style="margin-top:6px; color:#ff9999; font-size:0.7rem;">${result.error || result.logs || 'Verifica tus credenciales de Git o conexión.'}</pre>
            `;
          }
        }
      } catch (err) {
        btnGitPushShip.disabled = false;
        btnGitPushShip.style.opacity = '1';
        window.tacticalAudio?.alert();
        if (consoleBox) {
          consoleBox.innerHTML = `<span style="color: var(--veritech-red);">✕ Error de comunicación con server.py: ${err.message}</span>`;
        }
      }
    });
  }

  // 3. Descarga manual opcional
  const btnDlShip = document.getElementById('btn-download-ship-json');
  if (btnDlShip) {
    btnDlShip.addEventListener('click', () => {
      const data = buildCurrentShipJSON();
      downloadJSON(data, `${data.id}.json`);
    });
  }
}

window.addShipWeaponRow = addShipWeaponRow;
window.addShipSectionRow = addShipSectionRow;
window.addShipGalleryRow = addShipGalleryRow;
window.setAsShipThumbnail = setAsShipThumbnail;
window.updateLiveShipPreview = updateLiveShipPreview;
window.updateShipFactionLogoPreview = updateShipFactionLogoPreview;
window.updateShipFactionFromSelect = updateShipFactionFromSelect;



