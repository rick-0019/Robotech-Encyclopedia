import json

with open('data/manifest_personajes.json', 'r', encoding='utf-8') as f:
    mp = json.load(f)
chars = mp['characters']

with open('data/manifest.json', 'r', encoding='utf-8') as f:
    mm = json.load(f)
mechas = mm['mechas']

with open('data/manifest_naves.json', 'r', encoding='utf-8') as f:
    mn = json.load(f)
ships = mn['ships']

print("=== CHARACTERS BY GENERATION ===")
chars_by_gen = {'gen1': [], 'gen2': [], 'gen3': []}
for c in chars:
    g = c.get('generation', 'gen1')
    chars_by_gen.setdefault(g, []).append(c['id'])
for g, lst in chars_by_gen.items():
    print(f"{g} ({len(lst)}): {lst}")

print("\n=== MECHAS BY GENERATION ===")
mechas_by_gen = {'gen1': [], 'gen2': [], 'gen3': []}
for m in mechas:
    g = m.get('generation', 'gen1')
    mechas_by_gen.setdefault(g, []).append(m['id'])
for g, lst in mechas_by_gen.items():
    print(f"{g} ({len(lst)}): {lst}")

print("\n=== SHIPS BY GENERATION ===")
ships_by_gen = {'gen1': [], 'gen2': [], 'gen3': []}
for s in ships:
    g = s.get('generation', 'gen1')
    ships_by_gen.setdefault(g, []).append(s['id'])
for g, lst in ships_by_gen.items():
    print(f"{g} ({len(lst)}): {lst}")
