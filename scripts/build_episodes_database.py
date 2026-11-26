import urllib.request
import json
import os
import re
import time
from bs4 import BeautifulSoup
from PIL import Image, ImageOps
import io

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
IMAGES_DIR = os.path.join(BASE_DIR, 'assets', 'images', 'episodios')

os.makedirs(IMAGES_DIR, exist_ok=True)

# 1. Mapeo de personajes a IDs de nuestra base de datos
CHAR_MAP = {
    'rick hunter': 'rick_hunter',
    'roy fokker': 'roy_fokker',
    'henry gloval': 'henry_gloval',
    'gloval': 'henry_gloval',
    'lisa hayes': 'lisa_hayes',
    'lynn minmei': 'lynn_minmei',
    'minmei': 'lynn_minmei',
    'breetai': 'breetai',
    'exedore': 'exedore',
    'claudia grant': 'claudia_grant',
    'ben dixon': 'ben_dixon',
    'max sterling': 'max_sterling',
    'maximillian sterling': 'max_sterling',
    'miriya': 'miriya_sterling',
    'miriya sterling': 'miriya_sterling',
    'khyron': 'khyron',
    'azonia': 'azonia',
    'dolza': 'dolza',
    'emil lang': 'emil_lang',
    'dr. lang': 'emil_lang',
    'lynn kyle': 'lynn_kyle',
    'dana sterling': 'dana_sterling',
    'bowie grant': 'bowie_grant',
    'angelo dante': 'angelo_dante',
    'sean phillips': 'sean_phillips',
    'zor prime': 'zor_prime',
    'zor': 'zor_prime',
    'musica': 'musica',
    'nova satori': 'nova_satori',
    'marie crystal': 'marie_crystal',
    'rolf emerson': 'rolf_emerson',
    'anatole leonard': 'anatole_leonard',
    'supreme commander leonard': 'anatole_leonard',
    'scott bernard': 'scott_bernard',
    'rand': 'rand',
    'rook bartley': 'rook_bartley',
    'lunk': 'lunk',
    'lancer': 'lancer',
    'yellow dancer': 'lancer',
    'annie labelle': 'annie_labelle',
    'ariel': 'ariel_marlene',
    'marlene': 'ariel_marlene',
    'corg': 'prince_corg',
    'prince corg': 'prince_corg',
    'sera': 'princess_sera',
    'princess sera': 'princess_sera',
    'regis': 'regis_invid',
    'invid regis': 'regis_invid'
}

# 2. Mapeo de mechas y naves a IDs de nuestra base de datos
UNIT_MAP = {
    'sdf-1': {'id': 'sdf1_macross', 'type': 'ship', 'name': 'SDF-1 Macross'},
    'veritech vf-1s': {'id': 'vf1s_valkyrie', 'type': 'mecha', 'name': 'VF-1S Valkyrie'},
    'veritech vf-1j': {'id': 'vf1s_valkyrie', 'type': 'mecha', 'name': 'VF-1J Valkyrie'},
    'veritech vf-1a': {'id': 'vf1s_valkyrie', 'type': 'mecha', 'name': 'VF-1A Valkyrie'},
    'veritech vf-1d': {'id': 'vf1s_valkyrie', 'type': 'mecha', 'name': 'VF-1D Valkyrie'},
    'destroid tomahawk': {'id': 'destroid_tomahawk', 'type': 'mecha', 'name': 'Destroid Tomahawk'},
    'destroid defender': {'id': 'destroid_raidar_x', 'type': 'mecha', 'name': 'Destroid Raidar X (Defender)'},
    'destroid spartan': {'id': 'destroid_spartan', 'type': 'mecha', 'name': 'Destroid Spartan'},
    'destroid phalanx': {'id': 'destroid_phalanx', 'type': 'mecha', 'name': 'Destroid Phalanx'},
    'destroid monster': {'id': 'destroid_monster', 'type': 'mecha', 'name': 'Destroid Monster'},
    'battlepod, tactical': {'id': 'regult_battle_pod', 'type': 'mecha', 'name': 'Regult Tactical Pod'},
    'battlepod, officer’s': {'id': 'zentraedi_officers_pod', 'type': 'mecha', 'name': 'Glaug Officers Pod'},
    'queadluun-rau': {'id': 'queadluun_rau', 'type': 'mecha', 'name': 'Queadluun-Rau'},
    'nousjadeul-ger': {'id': 'nousjadeul_ger', 'type': 'mecha', 'name': 'Nousjadeul-Ger'},
    'gnerl': {'id': 'gnerl_fighter', 'type': 'mecha', 'name': 'Gnerl Fighter'},
    'veritech spartas': {'id': 'vht1_spartas', 'type': 'mecha', 'name': 'VHT-1 Spartas'},
    'veritech logan': {'id': 'vf8_logan', 'type': 'mecha', 'name': 'VF-8 Logan'},
    'veritech agac': {'id': 'vfh10_auroran', 'type': 'mecha', 'name': 'VFH-10 Auroran (AGAC)'},
    'bioroid commander': {'id': 'bioroid_commander', 'type': 'mecha', 'name': 'Bioroid Commander'},
    'bioroid soldier': {'id': 'bioroid_blue_trooper', 'type': 'mecha', 'name': 'Bioroid Blue Trooper'},
    'veritech alpha': {'id': 'Alfa_Fighter', 'type': 'mecha', 'name': 'VFA-6 Alpha Fighter'},
    'veritech beta': {'id': 'vfb9_beta', 'type': 'mecha', 'name': 'VFB-9 Beta Fighter'},
    'veritech cyclone': {'id': 'vr052_cyclone', 'type': 'mecha', 'name': 'VR-052 Cyclone'},
    'shadow fighter': {'id': 'shadow_alpha', 'type': 'mecha', 'name': 'Shadow Alpha Fighter'},
    'invid scout': {'id': 'invid_scout', 'type': 'mecha', 'name': 'Invid Scout'},
    'invid shocktrooper': {'id': 'invid_shock_trooper', 'type': 'mecha', 'name': 'Invid Shock Trooper'},
    'invid enforcer': {'id': 'invid_pincer', 'type': 'mecha', 'name': 'Invid Pincer Unit'},
    'invid commander': {'id': 'invid_commander_mecha', 'type': 'mecha', 'name': 'Invid Commander Mecha'},
    'garfish': {'id': 'garfish', 'type': 'ship', 'name': 'Crucero Clase Garfish'},
    'ikazuchi': {'id': 'ikazuchi', 'type': 'ship', 'name': 'Acorazado Clase Ikazuchi'},
    'horizon-t': {'id': 'horizon_t', 'type': 'ship', 'name': 'Nave de Desembarco Horizon-T'}
}

