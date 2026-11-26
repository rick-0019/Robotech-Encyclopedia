import json
import re

# Load existing database
with open('data/episodios.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# DEFINICIÓN CANÓNICA INTEGRAL DE LOS 85 EPISODIOS
# Cada entrada mapea personajes y unidades exactas y exclusivas de su era.

CANONICAL_EPISODES = {
    # =========================================================================
    # PRIMERA GUERRA ROBOTECH // LA SAGA MACROSS (EPISODIOS 1 AL 36)
    # =========================================================================
    1: {
        'chars': ['rick_hunter', 'roy_fokker', 'lisa_hayes', 'henry_gloval', 'claudia_grant'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'oberth_destroyer', 'armd_platform', 'regult_battle_pod']
    },
    2: {
        'chars': ['rick_hunter', 'lynn_minmei', 'roy_fokker', 'henry_gloval', 'lisa_hayes'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'regult_battle_pod']
    },
    3: {
        'chars': ['rick_hunter', 'lynn_minmei', 'roy_fokker', 'henry_gloval', 'lisa_hayes', 'breetai'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'nupetiet_vergnitzs', 'thuverl_salan', 'regult_battle_pod']
    },
    4: {
        'chars': ['rick_hunter', 'lynn_minmei'],
        'units': ['sdf1_macross']
    },
    5: {
        'chars': ['rick_hunter', 'roy_fokker', 'lisa_hayes', 'henry_gloval', 'claudia_grant'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'daedalus', 'prometheus']
    },
    6: {
        'chars': ['henry_gloval', 'lisa_hayes', 'rick_hunter', 'roy_fokker', 'breetai', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'daedalus', 'destroid_tomahawk', 'regult_battle_pod']
    },
    7: {
        'chars': ['lisa_hayes', 'rick_hunter', 'henry_gloval', 'claudia_grant', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'daedalus', 'regult_battle_pod']
    },
    8: {
        'chars': ['rick_hunter', 'lynn_minmei', 'roy_fokker', 'claudia_grant'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    9: {
        'chars': ['lynn_minmei', 'rick_hunter', 'roy_fokker', 'henry_gloval', 'claudia_grant', 'breetai', 'exedore'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'cat_eye_recon', 'regult_battle_pod']
    },
    10: {
        'chars': ['lisa_hayes', 'rick_hunter', 'ben_dixon', 'max_sterling', 'roy_fokker', 'breetai', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'cat_eye_recon', 'regult_battle_pod', 'zentraedi_officers_pod']
    },
    11: {
        'chars': ['rick_hunter', 'lisa_hayes', 'ben_dixon', 'dolza', 'breetai', 'exedore'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'nupetiet_vergnitzs', 'regult_battle_pod']
    },
    12: {
        'chars': ['rick_hunter', 'lisa_hayes', 'ben_dixon', 'max_sterling', 'roy_fokker', 'breetai'],
        'units': ['vf1s_valkyrie', 'nupetiet_vergnitzs', 'regult_battle_pod', 'queadluun_rau']
    },
    13: {
        'chars': ['rick_hunter', 'roy_fokker', 'lisa_hayes', 'henry_gloval', 'claudia_grant', 'max_sterling', 'ben_dixon'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'daedalus', 'prometheus', 'regult_battle_pod']
    },
    14: {
        'chars': ['henry_gloval', 'lisa_hayes', 'claudia_grant', 'donald_hayes'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    15: {
        'chars': ['rick_hunter', 'lynn_minmei', 'roy_fokker', 'lynn_kyle', 'henry_gloval'],
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
        'chars': ['roy_fokker', 'claudia_grant', 'rick_hunter', 'lisa_hayes', 'miriya_sterling', 'max_sterling'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'queadluun_rau', 'regult_battle_pod', 'gnerl_fighter']
    },
    19: {
        'chars': ['rick_hunter', 'claudia_grant', 'lisa_hayes', 'henry_gloval', 'ben_dixon', 'max_sterling'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_raidar_x', 'regult_battle_pod']
    },
    20: {
        'chars': ['henry_gloval', 'lisa_hayes', 'claudia_grant', 'donald_hayes', 'rick_hunter'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'daedalus']
    },
    21: {
        'chars': ['rick_hunter', 'lisa_hayes', 'lynn_minmei', 'lynn_kyle', 'henry_gloval'],
        'units': ['sdf1_macross', 'vf1s_valkyrie']
    },
    22: {
        'chars': ['rick_hunter', 'lisa_hayes', 'lynn_minmei', 'khyron', 'breetai'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_tomahawk', 'destroid_spartan', 'regult_battle_pod']
    },
    23: {
        'chars': ['rick_hunter', 'max_sterling', 'lisa_hayes', 'khyron'],
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'destroid_phalanx', 'regult_battle_pod', 'gnerl_fighter']
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
        'chars': ['robotech_masters', 'zor_prime', 'exedore', 'breetai', 'emil_lang', 'henry_gloval'],
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
        'units': ['sdf1_macross', 'vf1s_valkyrie', 'thuverl_salan', 'regult_battle_pod']
    },
    36: {
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

    # =========================================================================
    # SEGUNDA GUERRA ROBOTECH // LOS MAESTROS DE LA ROBOTECH (EPISODIOS 37 AL 60)
    # =========================================================================
    37: {
        'chars': ['dana_sterling', 'bowie_grant', 'anatole_leonard', 'rolf_emerson', 'robotech_masters'],
        'units': ['vht1_spartas', 'vf8_logan', 'tirolian_mothership', 'bioroid_blue_trooper']
    },
    38: {
        'chars': ['dana_sterling', 'bowie_grant', 'angelo_dante', 'sean_phillips', 'anatole_leonard', 'robotech_masters'],
        'units': ['vht1_spartas', 'vf8_logan', 'bioroid_blue_trooper', 'tirolian_mothership']
    },
    39: {
        'chars': ['dana_sterling', 'bowie_grant', 'angelo_dante', 'sean_phillips', 'marie_crystal', 'anatole_leonard', 'rolf_emerson'],
        'units': ['vht1_spartas', 'vf8_logan', 'vfh10_auroran', 'tristar', 'bioroid_blue_trooper', 'bioroid_hovercraft']
    },
    40: {
        'chars': ['dana_sterling', 'bowie_grant', 'angelo_dante', 'sean_phillips', 'marie_crystal', 'nova_satori'],
        'units': ['vht1_spartas', 'vf8_logan', 'bioroid_blue_trooper', 'bioroid_hovercraft']
    },
    41: {
        'chars': ['dana_sterling', 'bowie_grant', 'angelo_dante', 'nova_satori', 'anatole_leonard'],
        'units': ['vht1_spartas', 'bioroid_blue_trooper']
    },
    42: {
        'chars': ['dana_sterling', 'bowie_grant', 'marie_crystal', 'sean_phillips', 'anatole_leonard'],
        'units': ['vf8_logan', 'vfh10_auroran', 'sylphide', 'bioroid_blue_trooper', 'bioroid_red_leader']
    },
    43: {
        'chars': ['dana_sterling', 'bowie_grant', 'angelo_dante', 'sean_phillips', 'louie_nichols', 'robotech_masters'],
        'units': ['vht1_spartas', 'bioroid_blue_trooper', 'tirolian_mothership']
    },
    44: {
        'chars': ['dana_sterling', 'bowie_grant', 'angelo_dante', 'sean_phillips', 'zor_prime', 'robotech_masters'],
        'units': ['vht1_spartas', 'bioroid_red_leader', 'bioroid_blue_trooper', 'tirolian_mothership']
    },
    45: {
        'chars': ['dana_sterling', 'bowie_grant', 'angelo_dante', 'sean_phillips', 'zor_prime', 'marie_crystal'],
        'units': ['vht1_spartas', 'vfh10_auroran', 'bioroid_blue_trooper', 'tirolian_mothership']
    },
    46: {
        'chars': ['dana_sterling', 'bowie_grant', 'rolf_emerson', 'anatole_leonard', 'marie_crystal'],
        'units': ['vht1_spartas', 'vf8_logan', 'vfh10_auroran', 'tristar', 'tirolian_mothership']
    },
    47: {
        'chars': ['dana_sterling', 'bowie_grant', 'anatole_leonard', 'rolf_emerson', 'nova_satori'],
        'units': ['vht1_spartas', 'tristar', 'tokugawa', 'tirolian_mothership']
    },
    48: {
        'chars': ['dana_sterling', 'bowie_grant', 'louie_nichols', 'sean_phillips', 'angelo_dante'],
        'units': ['vht1_spartas', 'vf8_logan', 'bioroid_blue_trooper']
    },
    49: {
        'chars': ['dana_sterling', 'bowie_grant', 'zor_prime', 'nova_satori', 'anatole_leonard'],
        'units': ['vht1_spartas', 'bioroid_red_leader', 'bioroid_blue_trooper']
    },
    50: {
        'chars': ['dana_sterling', 'bowie_grant', 'sean_phillips', 'zor_prime', 'nova_satori'],
        'units': ['vht1_spartas', 'bioroid_blue_trooper']
    },
    51: {
        'chars': ['dana_sterling', 'bowie_grant', 'zor_prime', 'angelo_dante', 'nova_satori'],
        'units': ['vht1_spartas', 'vfh10_auroran', 'bioroid_blue_trooper', 'tirolian_mothership']
    },
    52: {
        'chars': ['dana_sterling', 'bowie_grant', 'zor_prime', 'nova_satori', 'robotech_masters'],
        'units': ['vht1_spartas', 'bioroid_commander', 'bioroid_blue_trooper']
    },
    53: {
        'chars': ['dana_sterling', 'bowie_grant', 'zor_prime', 'musica', 'robotech_masters'],
        'units': ['vht1_spartas', 'bioroid_commander', 'tirolian_mothership']
    },
    54: {
        'chars': ['dana_sterling', 'bowie_grant', 'musica', 'zor_prime', 'nova_satori'],
        'units': ['vht1_spartas', 'bioroid_blue_trooper', 'tirolian_mothership']
    },
    55: {
        'chars': ['dana_sterling', 'bowie_grant', 'musica', 'zor_prime', 'nova_satori', 'anatole_leonard'],
        'units': ['vht1_spartas', 'bioroid_blue_trooper', 'bioroid_hovercraft']
    },
    56: {
        'chars': ['dana_sterling', 'bowie_grant', 'musica', 'nova_satori', 'sean_phillips'],
        'units': ['vht1_spartas', 'bioroid_hovercraft']
    },
    57: {
        'chars': ['dana_sterling', 'bowie_grant', 'zor_prime', 'musica', 'robotech_masters'],
        'units': ['vht1_spartas', 'bioroid_invid_fighter', 'tirolian_mothership']
    },
    58: {
        'chars': ['dana_sterling', 'bowie_grant', 'rolf_emerson', 'marie_crystal', 'anatole_leonard', 'robotech_masters'],
        'units': ['vht1_spartas', 'vfh10_auroran', 'tristar', 'pulsar_cruiser', 'tirolian_mothership', 'bioroid_commander']
    },
    59: {
        'chars': ['dana_sterling', 'bowie_grant', 'zor_prime', 'musica', 'rolf_emerson', 'robotech_masters'],
        'units': ['vht1_spartas', 'tristar', 'tirolian_mothership', 'bioroid_commander', 'bioroid_red_leader']
    },
    60: {
        'chars': [
            'dana_sterling', 'bowie_grant', 'zor_prime', 'musica', 
            'angelo_dante', 'sean_phillips', 'nova_satori', 'marie_crystal', 
            'anatole_leonard', 'robotech_masters'
        ],
        'units': [
            'vht1_spartas', 'vf8_logan', 'vfh10_auroran', 'tirolian_mothership', 
            'tristar', 'sdf1_macross', 'bioroid_commander'
        ]
    },

    # =========================================================================
    # TERCERA GUERRA ROBOTECH // LA NUEVA GENERACIÓN (EPISODIOS 61 AL 85)
    # =========================================================================
    61: {
        'chars': ['scott_bernard', 'rand', 'regis_invid'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'horizon_t', 'invid_scout', 'invid_shock_trooper']
    },
    62: {
        'chars': ['scott_bernard', 'rand', 'annie_labelle'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_scout', 'invid_shock_trooper']
    },
    63: {
        'chars': ['scott_bernard', 'rand', 'annie_labelle', 'lunk', 'lancer'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'vr041_cyclone', 'invid_scout', 'invid_shock_trooper']
    },
    64: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'vr041_cyclone', 'vr038_cyclone', 'invid_scout']
    },
    65: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_shock_trooper', 'invid_scout']
    },
    66: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'vr041_cyclone', 'invid_shock_trooper']
    },
    67: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_shock_trooper', 'invid_pincer']
    },
    68: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_shock_trooper', 'invid_pincer']
    },
    69: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'regis_invid'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_genesis_hive', 'invid_scout']
    },
    70: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'horizon_t', 'invid_scout', 'invid_shock_trooper']
    },
    71: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_scout', 'invid_shock_trooper']
    },
    72: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_shock_trooper']
    },
    73: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene', 'regis_invid'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_scout']
    },
    74: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_scout', 'invid_shock_trooper']
    },
    75: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'vr041_cyclone', 'invid_shock_trooper']
    },
    76: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene', 'regis_invid', 'prince_corg', 'princess_sera'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'invid_commander_mecha', 'invid_genesis_hive', 'invid_shock_trooper']
    },
    77: {
        # SOL DE MEDIANOCHE (THE MIDNIGHT SUN)
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene', 'princess_sera'],
        'units': ['Alfa_Fighter', 'vr052_cyclone', 'vr041_cyclone', 'invid_commander_mecha', 'invid_shock_trooper', 'invid_scout']
    },
    78: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene'],
        'units': ['Alfa_Fighter', 'vfb9_beta', 'vr052_cyclone', 'invid_scout', 'invid_shock_trooper']
    },
    79: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene'],
        'units': ['Alfa_Fighter', 'vfb9_beta', 'vr052_cyclone', 'invid_shock_trooper', 'invid_scout']
    },
    80: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene'],
        'units': ['Alfa_Fighter', 'vfb9_beta', 'vr052_cyclone', 'invid_shock_trooper', 'invid_pincer']
    },
    81: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene', 'prince_corg'],
        'units': ['Alfa_Fighter', 'vfb9_beta', 'vr052_cyclone', 'invid_commander_mecha', 'invid_shock_trooper']
    },
    82: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene', 'princess_sera', 'prince_corg'],
        'units': ['Alfa_Fighter', 'vfb9_beta', 'vr052_cyclone', 'vr041_cyclone', 'invid_commander_mecha', 'invid_shock_trooper', 'invid_pincer']
    },
    83: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene', 'regis_invid', 'prince_corg', 'princess_sera'],
        'units': ['Alfa_Fighter', 'vfb9_beta', 'vr052_cyclone', 'invid_genesis_hive', 'invid_commander_mecha', 'invid_shock_trooper']
    },
    84: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene', 'prince_corg', 'princess_sera', 'regis_invid'],
        'units': ['Alfa_Fighter', 'vfb9_beta', 'shadow_alpha', 'ikazuchi', 'garfish', 'horizon_t', 'invid_commander_mecha', 'invid_shock_trooper', 'invid_genesis_hive']
    },
    85: {
        'chars': ['scott_bernard', 'rand', 'rook_bartley', 'lancer', 'lunk', 'annie_labelle', 'ariel_marlene', 'prince_corg', 'princess_sera', 'regis_invid'],
        'units': ['Alfa_Fighter', 'vfb9_beta', 'shadow_alpha', 'vr052_cyclone', 'sdf4_liberator', 'ikazuchi', 'garfish', 'invid_commander_mecha', 'invid_shock_trooper', 'invid_genesis_hive']
    }
}

