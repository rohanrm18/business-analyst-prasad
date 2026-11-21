#!/usr/bin/env python3
"""Local, read-only Tally XML probe for Prasad Business Analyst.
Binds to loopback only. It never creates or edits Tally data.
"""
import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from xml.etree import ElementTree as ET

TALLY_URL = os.environ.get("TALLY_URL", "http://127.0.0.1:9000").rstrip("/")
HOST = "127.0.0.1"
PORT = int(os.environ.get("CONNECTOR_PORT", "8765"))
XML = """<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>EXPORT</TALLYREQUEST><TYPE>DATA</TYPE><ID>List of Companies</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY></ENVELOPE>"""

def probe():
    req = urllib.request.Request(TALLY_URL, data=XML.encode("utf-8"),
        headers={"Content-Type": "text/xml; charset=utf-8"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            raw = response.read(2_000_000)
        root = ET.fromstring(raw)
        names = []
        for node in root.iter():
            tag = node.tag.split("}")[-1].upper()
            candidates = []
            if tag == "COMPANY":
                candidates.append(node.attrib.get("NAME", ""))
            if tag in ("NAME", "SVCURRENTCOMPANY") and node.text:
                candidates.append(node.text)
            for candidate in candidates:
                value = candidate.strip()
                if value and value not in names:
                    names.append(value)
        status_nodes = [n.text.strip() for n in root.iter()
                        if n.tag.upper() == "STATUS" and n.text]
        ok = not status_nodes or status_nodes[0] == "1"
        return {"reachable": True, "xml_ok": ok, "tally_url": TALLY_URL,
                "companies": names, "message": "Read-only XML response received." if ok else "Tally returned an XML status error.",
                "product_version": "Not auto-detected; confirm ERP 9 or Prime in the Tally About screen."}
    except (urllib.error.URLError, TimeoutError, ET.ParseError, OSError) as exc:
        return {"reachable": False, "xml_ok": False, "tally_url": TALLY_URL,
                "companies": [], "message": str(exc),
                "product_version": "Not detected"}

class Handler(BaseHTTPRequestHandler):
    def send_json(self, payload, code=200):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)
    def do_GET(self):
        if self.path == "/health":
            return self.send_json({"ok": True, "service": "Prasad local Tally connector"})
        if self.path == "/api/tally/status":
            return self.send_json(probe())
        return self.send_json({"error": "Not found"}, 404)
    def log_message(self, *_):
        pass

if __name__ == "__main__":
    print("Prasad local Tally connector")
    print("Tally target:", TALLY_URL)
    print("Local diagnostic: http://127.0.0.1:%s/api/tally/status" % PORT)
    print("Loopback only. Do not change HOST to 0.0.0.0 or expose this port.")
    HTTPServer((HOST, PORT), Handler).serve_forever()
