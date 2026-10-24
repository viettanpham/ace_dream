#!/usr/bin/env python3
"""
STARFRONT WORLD V2 — EXPORT CDN R3 INTEGRATION ZIP PACKAGES (CHECKPOINT 2.1)

Generates two standalone ZIP packages in public/ ready for download:
1. public/starfront-r3-asset-data.zip:
   Contains full starfront-world-assets/ directory structure (Manifests, Gallery, Story Ch01).
2. public/starfront-r3-ci-tools.zip:
   Contains scripts/generate-asset-index.mjs, workflow template, and INTEGRATION_GUIDE.md.
"""

import os
import zipfile
import hashlib

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STAGING_DIR = os.path.join(PROJECT_ROOT, "staging", "starfront-world-assets")
TOOLS_DIR = os.path.join(PROJECT_ROOT, "scripts", "asset-repo-tools")
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def create_asset_data_zip():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    zip_path = os.path.join(PUBLIC_DIR, "starfront-r3-asset-data.zip")
    
    file_count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(STAGING_DIR):
            for file in sorted(files):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, os.path.join(PROJECT_ROOT, "staging"))
                zf.write(full_path, arcname=rel_path)
                file_count += 1
                
    size = os.path.getsize(zip_path)
    sha = sha256_file(zip_path)
    print(f"✅ Created Asset Data ZIP: {zip_path}")
    print(f"   Files: {file_count}, Size: {size:,} bytes, SHA-256: {sha}")
    return zip_path, file_count, size, sha

def create_ci_tools_zip():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    zip_path = os.path.join(PUBLIC_DIR, "starfront-r3-ci-tools.zip")
    
    file_count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(TOOLS_DIR):
            for file in sorted(files):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, TOOLS_DIR)
                zf.write(full_path, arcname=rel_path)
                file_count += 1
                
    size = os.path.getsize(zip_path)
    sha = sha256_file(zip_path)
    print(f"✅ Created CI Tools ZIP: {zip_path}")
    print(f"   Files: {file_count}, Size: {size:,} bytes, SHA-256: {sha}")
    return zip_path, file_count, size, sha

if __name__ == "__main__":
    print("--- BUILDING CHECKPOINT 2.1 EXPORT PACKAGES ---")
    create_asset_data_zip()
    create_ci_tools_zip()
    print("--- PACKAGING COMPLETE ---")