def get_soup(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return BeautifulSoup(r.read().decode('utf-8', errors='ignore'), 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def download_and_mirror_image(img_url, out_path):
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        return True
    try:
        req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=12) as r:
            data = r.read()
        im = Image.open(io.BytesIO(data)).convert('RGB')
        # Aplicar inversión horizontal (efecto espejo)
        mirrored = ImageOps.mirror(im)
        mirrored.save(out_path, 'JPEG', quality=88)
        return True
    except Exception as e:
        print(f"Failed to download/mirror {img_url}: {e}")
        return False

def scrape_wikipedia():
    print("[*] Obteniendo títulos oficiales en español desde Wikipedia...")
    url = 'https://es.wikipedia.org/wiki/Anexo:Episodios_de_Robotech'
    soup = get_soup(url)
    wiki_data = {}
    if not soup:
        return wiki_data
    for tr in soup.find_all('tr'):
        tds = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
        if len(tds) >= 4 and tds[0].isdigit():
            num = int(tds[0])
            if 1 <= num <= 85:
                wiki_data[num] = {
                    'title_es': tds[2],
                    'summary_es': tds[3]
                }
    print(f"[✓] {len(wiki_data)} episodios obtenidos de Wikipedia.")
    return wiki_data

def scrape_official_episodes_list():
    print("[*] Obteniendo listado de 85 episodios desde robotech.com...")
    url = 'https://robotech.com/roboverse/episode-guides'
    soup = get_soup(url)
    episodes = []
    if not soup:
        return episodes
    for a in soup.find_all('a', href=True):
        href = a['href']
        if '/roboverse/episode/' in href:
            title = a.get_text(strip=True)
            slug = href.split('/')[-1]
            if slug and slug not in [e['slug'] for e in episodes]:
                episodes.append({
                    'title_en': title,
                    'slug': slug,
                    'url': 'https://robotech.com' + href
                })
    print(f"[✓] {len(episodes)} episodios encontrados en robotech.com.")
    return episodes

def determine_generation(num):
    if num <= 36:
        return {
            'gen': 'gen1',
            'saga_es': 'La Saga Macross (Primera Guerra Robotech)',
            'saga_en': 'The Macross Saga (First Robotech War)',
            'faction_logo': 'assets/images/ui/logo_UNSpacy.png'
        }
    elif num <= 60:
        return {
            'gen': 'gen2',
            'saga_es': 'Los Maestros de la Robotech (Segunda Guerra Robotech)',
            'saga_en': 'The Robotech Masters (Second Robotech War)',
            'faction_logo': 'assets/images/ui/logo_SouthernCross.png'
        }
    else:
        return {
            'gen': 'gen3',
            'saga_es': 'La Nueva Generación (Tercera Guerra Robotech)',
            'saga_en': 'The New Generation (Third Robotech War)',
            'faction_logo': 'assets/images/ui/Mars_Base.png'
        }

def make_tactical_debrief(ep_num, title_es, title_en, raw_es, raw_en, gen_info):
    # Alterar redacción para que sea un informe de bitácora militar único
    clean_es = raw_es.replace('\n', ' ').strip()
    clean_en = raw_en.replace('\n', ' ').strip()
    
    # Prefijo militar táctico
    log_prefix_es = f"// BITÁCORA OPERACIONAL SDF-1 // REGISTRO TÁCTICO #{ep_num:02d}\n"
    log_prefix_en = f"// SDF-1 OPERATIONAL LOG // TACTICAL ARCHIVE #{ep_num:02d}\n"
    
    # Redacción estilizada
    tactical_es = f"{log_prefix_es}Durante las operaciones de '{title_es}' ({gen_info['saga_es']}), las fuerzas en combate registraron los siguientes eventos críticos: {clean_es}"
    tactical_en = f"{log_prefix_en}During operations in '{title_en}' ({gen_info['saga_en']}), military tactical logs recorded the following critical engagements: {clean_en}"
    
    return tactical_es, tactical_en

def process_all():
    wiki_data = scrape_wikipedia()
    official_eps = scrape_official_episodes_list()
    
    all_episodes = []
    
    for idx, ep_info in enumerate(official_eps, 1):
        ep_num = idx
        slug = ep_info['slug']
        ep_dir = os.path.join(IMAGES_DIR, f"ep_{ep_num:02d}")
        os.makedirs(ep_dir, exist_ok=True)
        
        print(f"[{ep_num:02d}/85] Procesando episodio '{slug}'...")
        soup = get_soup(ep_info['url'])
        
        # Título en español
        w_item = wiki_data.get(ep_num, {})
        title_es = w_item.get('title_es') or ep_info['title_en']
        title_en = ep_info['title_en']
        
        # Limpiar prefijo '1. ' en título inglés si existe
        if re.match(r'^\d+\.\s*', title_en):
            title_en = re.sub(r'^\d+\.\s*', '', title_en)
            
        gen_info = determine_generation(ep_num)
        
        # Extraer párrafos en inglés
        paragraphs = []
        chars_found = set()
        units_found = set()
        img_urls = []
        
        if soup:
            for p in soup.find_all('p'):
                txt = p.get_text(strip=True)
                if txt and len(txt) > 20 and not 'By using this' in txt and not '©' in txt:
                    paragraphs.append(txt)
            
            # Enlaces de personajes y mechas
            for a in soup.find_all('a', href=True):
                h = a['href'].lower()
                name_clean = a.get_text(strip=True).lower()
                
                # Check character
                for k, cid in CHAR_MAP.items():
                    if k in name_clean or k in h:
                        chars_found.add(cid)
                
                # Check mecha/ship
                for k, uinfo in UNIT_MAP.items():
                    if k in name_clean or k in h:
                        units_found.add(uinfo['id'])
            
            # Imágenes del episodio
            for img in soup.find_all('img'):
                src = img.get('src', '')
                if 'EPS_' in src:
                    full_src = 'https://robotech.com' + src if src.startswith('/') else src
                    img_urls.append(full_src)
        
        # Resumen en inglés
        raw_en = " ".join(paragraphs) if paragraphs else "No log available."
        raw_es = w_item.get('summary_es') or raw_en
        
        debrief_es, debrief_en = make_tactical_debrief(ep_num, title_es, title_en, raw_es, raw_en, gen_info)
        
        # Descargar y aplicar espejo a las imágenes
        gallery = []
        thumb_path = f"assets/images/episodios/ep_{ep_num:02d}/thumb_mirror.jpg"
        
        for i_idx, img_src in enumerate(img_urls[:5], 1):
            target_file = f"scene_{i_idx:02d}_mirror.jpg"
            target_path = os.path.join(ep_dir, target_file)
            rel_path = f"assets/images/episodios/ep_{ep_num:02d}/{target_file}"
            
            ok = download_and_mirror_image(img_src, target_path)
            if ok:
                gallery.append({
                    'url': rel_path,
                    'title_es': f"Registro de Combate {i_idx:02d} [Perspectiva Invertida]",
                    'title_en': f"Combat Log Frame {i_idx:02d} [Mirrored Perspective]"
                })
        
        if gallery:
            thumb_path = gallery[0]['url']
        else:
            thumb_path = "assets/images/ui/logo_UNSpacy.png"
            
        episode_record = {
            'id': f"ep_{ep_num:02d}",
            'episode_number': ep_num,
            'title_es': title_es,
            'title_en': title_en,
            'generation': gen_info['gen'],
            'saga_es': gen_info['saga_es'],
            'saga_en': gen_info['saga_en'],
            'faction_logo': gen_info['faction_logo'],
            'summary_es': debrief_es,
            'summary_en': debrief_en,
            'characters': sorted(list(chars_found)),
            'units': sorted(list(units_found)),
            'thumbnail': thumb_path,
            'gallery': gallery
        }
        
        all_episodes.append(episode_record)
        time.sleep(0.15)
        
    out_json = os.path.join(DATA_DIR, 'episodios.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({'episodes': all_episodes, 'total': len(all_episodes)}, f, indent=2, ensure_ascii=False)
        
    print(f"\n[★] ¡Proceso completo! 85 episodios guardados con éxito en {out_json}")

if __name__ == '__main__':
    process_all()
