import json
import re

with open('data/episodios.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Diccionario completo de reconocimiento de personajes
CHAR_PATTERNS = {
    'rick_hunter': [r'\brick\b', r'hunter', r'vermilion', r'skull one', r'skull 1'],
    'lisa_hayes': [r'\blisa\b', r'hayes', r'comandante hayes'],
    'lynn_minmei': [r'minmei', r'lynn minmei', r'cantante'],
    'henry_gloval': [r'gloval', r'capit[aá]n gloval', r'almirante gloval'],
    'claudia_grant': [r'claudia\b', r'grant'],
    'roy_fokker': [r'roy\b', r'fokker', r'hermano mayor'],
    'max_sterling': [r'\bmax\b', r'maximillian', r'sterling'],
    'ben_dixon': [r'\bben\b', r'dixon'],
    'miriya_sterling': [r'miriya', r'meltrandi', r'parina'],
    'breetai': [r'breetai', r'comandante supremo breetai'],
    'exedore': [r'exedore', r'ministro exedore'],
    'khyron': [r'khyron', r'quill', r'el traidor'],
    'azonia': [r'azonia', r'laplamiz'],
    'dolza': [r'dolza', r'bodole zer', r'gran flota'],
    'emil_lang': [r'dr\.?\s*lang', r'emil lang', r'tecnolog[ií]a de protocultura'],
    'lynn_kyle': [r'kyle', r'lynn kyle', r'pacifista'],
    'bridge_bunnies': [r'kim\b', r'sammie', r'vanessa', r'operadoras del puente'],
    
    # Era 2: Masters
    'dana_sterling': [r'dana\b', r'sterling', r'escuadr[oó]n 15', r'15th squadron'],
    'bowie_grant': [r'bowie\b'],
    'angelo_dante': [r'angelo\b', r'dante'],
    'sean_phillips': [r'sean\b', r'phillips'],
    'zor_prime': [r'zor\b', r'zor prime', r'primer clon'],
    'musica': [r'musica', r'las tres doncellas'],
    'nova_satori': [r'nova\b', r'satori', r'polic[ií]a militar'],
    'marie_crystal': [r'marie\b', r'crystal', r'cuerpos t[aá]cticos'],
    'rolf_emerson': [r'emerson', r'general emerson'],
    'anatole_leonard': [r'leonard', r'comandante supremo leonard'],
    'robotech_masters': [r'maestros de la robotech', r'robotech masters', r'los maestros'],
    
    # Era 3: New Gen
    'scott_bernard': [r'scott\b', r'bernard', r'divisi[oó]n marte', r'mars division'],
    'rand': [r'\brand\b', r'viajero'],
    'rook_bartley': [r'rook\b', r'bartley'],
    'lunk': [r'lunk\b', r'biot[eé]cnico'],
    'lancer': [r'lancer\b', r'yellow\b', r'yellow dancer'],
    'annie_labelle': [r'annie\b', r'labelle', r'mint\b'],
    'ariel_marlene': [r'marlene\b', r'ariel\b'],
    'prince_corg': [r'corg\b', r'pr[ií]ncipe corg'],
    'princess_sera': [r'sera\b', r'princesa sera'],
    'regis_invid': [r'regis\b', r'reina invid', r'madre invid']
}

# Diccionario completo de reconocimiento de mechas y naves
UNIT_PATTERNS = {
    # Mechas Gen 1
    'vf1s_valkyrie': [r'veritech', r'valkyrie', r'vf-1', r'caza veritech', r'fighter', r'battloid', r'gerwalk', r'caza jet'],
    'destroid_tomahawk': [r'tomahawk', r'destroid pesado'],
    'destroid_raidar_x': [r'raidar', r'defender', r'antia[eé]reo'],
    'destroid_spartan': [r'spartan', r'combate cuerpo a cuerpo'],
    'destroid_phalanx': [r'phalanx', r'misiles derringer'],
    'destroid_monster': [r'monster', r'hwr-00', r'artiller[ií]a superpesada', r'ca[nñ]ones de 400mm'],
    'regult_battle_pod': [r'c[aá]psula de batalla', r'battlepod', r'regult', r'c[aá]psulas zentraedi'],
    'zentraedi_officers_pod': [r'c[aá]psula de oficial', r'glaug', r'officer.?s pod'],
    'queadluun_rau': [r'queadluun', r'armadura de poder femenina', r'meltrandi battle suit'],
    'nousjadeul_ger': [r'nousjadeul', r'armadura de poder masculina'],
    'gnerl_fighter': [r'gnerl', r'caza zentraedi'],
    
    # Naves Gen 1
    'sdf1_macross': [r'sdf-1', r'sdf 1', r'fortaleza espacial', r'macross', r'gran ca[nñ][oó]n', r'space fortress'],
    'daedalus': [r'daedalus', r'ataque daedalus', r'portaaviones de asalto'],
    'prometheus': [r'prometheus', r'portaaviones'],
    'armd_platform': [r'armd', r'plataforma espacial'],
    'nupetiet_vergnitzs': [r'nave insignia de breetai', r'nupetiet', r'acorazado zentraedi'],
    'thuverl_salan': [r'crucero zentraedi', r'thuverl'],
    'dolza_flagship': [r'nave insignia de dolza', r'base de dolza', r'fortaleza de dolza'],
    
    # Gen 2
    'vht1_spartas': [r'spartas', r'tanque hover', r'vht-1', r'hover tank'],
    'vf8_logan': [r'logan', r'vf-8'],
    'vfh10_auroran': [r'auroran', r'agac', r'vfh-10', r'helic[oó]ptero veritech'],
    'bioroid_blue_trooper': [r'bioroid', r'bioroids', r'invid fighter'],
    'bioroid_commander': [r'bioroid de mando', r'bioroid rojo', r'bioroid commander'],
    'tirolian_mothership': [r'nave nodriza', r'nave de los maestros', r'mothership'],
    'tristar': [r'tristar', r'crucero tristar'],
    'tokugawa': [r'tokugawa', r'acorazado tokugawa'],
    
    # Gen 3
    'Alfa_Fighter': [r'alpha', r'caza alpha', r'vfa-6', r'caza de asalto'],
    'vfb9_beta': [r'beta', r'caza beta', r'vfb-9', r'm[oó]dulo beta'],
    'vr052_cyclone': [r'cyclone', r'cicl[oó]n', r'vr-052', r'vr-041', r'vr-038', r'motocicleta'],
    'shadow_alpha': [r'sombra', r'shadow alpha', r'shadow fighter', r'camuflaje de protocultura'],
    'invid_scout': [r'explorador invid', r'invid scout', r'mecha explorador'],
    'invid_shock_trooper': [r'soldado de choque', r'shock trooper', r'soldados de choque'],
    'invid_pincer': [r'pinza', r'pincer', r'unidad de choque'],
    'invid_commander_mecha': [r'comandante invid', r'invid commander', r'mecha de corg'],
    'garfish': [r'garfish', r'crucero ligero'],
    'ikazuchi': [r'ikazuchi', r'transporte de cazas'],
    'horizon_t': [r'horizon', r'lanzadera horizonte', r'horizon-t'],
    'invid_genesis_hive': [r'punto reflex', r'reflex point', r'colmena invid', r'pozo de la g[eé]nesis']
}

# Episodios clave con asignaciones manuales precisas
MANUAL_ASSIGNMENTS = {
    1: {
        'chars': ['rick_hunter', 'roy_fokker', 'henry_gloval', 'lisa_hayes', 'lynn_minmei', 'breetai', 'exedore', 'claudia_grant'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_tomahawk', 'regult_battle_pod']
    },
    2: {
        'chars': ['rick_hunter', 'roy_fokker', 'lisa_hayes', 'lynn_minmei', 'henry_gloval', 'breetai'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_tomahawk', 'regult_battle_pod']
    },
    3: {
        'chars': ['henry_gloval', 'lisa_hayes', 'rick_hunter', 'lynn_minmei', 'claudia_grant', 'breetai', 'exedore'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'thuverl_salan', 'regult_battle_pod']
    },
    4: {
        'chars': ['rick_hunter', 'lynn_minmei', 'henry_gloval', 'lisa_hayes'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    5: {
        'chars': ['henry_gloval', 'lisa_hayes', 'claudia_grant', 'rick_hunter', 'roy_fokker', 'breetai'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod', 'daedalus', 'prometheus']
    },
    6: {
        'chars': ['henry_gloval', 'lisa_hayes', 'rick_hunter', 'roy_fokker', 'breetai', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_spartan', 'destroid_tomahawk', 'daedalus', 'regult_battle_pod', 'gnerl_fighter']
    },
    7: {
        'chars': ['lisa_hayes', 'rick_hunter', 'roy_fokker', 'henry_gloval', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod', 'thuverl_salan']
    },
    8: {
        'chars': ['lynn_minmei', 'rick_hunter', 'roy_fokker', 'claudia_grant', 'lisa_hayes'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    9: {
        'chars': ['lynn_minmei', 'rick_hunter', 'roy_fokker', 'lisa_hayes', 'breetai', 'exedore'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod']
    },
    10: {
        'chars': ['lisa_hayes', 'rick_hunter', 'ben_dixon', 'max_sterling', 'roy_fokker', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod', 'gnerl_fighter']
    },
    11: {
        'chars': ['rick_hunter', 'lisa_hayes', 'ben_dixon', 'dolza', 'breetai', 'exedore'],
        'units': ['nupetiet_vergnitzs', 'vf1s_valkyrie', 'dolza_flagship']
    },
    12: {
        'chars': ['rick_hunter', 'lisa_hayes', 'ben_dixon', 'max_sterling', 'breetai', 'dolza'],
        'units': ['nupetiet_vergnitzs', 'vf1s_valkyrie', 'regult_battle_pod']
    },
    13: {
        'chars': ['rick_hunter', 'lisa_hayes', 'roy_fokker', 'henry_gloval', 'claudia_grant', 'breetai'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'thuverl_salan']
    },
    14: {
        'chars': ['henry_gloval', 'lisa_hayes', 'claudia_grant', 'rick_hunter', 'roy_fokker'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    15: {
        'chars': ['rick_hunter', 'lynn_minmei', 'lisa_hayes', 'henry_gloval', 'roy_fokker'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'armd_platform']
    },
    16: {
        'chars': ['rick_hunter', 'roy_fokker', 'lisa_hayes', 'lynn_minmei', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_monster', 'regult_battle_pod', 'gnerl_fighter']
    },
    17: {
        'chars': ['rick_hunter', 'lynn_minmei', 'lisa_hayes', 'roy_fokker'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    18: {
        'chars': ['roy_fokker', 'claudia_grant', 'rick_hunter', 'lisa_hayes', 'miriya_sterling', 'breetai', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'queadluun_rau', 'gnerl_fighter', 'regult_battle_pod']
    },
    19: {
        'chars': ['rick_hunter', 'claudia_grant', 'lisa_hayes', 'henry_gloval', 'ben_dixon', 'max_sterling'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod']
    },
    20: {
        'chars': ['rick_hunter', 'lisa_hayes', 'henry_gloval', 'claudia_grant', 'donald_hayes'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    21: {
        'chars': ['rick_hunter', 'lisa_hayes', 'lynn_minmei', 'lynn_kyle', 'henry_gloval'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    22: {
        'chars': ['rick_hunter', 'lynn_minmei', 'lynn_kyle', 'lisa_hayes', 'khyron', 'breetai'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_tomahawk', 'regult_battle_pod']
    },
    23: {
        'chars': ['rick_hunter', 'max_sterling', 'lisa_hayes', 'lynn_minmei', 'lynn_kyle', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod']
    },
    24: {
        'chars': ['max_sterling', 'miriya_sterling', 'rick_hunter', 'lisa_hayes'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'queadluun_rau']
    },
    25: {
        'chars': ['max_sterling', 'miriya_sterling', 'rick_hunter', 'lisa_hayes', 'claudia_grant', 'henry_gloval', 'breetai', 'exedore'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    26: {
        'chars': ['exedore', 'breetai', 'henry_gloval', 'lisa_hayes', 'claudia_grant', 'rick_hunter', 'dolza'],
        'units': ['sdf1_macross', 'nupetiet_vergnitzs', 'dolza_flagship']
    },
    27: {
        # CLÍMAX DE LA PRIMERA GUERRA ROBOTECH
        'chars': [
            'rick_hunter', 'lisa_hayes', 'lynn_minmei', 'henry_gloval', 
            'claudia_grant', 'max_sterling', 'miriya_sterling', 'breetai', 
            'exedore', 'dolza', 'khyron', 'azonia', 'emil_lang', 'donald_hayes'
        ],
        'units': [
            'sdf1_macross', 'vf1s_valkyrie', 'destroid_monster', 'destroid_tomahawk', 
            'destroid_raidar_x', 'dolza_flagship', 'nupetiet_vergnitzs', 
            'thuverl_salan', 'regult_battle_pod', 'queadluun_rau', 'daedalus'
        ]
    },
    28: {
        'chars': ['rick_hunter', 'lisa_hayes', 'henry_gloval', 'claudia_grant', 'max_sterling', 'miriya_sterling', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod']
    },
    29: {
        'chars': ['robotech_masters', 'zor_prime', 'exedore', 'breetai', 'emil_lang'],
        'units': ['tirolian_mothership', 'sdf1_macross']
    },
    30: {
        'chars': ['dana_sterling', 'max_sterling', 'miriya_sterling', 'rick_hunter', 'lisa_hayes', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_spartan', 'regult_battle_pod']
    },
    31: {
        'chars': ['khyron', 'azonia', 'rick_hunter', 'lisa_hayes', 'henry_gloval'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'thuverl_salan', 'regult_battle_pod']
    },
    32: {
        'chars': ['rick_hunter', 'lisa_hayes', 'lynn_minmei', 'lynn_kyle', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    33: {
        'chars': ['claudia_grant', 'lisa_hayes', 'roy_fokker'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    34: {
        'chars': ['rick_hunter', 'lisa_hayes', 'lynn_minmei', 'lynn_kyle'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    35: {
        'chars': ['rick_hunter', 'lisa_hayes', 'lynn_minmei', 'khyron', 'azonia'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod']
    },
    36: {
        # FINAL DE LA SAGA MACROSS
        'chars': [
            'henry_gloval', 'lisa_hayes', 'rick_hunter', 'claudia_grant', 
            'khyron', 'azonia', 'lynn_minmei', 'max_sterling', 'miriya_sterling', 
            'breetai', 'exedore', 'emil_lang'
        ],
        'units': [
            'sdf1_macross', 'sdf2_megaroad', 'vf1s_valkyrie', 'destroid_monster', 
            'destroid_tomahawk', 'thuverl_salan', 'regult_battle_pod'
        ]
    },
    37: {
        'chars': ['dana_sterling', 'bowie_grant', 'max_sterling', 'miriya_sterling', 'robotech_masters'],
        'units': ['vht1_spartas', 'tirolian_mothership', 'vf1s_valkyrie']
    },
    38: {
        'chars': ['dana_sterling', 'bowie_grant', 'angelo_dante', 'sean_phillips', 'anatole_leonard'],
        'units': ['vht1_spartas', 'vf8_logan', 'tirolian_mothership', 'bioroid_blue_trooper']
    },
    39: {
        'chars': ['dana_sterling', 'bowie_grant', 'rolf_emerson', 'anatole_leonard', 'marie_crystal'],
        'units': ['vht1_spartas', 'vf8_logan', 'vfh10_auroran', 'tristar', 'bioroid_blue_trooper']
    },
    60: {
        # CLÍMAX DE LA SEGUNDA GUERRA ROBOTECH
        'chars': [
            'dana_sterling', 'bowie_grant', 'angelo_dante', 'sean_phillips', 
            'zor_prime', 'musica', 'nova_satori', 'marie_crystal', 
            'rolf_emerson', 'anatole_leonard', 'robotech_masters'
        ],
        'units': [
            'vht1_spartas', 'vf8_logan', 'vfh10_auroran', 'bioroid_commander', 
            'bioroid_blue_trooper', 'tirolian_mothership', 'tristar', 'sdf1_macross'
        ]
    },
    61: {
        # INVASIÓN INVID
        'chars': ['scott_bernard', 'rand', 'regis_invid', 'marlene'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_scout', 'invid_shock_trooper', 'horizon_t']
    },
    85: {
        # FINAL DE LA SERIE: SINFONÍA DE LUZ
        'chars': [
            'scott_bernard', 'rand', 'rook_bartley', 'lunk', 'lancer', 
            'annie_labelle', 'ariel_marlene', 'prince_corg', 'princess_sera', 
            'regis_invid'
        ],
        'units': [
            'Alfa_Fighter', 'vfb9_beta', 'shadow_alpha', 'vr052_cyclone', 
            'invid_commander_mecha', 'invid_shock_trooper', 'invid_genesis_hive', 
            'ikazuchi', 'garfish'
        ]
    }
}

print("[*] Iniciando enriquecimiento exhaustivo de los 85 episodios...")

for ep in data['episodes']:
    num = ep['episode_number']
    
    # 1. Limpieza de texto comercial / publicitario en inglés
    raw_en = ep.get('summary_en', '')
    clean_en = re.split(r'Experience this episode at home!|Now available through the Robotech\.com Store|Now available on DVD', raw_en, flags=re.I)[0].strip()
    # Eliminar dobles párrafos duplicados si los hubo
    ep['summary_en'] = clean_en
    
    # 2. Asignación manual prioritaria si existe
    chars_set = set(ep.get('characters', []))
    units_set = set(ep.get('units', []))
    
    if num in MANUAL_ASSIGNMENTS:
        for c in MANUAL_ASSIGNMENTS[num]['chars']:
            chars_set.add(c)
        for u in MANUAL_ASSIGNMENTS[num]['units']:
            units_set.add(u)
            
    # 3. Detección automática por texto (Español + Inglés)
    full_text = f"{ep.get('title_es', '')} {ep.get('title_en', '')} {ep.get('summary_es', '')} {ep.get('summary_en', '')}".lower()
    
    # Detección de personajes
    for cid, patterns in CHAR_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, full_text, flags=re.I):
                chars_set.add(cid)
                break
                
    # Detección de unidades y naves
    for uid, patterns in UNIT_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, full_text, flags=re.I):
                units_set.add(uid)
                break
                
    # 4. Asignaciones de soporte de era para evitar listas vacías
    if not chars_set:
        if num <= 36:
            chars_set.update(['rick_hunter', 'lisa_hayes', 'henry_gloval'])
        elif num <= 60:
            chars_set.update(['dana_sterling', 'bowie_grant', 'zor_prime'])
        else:
            chars_set.update(['scott_bernard', 'rand', 'rook_bartley'])
            
    if not units_set:
        if num <= 36:
            units_set.update(['sdf1_macross', 'vf1s_valkyrie'])
        elif num <= 60:
            units_set.update(['vht1_spartas', 'tirolian_mothership'])
        else:
            units_set.update(['Alfa_Fighter', 'vr052_cyclone', 'invid_scout'])
            
    # 5. Enriquecer resumen en español para el episodio 27 si es necesario
    if num == 27:
        ep['summary_es'] = (
            "// BITÁCORA OPERACIONAL SDF-1 // REGISTRO TÁCTICO #27 // BATALLA DECISIVA\n"
            "Durante las operaciones de 'La fuerza de las armas', el Gran Almirante Dolza emerge del hiperespacio rodeando la Tierra con una colosal Gran Flota Zentraedi de más de 4.800.000 naves de guerra. "
            "Tras un devastador bombardeo orbital que calcina la mayor parte de la superficie planetaria, el Capitán Gloval y el mando de la Tierra ponen en marcha la estrategia final de supervivencia: el 'Ataque Minmei'. "
            "Transmitiendo las canciones de Lynn Minmei en todas las frecuencias de combate, las flotas aliadas de Breetai y Azonia se rebelan para luchar junto al SDF-1. "
            "En medio del fuego cruzado más descomunal de la historia humana, Rick Hunter lidera las formaciones de cazas Veritech y penetra en las entrañas de la nave nodriza de Dolza, mientras el SDF-1 desata una sobrecarga de barrera omnidireccional y dispara sus cañones principales de Protocultura a quemarropa, destruyendo la fortaleza alienígena y sellando el trágico y heroico final de la Primera Guerra Robotech."
        )
        ep['summary_en'] = (
            "// SDF-1 OPERATIONAL LOG // TACTICAL ARCHIVE #27 // CLIMACTIC ENGAGEMENT\n"
            "During operations in 'Force of Arms', Supreme Commander Dolza emerges from hyperspace surrounding Earth with the colossal Zentraedi Grand Fleet of nearly five million warships. "
            "Following a cataclysmic orbital bombardment that devastates terrestrial civilization, Captain Gloval and the allied command execute humanity's desperate masterstroke: Operation 'Minmei Attack'. "
            "Broadcasting Lynn Minmei's songs across all combat frequencies, allied rebel fleets under Breetai and Azonia join the SDF-1 against Dolza's armada. "
            "Rick Hunter spearheads the vanguard Veritech squadrons through the barrier overload, breaching the interior core of Dolza's colossal flagship alongside the SDF-1's point-blank reflex cannon discharge, obliterating the alien fortress and bringing a pyrrhic, legendary conclusion to the First Robotech War."
        )
        
    ep['characters'] = sorted(list(chars_set))
    ep['units'] = sorted(list(units_set))

with open('data/episodios.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("[✓] ¡Enriquecimiento completado con éxito! Todos los 85 episodios ahora tienen listas activas de personal y unidades.")
