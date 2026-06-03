#!/usr/bin/env python3
"""Serve the app and append survey answers to a CSV file (opens in Excel)."""

from __future__ import annotations

import csv
import json
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
CSV_PATH = DATA_DIR / "survey-responses.csv"
SURVEY_COLUMNS = [
    "timestamp",
    "awareness",
    "recommend",
    "felt_response",
    "surprised",
    "careful",
]

csv_lock = threading.Lock()


def append_survey_row(payload: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    row = {
        "timestamp": payload.get("timestamp")
        or datetime.now(timezone.utc).isoformat(),
        "awareness": payload.get("awareness", ""),
        "recommend": payload.get("recommend", ""),
        "felt_response": payload.get("felt_response", ""),
        "surprised": payload.get("surprised", ""),
        "careful": payload.get("careful", ""),
    }

    write_header = not CSV_PATH.exists() or CSV_PATH.stat().st_size == 0

    with csv_lock:
        with CSV_PATH.open("a", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=SURVEY_COLUMNS)
            if write_header:
                writer.writeheader()
            writer.writerow(row)


class SurveyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path != "/api/survey":
            self.send_error(404, "Not found")
            return

        length = int(self.headers.get("Content-Length", "0") or 0)
        body = self.rfile.read(length) if length else b"{}"

        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        if not isinstance(payload, dict):
            self.send_error(400, "Expected JSON object")
            return

        try:
            append_survey_row(payload)
        except OSError as error:
            self.send_error(500, f"Could not write CSV: {error}")
            return

        response = json.dumps({"ok": True, "path": str(CSV_PATH.name)}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self._send_cors()
        self.end_headers()
        self.wfile.write(response)

    def _send_cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args) -> None:
        if args and args[1] != "200":
            super().log_message(format, *args)


def main() -> None:
    host = "127.0.0.1"
    port = 5173
    server = ThreadingHTTPServer((host, port), SurveyHandler)
    print(f"Serving {ROOT}")
    print(f"Survey CSV: {CSV_PATH}")
    print(f"Open http://{host}:{port}/index.html")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
