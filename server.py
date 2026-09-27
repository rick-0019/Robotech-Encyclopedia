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

    def do_GET(self):
        if self.path.startswith('/api/browse-images'):
            self.handle_browse_images()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/save':
            self.handle_save()
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

    def handle_save(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(body)

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
                "badge": mecha.get("alias", "UN SPACY"),
                "faction_logo": mecha.get("faction_logo") or ("assets/images/ui/logo_zentran.png" if mecha.get("category") == "zentraedi" or "zentraedi" in str(mecha.get("faction", "")).lower() else "assets/images/ui/logo_UNSpacy.png"),
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
