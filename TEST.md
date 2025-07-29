# Rack Visualization Plugin Test

Diese Datei kann verwendet werden, um das Plugin in Obsidian zu testen.

## Test 1: Einfaches XML Format

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

## Test 2: Text Markup Format

```rack-text
caption: Development Rack
height: 15
items:
  - server[2]: Development Server
  - switch: Dev Switch
  - firewall: Security Gateway
  - storage: File Storage
  - pdu: Power Unit
```

## Test 3: Mit Obsidian Links (funktioniert nur in Obsidian)

```rack-text
caption: Production Environment
height: 25
items:
  - server[4]: [[Production Server Config]]
  - switch[2]: [[Network Setup]]
  - firewall: [[Security Policies]]
  - storage[3]: [[Storage Management]]
  - cables: Cable Management
  - pdu: [[Power Management]]
  - ups[4]: Backup Power
```

## Test 4: Komplexeres Beispiel

```rack-xml
<racks>
  <rack height="42" name="Main Server Rack">
    <patch>Patch Panel</patch>
    <cables>Cable Management</cables>
    <switch>Core Switch</switch>
    <cables>Cable Management</cables>
    <firewall>Perimeter Firewall</firewall>
    <server height="2">Web Server 1</server>
    <server height="2">Web Server 2</server>
    <storage height="4">Storage Array</storage>
    <server height="2">Database Server</server>
    <blank height="2"/>
    <monitor height="8">KVM Monitor</monitor>
    <keyboard>KVM Keyboard</keyboard>
    <kvm>KVM Switch</kvm>
    <blank height="5"/>
    <pdu>Primary PDU</pdu>
    <ups height="4">UPS System</ups>
    <gap height="2"/>
  </rack>
</racks>
```

## Erwartete Ergebnisse

Wenn das Plugin korrekt funktioniert, sollten Sie:

1. **SVG-Diagramme sehen** anstelle der Code-Blöcke
2. **Verschiedene Farben** für verschiedene Gerätetypen
3. **Klickbare Links** bei Obsidian-internen Verweisen
4. **Responsive Darstellung** die sich an die Fenstergröße anpasst
5. **Rack-Skala** links neben dem Diagramm mit Höhenangaben

## Debugging

Falls die Diagramme nicht erscheinen:

1. Öffnen Sie die **Entwicklertools** (F12 oder Ctrl+Shift+I)
2. Schauen Sie in die **Console** nach Fehlermeldungen
3. Überprüfen Sie, ob das Plugin in den **Community Plugins** aktiviert ist
4. Versuchen Sie, Obsidian neu zu starten

## Plugin-Status prüfen

In der Obsidian-Konsole sollten Sie diese Meldung sehen:
```
Loading Rack Visualization Plugin
```

Bei Fehlern werden entsprechende Error-Meldungen angezeigt.