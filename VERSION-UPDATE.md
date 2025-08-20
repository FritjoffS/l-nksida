# Version Update Guide

## Steg för att uppdatera version:

### 1. Bestäm versionsnummer
- **Patch** (2.0.1): Små bugfixar
- **Minor** (2.1.0): Nya funktioner
- **Major** (3.0.0): Stora ändringar

### 2. Uppdatera filer:

#### manifest.json:
```json
"version": "2.1.0",
"version_name": "2.1.0"
```

#### sw.js:
```javascript
const CACHE_NAME = 'jarnhandel-v2.1.0';
```

### 3. Dokumentera i CHANGELOG.md:
- Lägg till ny sektion med datum
- Lista alla ändringar under rätt kategori

### 4. Testa:
- Testa PWA-installation
- Kontrollera att cache uppdateras
- Verifiera att versionen visas korrekt

### 5. Deploy:
- Committa alla ändringar
- Pusha till GitHub
- Versionen uppdateras automatiskt

## Snabb referens - Filer att uppdatera:
- [ ] manifest.json (version + version_name)
- [ ] sw.js (CACHE_NAME)  
- [ ] CHANGELOG.md (dokumentation)
- [ ] README.md (om nödvändigt)
