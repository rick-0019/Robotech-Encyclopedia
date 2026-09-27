/**
 * Robotech Admin Studio Logic
 * Maneja el CRUD local con selectores dinámicos, creación rápida con [+],
 * gestor visual de galería y exportación limpia para GitHub Pages.
 */

let currentManifest = null;
let currentMechaData = null;
let currentTaxonomies = null;
let currentTaxModalType = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadTaxonomies();
  await loadAdminManifest();
  setupFormListeners();
  setupExportButtons();

  const select = document.getElementById('select-mecha-to-edit');
  if (select && select.options.length > 1) {
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
  }
});

// --------------------------------------------------------------------------
// 1. TAXONOMÍAS DINÁMICAS (Categorías, Facciones, Tipos, Series)
// --------------------------------------------------------------------------
async function loadTaxonomies() {
  try {
    const cached = localStorage.getItem('robotech_taxonomies');
    if (cached) {
      currentTaxonomies = JSON.parse(cached);
    } else {
      const res = await fetch('data/taxonomies.json');
      if (res.ok) {
        currentTaxonomies = await res.json();
      }
    }
  } catch (e) {
    console.warn("Could not load taxonomies:", e);
  }

  if (!currentTaxonomies) {
    currentTaxonomies = {
      categories: [
        { id: "destroid", label_es: "Destroids", label_en: "Destroids" },
        { id: "veritech", label_es: "Veritechs / Valkyries", label_en: "Veritechs / Valkyries" },
        { id: "zentraedi", label_es: "Fuerzas Zentraedi", label_en: "Zentraedi Forces" }
      ],
      factions: [
        { id: "un_spacy", name_es: "U.N. Spacy", name_en: "U.N. Spacy" },
        { id: "skull", name_es: "U.N. Spacy - Escuadrón Skull", name_en: "U.N. Spacy - Skull Squadron" },
        { id: "zentraedi", name_es: "Flota Principal Zentraedi (Boddole Zer)", name_en: "Zentraedi Main Fleet" }
      ],
      vehicle_types: [
        { name_es: "Destroid Antiaéreo No Transformable", name_en: "Non-Transformable Anti-Aircraft Destroid" },
        { name_es: "Destroid de Asalto y Artillería Pesada", name_en: "Heavy Battle & Assault Destroid" },
        { name_es: "Caza Variable Aeroespacial / Mecha Transformable", name_en: "Variable Aerospace Fighter" },
        { name_es: "Cápsula de Combate Bípeda Ligera / Espacial", name_en: "Light Bipedal Combat Pod" }
      ],
      series_eras: [
        { id: "macross", name_es: "La Saga Macross (Primera Guerra Robotech)", name_en: "The Macross Saga" },
        { id: "masters", name_es: "Los Maestros de la Robotech (Segunda Guerra)", name_en: "Robotech Masters" },
        { id: "invid", name_es: "La Nueva Generación / Era Invid (Tercera Guerra)", name_en: "The New Generation" }
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
      const logoSel = document.getElementById('m_faction_logo');
      if (logoSel) {
        if (logo) {
          logoSel.value = logo;
        } else {
          const txt = facSel.value.toLowerCase();
          logoSel.value = (txt.includes('zentraedi') || txt.includes('zentran') || txt.includes('meltrandi'))
            ? 'assets/images/ui/logo_zentran.png'
            : 'assets/images/ui/logo_UNSpacy.png';
        }
        updateFactionLogoPreview();
        updateLivePreview();
      }
    };
  }

  // 2b. Catálogo de Logos de Facción (Dinámico)
  const logoSel = document.getElementById('m_faction_logo');
  if (logoSel) {
    const logos = currentTaxonomies.faction_logos || [
      { id: 'un_spacy', name: 'Robotech Defense Force / U.N. Spacy', file: 'assets/images/ui/logo_UNSpacy.png' },
      { id: 'zentraedi', name: 'Fuerzas Zentraedi', file: 'assets/images/ui/logo_zentran.png' }
    ];
    const curVal = logoSel.value;
    logoSel.innerHTML = `
      <option value="">-- Detección Automática por Facción --</option>
      ${logos.map(l => `<option value="${l.file}">${l.name} (${l.file.split('/').pop()})</option>`).join('')}
    `;
    if (curVal) logoSel.value = curVal;
  }

  // 3. Tipos de Vehículo
  const typeSel = document.getElementById('m_type_select');
  if (typeSel) {
    typeSel.innerHTML = currentTaxonomies.vehicle_types.map(t => 
      `<option value="${t.name_es}" data-en="${t.name_en}">${t.name_es}</option>`
    ).join('');
  }

  // 4. Series / Eras
  const serSel = document.getElementById('m_series_select');
  if (serSel) {
    serSel.innerHTML = currentTaxonomies.series_eras.map(s => 
      `<option value="${s.name_es}" data-en="${s.name_en}">${s.name_es}</option>`
    ).join('');
  }
}

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
  const logo = document.getElementById('m_faction_logo')?.value || (faction.toLowerCase().includes('zentraedi') || faction.toLowerCase().includes('zentran') ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo_UNSpacy.png');
  const thumb = document.getElementById('m_thumbnail').value || 'assets/images/mechas/destroid_raidar_x/b0eca7d9ebe0c448feae08c391418ea8.jpg';
  
  const speed = parseFloat(document.getElementById('m_stat_speed_val').value) || 0;
  const armor = parseInt(document.getElementById('m_stat_armor_val').value) || 0;
  const firepower = parseInt(document.getElementById('m_stat_firepower_val').value) || 0;
  const sensors = parseInt(document.getElementById('m_stat_sensors_val').value) || 0;

  preview.innerHTML = `
    <div class="mecha-card" style="box-shadow: none;">
      <div class="card-header-status">
        <div class="card-faction-badge">
          <img src="${logo}" class="card-faction-icon" alt="${faction}" style="width:16px; height:16px; object-fit:contain;">
          <span class="faction-tag">${faction}</span>
        </div>
        <span class="badge-tag">VISTA PREVIA</span>
      </div>
      <div class="card-image-wrap" style="height: 180px;">
        <img src="${thumb}" alt="${name}" onerror="this.src='assets/images/mechas/destroid_raidar_x/b0eca7d9ebe0c448feae08c391418ea8.jpg'">
        <div class="image-overlay-hud"></div>
      </div>
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
    series: { es: series_es, en: series_en },
    faction: { es: faction_es, en: faction_en },
    vehicle_type: { es: type_es, en: type_en },
    crew: { es: crew_es, en: crew_es },
    thumbnail: thumbnail,
    faction_logo: document.getElementById('m_faction_logo')?.value || (category === 'zentraedi' ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo.png'),
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
  if (currentAssetTarget === 'm_thumbnail') {
    const thumbInput = document.getElementById('m_thumbnail');
    if (thumbInput) thumbInput.value = path;
    updateLivePreview();
  } else if (currentAssetTarget === 'new_gallery_row') {
    const filename = path.split('/').pop().replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    addGalleryRow({
      url: path,
      title_es: filename,
      title_en: filename,
      type: 'render'
    });
    updateLivePreview();
  } else if (currentAssetTarget && typeof currentAssetTarget === 'object' && currentAssetTarget.tagName === 'INPUT') {
    currentAssetTarget.value = path;
    syncRowThumb(currentAssetTarget);
    updateLivePreview();
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

  // Determinar carpeta destino: Si el usuario seleccionó una carpeta específica en el filtro, subir allí; si no, usar el ID del mecha
  const selectedFolder = document.getElementById('asset-folder-filter')?.value;
  const mechaId = document.getElementById('m_id')?.value?.trim();
  let folder = 'uploads';
  if (selectedFolder && selectedFolder !== 'all') {
    folder = selectedFolder;
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

window.addMdcRow = addMdcRow;
window.addWeaponRow = addWeaponRow;
window.addGalleryRow = addGalleryRow;
window.updateLivePreview = updateLivePreview;
window.updateFactionLogoPreview = updateFactionLogoPreview;


