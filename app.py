"""
SmartTriage AI — Root Application Launcher
Allows running `streamlit run app.py` directly from the workspace root.
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SUB_DIR = ROOT / "smarttriage_ai"
SUB_APP = SUB_DIR / "app.py"

if str(SUB_DIR) not in sys.path:
    sys.path.insert(0, str(SUB_DIR))

if __name__ == "__main__":
    runpy.run_path(str(SUB_APP), run_name="__main__")

