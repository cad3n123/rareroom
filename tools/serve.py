#!/usr/bin/env python3
"""
Tiny static file server with SPA (single-page-app) fallback.

Clean-URL routing means the browser can request real paths like /about or
/artist/slug. Those files don't exist on disk, so a plain static server would
404 on a refresh or a shared deep link. This server serves the matching file
when it exists (assets, images, etc.) and otherwise falls back to index.html so
the front-end router can handle the route.

Usage:
    python3 tools/serve.py [port]     # defaults to 8000
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer

# Serve from the project root (this script lives in <root>/tools).
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class SPAHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        # If the requested path maps to a real file, serve it as usual.
        path = self.translate_path(self.path)
        if os.path.isdir(path) or os.path.exists(path):
            return super().send_head()
        # Unknown path with no file extension → an SPA route: serve index.html.
        if '.' not in os.path.basename(self.path.split('?')[0]):
            self.path = '/index.html'
        return super().send_head()


ThreadingTCPServer.allow_reuse_address = True
with ThreadingTCPServer(('', PORT), SPAHandler) as httpd:
    print(f'Serving {ROOT} on http://localhost:{PORT} (SPA fallback enabled)')
    httpd.serve_forever()
