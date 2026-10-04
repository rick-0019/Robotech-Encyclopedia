#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Robotech Tactical Codex - Local Management Server
Servidor local ultraligero que permite guardar archivos JSON directamente en el disco
y realizar 'git commit' y 'git push' a GitHub con un solo clic desde la interfaz.
100% basado en librerías estándar de Python (sin pip ni dependencias externas).
"""

import http.server
import socketserver
import os
import json
import subprocess
import sys

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class RobotechRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/api/browse-images'):
            self.handle_browse_images()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/save':
            self.handle_save()
        elif self.path == '/api/save-character':
            self.handle_save_character()
        elif self.path == '/api/save-ship':
            self.handle_save_ship()
        elif self.path == '/api/git-push':
            self.handle_git_push()
        elif self.path == '/api/upload-image':
            self.handle_upload_image()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_browse_images(self):
        try:
            images_dir = os.path.join(BASE_DIR, 'assets', 'images')
            valid_exts = {'.png', '.jpg', '.jpeg', '.webp', '.jfif', '.svg', '.gif'}
            images = []
            folders = set()
            
            if os.path.exists(images_dir):
                for root, dirs, files in os.walk(images_dir):
                    subfolder = os.path.relpath(root, images_dir).replace('\\', '/')
                    if subfolder != '.':
                        folders.add(subfolder)
                    for f in files:
                        ext = os.path.splitext(f)[1].lower()
                        if ext in valid_exts:
                            full_path = os.path.join(root, f)
                            rel_path = os.path.relpath(full_path, BASE_DIR).replace('\\', '/')
                            images.append({
                                "path": rel_path,
                                "name": f,
                                "folder": subfolder if subfolder != '.' else "raíz",
                                "size_kb": round(os.path.getsize(full_path) / 1024, 1),
                                "mtime": os.path.getmtime(full_path)
                            })
            
            # Ordenar primero los más recientes
            images.sort(key=lambda x: x['mtime'], reverse=True)
            self.send_json_response(200, {
                "success": True, 
                "images": images,
                "folders": sorted(list(folders))
            })
        except Exception as e:
            self.send_json_response(500, {"success": False, "error": str(e)})

    def handle_upload_image(self):
        try:
            import base64
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(body)

            folder_name = payload.get('folder', '').strip()
            filename = payload.get('filename', '').strip()
            data_b64 = payload.get('data', '')

            if not filename or not data_b64:
                raise ValueError("Nombre de archivo o datos de imagen faltantes")

            # Limpiar nombre de archivo
            clean_name = os.path.basename(filename).replace(' ', '_')
            
            # Directorio destino: assets/images/mechas/{folder} o assets/images/{folder}
            if folder_name.startswith('assets/images/'):
                target_dir = os.path.join(BASE_DIR, folder_name)
            elif folder_name.startswith('mechas/') or folder_name.startswith('ui/'):
                target_dir = os.path.join(BASE_DIR, 'assets', 'images', folder_name)
            elif folder_name:
                target_dir = os.path.join(BASE_DIR, 'assets', 'images', 'mechas', folder_name)
            else:
                target_dir = os.path.join(BASE_DIR, 'assets', 'images', 'uploads')
                
            os.makedirs(target_dir, exist_ok=True)
            target_path = os.path.join(target_dir, clean_name)

            if ',' in data_b64:
                data_b64 = data_b64.split(',', 1)[1]

            image_bytes = base64.b64decode(data_b64)
            with open(target_path, 'wb') as f:
                f.write(image_bytes)

            rel_path = os.path.relpath(target_path, BASE_DIR).replace('\\', '/')
            self.send_json_response(200, {
                "success": True,
                "message": f"Imagen '{clean_name}' guardada correctamente.",
                "path": rel_path,
                "name": clean_name
            })
        except Exception as e:
            self.send_json_response(500, {"success": False, "error": str(e)})

    def handle_save_character(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(body)
            self.save_character_data(payload)
        except Exception as e:
            self.send_json_response(500, {"success": False, "error": str(e)})

    def save_character_data(self, payload):
        char = payload.get('character')
        if not char or not char.get('id'):
            raise ValueError("Datos de personaje o ID faltante")

        char_id = char['id']

        # 1. Guardar data/personajes/{id}.json
        char_dir = os.path.join(BASE_DIR, 'data', 'personajes')
        os.makedirs(char_dir, exist_ok=True)
        char_file = os.path.join(char_dir, f"{char_id}.json")
        with open(char_file, 'w', encoding='utf-8') as f:
            json.dump(char, f, indent=2, ensure_ascii=False)

        # 2. Actualizar data/manifest_personajes.json
        manifest_file = os.path.join(BASE_DIR, 'data', 'manifest_personajes.json')
        manifest_data = {}
        if os.path.exists(manifest_file):
            with open(manifest_file, 'r', encoding='utf-8') as f:
                manifest_data = json.load(f)

        if 'characters' not in manifest_data:
            manifest_data['characters'] = []

        stats_obj = char.get('stats', {})
        aptitudes = char.get('aptitudes', {})
        summary_item = {
            "id": char["id"],
            "name": char["name"],
            "japanese_name": char.get("japanese_name", ""),
            "category": char.get("category", "command"),
            "rank": char.get("rank", {}),
            "role": char.get("role", {}),
            "faction": char.get("faction", {}),
            "faction_logo": char.get("faction_logo", "assets/images/ui/logo_UNSpacy.png"),
            "assignment": char.get("assignment", {}),
            "series": char.get("series", {}),
            "thumbnail": char.get("thumbnail", ""),
            "summary": {
                "es": (char.get("summary", {}).get("es") or char.get("lore", {}).get("overview_es") or "")[:150] + "...",
                "en": (char.get("summary", {}).get("en") or char.get("lore", {}).get("overview_en") or "")[:150] + "..."
            },
            "stats": {
                "command": stats_obj.get("command") or aptitudes.get("command", {}).get("value", 90),
                "strategy": stats_obj.get("strategy") or aptitudes.get("strategy", {}).get("value", 90),
                "resolve": stats_obj.get("resolve") or aptitudes.get("resolve", {}).get("value", 90),
                "piloting": stats_obj.get("piloting") or aptitudes.get("piloting", {}).get("value", 70)
            },
            "dataFile": f"data/personajes/{char_id}.json"
        }

        idx = -1
        for i, c in enumerate(manifest_data['characters']):
            if c.get('id') == char_id:
                idx = i
                break

        if idx >= 0:
            manifest_data['characters'][idx] = summary_item
        else:
            manifest_data['characters'].append(summary_item)

        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)

        response = {
            "success": True,
            "message": f"Expediente de '{char['name']}' y manifest_personajes.json guardados directamente en el disco.",
            "character_file": f"data/personajes/{char_id}.json"
        }
        self.send_json_response(200, response)

    def handle_save_ship(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(body)
            self.save_ship_data(payload)
        except Exception as e:
            self.send_json_response(500, {"success": False, "error": str(e)})

    def save_ship_data(self, payload):
        ship = payload.get('ship')
        if not ship or not ship.get('id'):
            raise ValueError("Datos de nave capital o ID faltante")

        ship_id = ship['id']

        # 1. Guardar data/naves/{id}.json
        naves_dir = os.path.join(BASE_DIR, 'data', 'naves')
        os.makedirs(naves_dir, exist_ok=True)
        ship_file = os.path.join(naves_dir, f"{ship_id}.json")
        with open(ship_file, 'w', encoding='utf-8') as f:
            json.dump(ship, f, indent=2, ensure_ascii=False)

        # 2. Actualizar data/manifest_naves.json
        manifest_file = os.path.join(BASE_DIR, 'data', 'manifest_naves.json')
        manifest_data = {}
        if os.path.exists(manifest_file):
            with open(manifest_file, 'r', encoding='utf-8') as f:
                manifest_data = json.load(f)

        if 'ships' not in manifest_data:
            manifest_data['ships'] = []

        stats_obj = ship.get('stats', {})
        summary_item = {
            "id": ship["id"],
            "name": ship["name"],
            "class_name": ship.get("class_name", {}),
            "category": ship.get("category", "fortress"),
            "faction": ship.get("faction", {}),
            "faction_logo": ship.get("faction_logo", "assets/images/ui/logo_UNSpacy.png"),
            "assignment": ship.get("assignment", {}),
            "series": ship.get("series", {}),
            "thumbnail": ship.get("thumbnail", ""),
            "summary": {
                "es": (ship.get("summary", {}).get("es") or ship.get("lore", {}).get("overview_es") or "")[:160] + ("..." if len(ship.get("summary", {}).get("es") or "") > 160 else ""),
                "en": (ship.get("summary", {}).get("en") or ship.get("lore", {}).get("overview_en") or "")[:160] + ("..." if len(ship.get("summary", {}).get("en") or "") > 160 else "")
            },
            "stats": {
                "firepower": stats_obj.get("firepower", 95),
                "armor": stats_obj.get("armor", 95),
                "capacity": stats_obj.get("capacity", 90),
                "range": stats_obj.get("range", 90)
            },
            "is_modular": ship.get("is_modular", False),
            "dataFile": f"data/naves/{ship_id}.json"
        }

        idx = -1
        for i, s in enumerate(manifest_data['ships']):
            if s.get('id') == ship_id:
                idx = i
                break

        if idx >= 0:
            manifest_data['ships'][idx] = summary_item
        else:
            manifest_data['ships'].append(summary_item)

        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)

        response = {
            "success": True,
            "message": f"Nave '{ship['name']}' y manifest_naves.json guardados directamente en el disco.",
            "ship_file": f"data/naves/{ship_id}.json"
        }
        self.send_json_response(200, response)

    def handle_save(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(body)

            if payload.get('character'):
                self.save_character_data(payload)
                return

            if payload.get('ship'):
                self.save_ship_data(payload)
                return

            mecha = payload.get('mecha')
            if not mecha or not mecha.get('id'):
                raise ValueError("Datos de mecha o ID faltante")

            mecha_id = mecha['id']

            # 1. Guardar data/mechas/{id}.json
            mechas_dir = os.path.join(BASE_DIR, 'data', 'mechas')
            os.makedirs(mechas_dir, exist_ok=True)
            mecha_file = os.path.join(mechas_dir, f"{mecha_id}.json")
            with open(mecha_file, 'w', encoding='utf-8') as f:
                json.dump(mecha, f, indent=2, ensure_ascii=False)

            # 2. Actualizar data/manifest.json
            manifest_file = os.path.join(BASE_DIR, 'data', 'manifest.json')
            manifest_data = {}
            if os.path.exists(manifest_file):
                with open(manifest_file, 'r', encoding='utf-8') as f:
                    manifest_data = json.load(f)

            if 'mechas' not in manifest_data:
                manifest_data['mechas'] = []

            # Crear o actualizar resumen en manifest
            summary_item = {
                "id": mecha["id"],
                "name": mecha["name"],
                "alias": mecha.get("alias", ""),
                "category": mecha.get("category", "destroid"),
                "faction": mecha.get("faction", {}),
                "class": mecha.get("vehicle_type", {}),
                "thumbnail": mecha.get("thumbnail", ""),
                "faction_logo": mecha.get("faction_logo") or ("assets/images/ui/Mars_Base.png" if "marte" in str(mecha.get("faction", "")).lower() or "mars" in str(mecha.get("faction", "")).lower() else ("assets/images/ui/logo_zentran.png" if mecha.get("category") == "zentraedi" or "zentraedi" in str(mecha.get("faction", "")).lower() else "assets/images/ui/logo_UNSpacy.png")),
                "is_variable": bool(mecha.get("is_variable") or mecha.get("modes") or mecha.get("category") == "veritech" or "variable" in str(mecha.get("vehicle_type", "")).lower()),
                "modes": {
                    "fighter": mecha.get("modes", {}).get("fighter", {}).get("image", ""),
                    "guardian": mecha.get("modes", {}).get("guardian", {}).get("image", ""),
                    "battloid": mecha.get("modes", {}).get("battloid", {}).get("image", "")
                } if mecha.get("modes") else None,
                "summary": {
                    "es": (mecha.get("lore", {}).get("overview_es") or "")[:110] + "...",
                    "en": (mecha.get("lore", {}).get("overview_en") or "")[:110] + "..."
                },
                "stats": {
                    "speed": mecha.get("stats", {}).get("speed", {}).get("value", 0),
                    "speed_unit": mecha.get("stats", {}).get("speed", {}).get("unit_es", "km/h"),
                    "armor": mecha.get("stats", {}).get("armor", {}).get("value", 0),
                    "armor_unit": mecha.get("stats", {}).get("armor", {}).get("unit_es", "CDM"),
                    "firepower": mecha.get("stats", {}).get("firepower", {}).get("value", 0),
                    "firepower_unit": mecha.get("stats", {}).get("firepower", {}).get("unit_es", "Pts"),
                    "range": mecha.get("stats", {}).get("range", {}).get("value", 0),
                    "range_unit": mecha.get("stats", {}).get("range", {}).get("unit_es", "km"),
                    "sensors": mecha.get("stats", {}).get("sensors", {}).get("value", 0),
                    "sensors_unit": mecha.get("stats", {}).get("sensors", {}).get("unit_es", "km"),
                    "mobility": mecha.get("stats", {}).get("mobility", {}).get("value", 0)
                },
                "dataFile": f"data/mechas/{mecha['id']}.json"
            }

            idx = -1
            for i, m in enumerate(manifest_data['mechas']):
                if m.get('id') == mecha_id:
                    idx = i
                    break

            if idx >= 0:
                manifest_data['mechas'][idx] = summary_item
            else:
                manifest_data['mechas'].append(summaryItem if 'summaryItem' in locals() else summary_item)

            with open(manifest_file, 'w', encoding='utf-8') as f:
                json.dump(manifest_data, f, indent=2, ensure_ascii=False)

            # 3. Actualizar taxonomies.json si viene incluido
            taxonomies = payload.get('taxonomies')
            if taxonomies:
                tax_file = os.path.join(BASE_DIR, 'data', 'taxonomies.json')
                with open(tax_file, 'w', encoding='utf-8') as f:
                    json.dump(taxonomies, f, indent=2, ensure_ascii=False)

            response = {
                "success": True,
                "message": f"Unidad '{mecha['name']}' y manifest.json guardados directamente en el disco.",
                "mecha_file": f"data/mechas/{mecha_id}.json"
            }
            self.send_json_response(200, response)

        except Exception as e:
            self.send_json_response(500, {"success": False, "error": str(e)})

    def handle_git_push(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
            payload = json.loads(body)
            msg = payload.get('commitMessage') or "Actualizacion de base de datos Robotech Codex"

            # Ejecutar secuencia Git
            cmds = [
                ["git", "add", "."],
                ["git", "commit", "-m", msg],
                ["git", "push", "origin", "main"]
            ]

            logs = []
            for cmd in cmds:
                res = subprocess.run(
                    cmd, 
                    cwd=BASE_DIR, 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE, 
                    text=True, 
                    encoding='utf-8',
                    errors='replace'
                )
                output = (res.stdout + "\n" + res.stderr).strip()
                logs.append(f"$ {' '.join(cmd)}\n{output}")
                # Si el commit dice 'nothing to commit', no es error fatal
                if res.returncode != 0 and "nothing to commit" not in output:
                    # Intento alternativo en caso de que la rama remota sea master
                    if cmd[0] == "git" and cmd[1] == "push":
                        alt_push = subprocess.run(
                            ["git", "push", "origin", "master"],
                            cwd=BASE_DIR,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            text=True,
                            encoding='utf-8',
                            errors='replace'
                        )
                        alt_out = (alt_push.stdout + "\n" + alt_push.stderr).strip()
                        logs.append(f"$ git push origin master\n{alt_out}")
                        if alt_push.returncode == 0:
                            break

            self.send_json_response(200, {
                "success": True,
                "message": "Protocolo Git ejecutado.",
                "logs": "\n\n".join(logs)
            })

        except Exception as e:
            self.send_json_response(500, {"success": False, "error": str(e)})

    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

if __name__ == '__main__':
    # Permitir reutilización rápida del puerto
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RobotechRequestHandler) as httpd:
        print(f"=======================================================================")
        print(f"[*] ROBOTECH CODEX - SERVIDOR LOCAL CON API ACTIVA EN PUERTO {PORT}")
        print(f"[*] Directorio: {BASE_DIR}")
        print(f"[*] Guardado automatico en disco y push a GitHub listos.")
        print(f"=======================================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido por el usuario.")
            sys.exit(0)