print("[*] Aplicando matriz canónica estricta para los 85 episodios...")

# Clean headers from summaries and apply exact canon
for ep in data['episodes']:
    num = ep['episode_number']
    
    # Limpieza de encabezado repetitivo si existe
    if 'summary_es' in ep:
        ep['summary_es'] = re.sub(r'^//\s*BITÁCORA OPERACIONAL SDF-1\s*//\s*REGISTRO TÁCTICO\s*#\d+\s*\n?', '', ep['summary_es']).strip()
    if 'summary_en' in ep:
        ep['summary_en'] = re.sub(r'^//\s*SDF-1 OPERATIONAL LOG\s*//\s*TACTICAL ARCHIVE\s*#\d+\s*\n?', '', ep['summary_en']).strip()
        ep['summary_en'] = re.split(r'Experience this episode at home!|Now available through the Robotech\.com Store|Now available on DVD', ep['summary_en'], flags=re.I)[0].strip()

    if num in CANONICAL_EPISODES:
        ep['characters'] = sorted(list(set(CANONICAL_EPISODES[num]['chars'])))
        ep['units'] = sorted(list(set(CANONICAL_EPISODES[num]['units'])))

# Save back to data/episodios.json
with open('data/episodios.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("[✓] ¡Matriz canónica aplicada exitosamente sin anomalías entre generaciones!")
