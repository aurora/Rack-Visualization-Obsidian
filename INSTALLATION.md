# Installation Guide - Rack Visualization Plugin für Obsidian

## Voraussetzungen
- Obsidian installiert
- Node.js und npm installiert (für Entwicklung)

## Installation

### Option 1: Manuelle Installation (Empfohlen für Test)

1. **Plugin-Ordner erstellen:**
   ```
   [Ihr Obsidian Vault]/.obsidian/plugins/rack-visualization/
   ```

2. **Plugin-Dateien kopieren:**
   Kopieren Sie diese Dateien in den Plugin-Ordner:
   - `main.js` (kompilierte Version)
   - `manifest.json`
   - `README.md`

3. **Plugin in Obsidian aktivieren:**
   - Öffnen Sie Obsidian
   - Gehen Sie zu Settings → Community Plugins
   - Deaktivieren Sie "Safe Mode" falls aktiviert
   - Klicken Sie auf "Refresh" um das Plugin zu erkennen
   - Aktivieren Sie "Rack Visualization"

### Option 2: Entwicklungsmodus

1. **Repository klonen/kopieren:**
   ```bash
   cd [Ihr Obsidian Vault]/.obsidian/plugins/
   cp -r /pfad/zum/obsidian-rack-visualization ./rack-visualization
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   cd rack-visualization
   npm install
   ```

3. **Plugin kompilieren:**
   ```bash
   npm run build
   ```

4. **Plugin in Obsidian aktivieren** (wie oben)

## Test des Plugins

### Test 1: XML Format
Erstellen Sie eine neue Note in Obsidian und fügen Sie ein:

````markdown
```rack-xml
<racks>
  <rack height="20" name="Test Rack">
    <server height="2">Web Server</server>
    <switch>Network Switch</switch>
    <firewall>Firewall</firewall>
    <storage height="2">Storage Array</storage>
    <pdu>Power Distribution</pdu>
  </rack>
</racks>
```
````

### Test 2: Text Format
````markdown
```rack-text
caption: Test Rack
height: 20
items:
  - server[2]: Web Server
  - switch: Network Switch
  - firewall: Firewall
  - storage[2]: Storage Array
  - pdu: Power Distribution
```
````

### Test 3: Mit Obsidian Links
````markdown
```rack-text
caption: Production Rack
height: 15
items:
  - server[2]: [[Production Server]]
  - switch: [[Network Configuration]]
  - firewall: [[Security Rules]]
  - storage[2]: Storage System
```
````

## Erwartetes Verhalten

- Die Code-Blöcke sollten automatisch als SVG-Diagramme gerendert werden
- Links zu anderen Obsidian-Notizen sollten klickbar sein
- Verschiedene Gerätetypen sollten unterschiedliche Farben haben
- Das Diagramm sollte responsive sein

## Troubleshooting

### Plugin wird nicht erkannt
- Überprüfen Sie, ob alle Dateien im richtigen Ordner sind
- Stellen Sie sicher, dass `manifest.json` korrekt ist
- Refreshen Sie die Plugin-Liste in Obsidian

### Code-Blöcke werden nicht gerendert
- Überprüfen Sie die Browser-Konsole (Ctrl+Shift+I) auf Fehler
- Stellen Sie sicher, dass das Plugin aktiviert ist
- Testen Sie mit einem einfachen Beispiel

### Fehler in der Konsole
- Öffnen Sie die Entwicklertools (Ctrl+Shift+I)
- Schauen Sie in die Console nach JavaScript-Fehlern
- Überprüfen Sie die Syntax Ihrer Rack-Definitionen

## Bekannte Limitationen

- Das Plugin funktioniert nur in Obsidian (nicht in anderen Markdown-Editoren)
- SVG-Export ist derzeit nicht implementiert
- Komplexe Rack-Layouts könnten Performance-Probleme verursachen

## Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehler
2. Testen Sie mit den Beispielen aus dieser Anleitung
3. Stellen Sie sicher, dass alle Abhängigkeiten korrekt installiert sind