#!/usr/bin/env python3
"""
Serveur HTTP local pour SCORE SET
Permet la lecture des iframes YouTube (bloquées en file://)
"""
import http.server
import socketserver
import os
import webbrowser
import threading

PORT = 8181
# Dossier du script = dossier SCORE SET
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"  [{args[1]}] {args[0]}")

def open_browser():
    import time
    time.sleep(1.5)
    webbrowser.open(f'http://localhost:{PORT}/control_panel.html')

print("=" * 55)
print("  SCORE SET - Serveur Local")
print("=" * 55)
print(f"  Adresse      : http://localhost:{PORT}")
print(f"  Dossier      : {DIRECTORY}")
print()
print("  Panneau      : http://localhost:{}/control_panel.html".format(PORT))
print("  Stadium      : http://localhost:{}/stadium_display.html".format(PORT))
print()
print("  Ouverture du navigateur...")
print("  (Ne fermez pas cette fenetre pendant l'utilisation)")
print("=" * 55)

threading.Thread(target=open_browser, daemon=True).start()

with socketserver.TCPServer(("", PORT), CORSHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Serveur arrêté.")
