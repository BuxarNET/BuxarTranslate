
### 3. INSTALL.md

```markdown
# Installation Guide

## For Users

### Method 1: From Thunderbird Add-ons Store (Recommended)
1. Open Thunderbird
2. Go to Add-ons Manager (Ctrl+Shift+A)
3. Search for "BuxarTranslate"
4. Click "Install"

### Method 2: Manual Installation
1. Download the latest `.xpi` file from [Releases](../../releases)
2. Open Thunderbird → Add-ons Manager
3. Drag and drop the `.xpi` file into the add-ons window
4. Click "Install"

### Method 3: Development Version
1. Download or clone this repository
2. Run `./scripts/build-xpi.sh` to create XPI file
3. Install the XPI file as in Method 2

## For Developers

### Prerequisites
- Thunderbird 78.0 or later
- Git
- Basic text editor

### Development Installation
1. Clone repository: `git clone https://github.com/BuxarNET/BuxarTranslate.git`
2. Open Thunderbird → Add-ons Manager
3. Click gear icon → Debug Add-ons
4. Click "Load Temporary Add-on"
5. Select `src/manifest.json` from your local repository

### Building Release Version
```bash
cd scripts
./build-xpi.sh