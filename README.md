# Obsidian Rack Visualization Plugin

Ein Obsidian Plugin zur Generierung von Server-Rack-Diagrammen aus RackML XML oder Text-Markup in Code-Blöcken.

## Features

- Unterstützt RackML XML Format und Text-Markup Format
- Generiert SVG-Diagramme von Server-Racks
- Unterstützt verschiedene Gerätetypen (Server, Switch, Firewall, etc.)
- Farbschemas für verschiedene Gerätetypen
- Gerätesymbole und Icons
- Klickbare Links in SVG-Ausgabe (mit visueller Hervorhebung)
- Obsidian-spezifische Link-Integration
- Automatische Erkennung des Eingabeformats

## Installation

1. Kopieren Sie den Plugin-Ordner in Ihr Obsidian Vault unter `.obsidian/plugins/`
2. Aktivieren Sie das Plugin in den Obsidian-Einstellungen

## Verwendung

### RackML XML Format

Verwenden Sie Code-Blöcke mit `rack-xml` oder `rackml`:

````markdown
```rack-xml
<racks base="https://kb/">
  <rack height="42" name="Server Rack">
    <server height="2" href="server-01">Web Server</server>
    <switch>Network Switch</switch>
    <firewall href="firewall-01">Firewall</firewall>
    <cables>Cable Management</cables>
    <patch>Patch Panel</patch>
    <pdu>Power Distribution Unit</pdu>
    <ups height="4">UPS</ups>
    <blank height="2"/>
    <gap height="2"/>
  </rack>
</racks>
```
````

### Text-Markup Format

Verwenden Sie Code-Blöcke mit `rack-text` oder `rack`:

````markdown
```rack-text
caption: Server Rack
height: 42
items:
  - server[2]: [[Web Server]]
  - switch: Network Switch
  - firewall: [[Firewall]]
  - cables: Cable Management
  - patch: Patch Panel
  - pdu: Power Distribution Unit
  - ups[4]: UPS
  - blank[2]: 
  - gap[2]: 
```
````

## Obsidian-Integration

### Interne Links

Das Plugin unterstützt Obsidian-interne Links:

- `[[Note Name]]` - Verlinkt zu einer anderen Note in Ihrem Vault
- `[Text](note-name)` - Markdown-Link zu einer Note
- Externe URLs funktionieren ebenfalls normal

### Beispiele

```rack-text
caption: Produktions-Rack
height: 42
items:
  - server[2]: [[Produktions-Server]]
  - switch: [[Netzwerk-Switch Konfiguration]]
  - firewall: [[Firewall Regeln]]
  - cables: Kabel-Management
```

## Unterstützte Gerätetypen

- `server` - Server
- `switch` - Netzwerk-Switch
- `firewall` - Firewall
- `router` - Router
- `cables` - Kabel-Management
- `patch` - Patch-Panel
- `pdu` - Power Distribution Unit
- `ups` - Unterbrechungsfreie Stromversorgung
- `storage` - Storage
- `tape` - Bandlaufwerk
- `monitor` - Monitor
- `keyboard` - Tastatur
- `kvm` - KVM-Switch
- `blank` - Leerer Platz
- `gap` - Lücke (nicht gezeichnet)

## Attribute

### Rack-Attribute
- `height` - Rack-Höhe in Rack-Einheiten (Standard: 42)
- `name` - Rack-Name (wird über dem Rack angezeigt)

### Geräte-Attribute
- `height` - Gerätehöhe in Rack-Einheiten (Standard: 1)
- `at` - Geräteposition im Rack (von unten gezählt)
- `href` - URL für zusätzliche Informationen (macht Gerät klickbar)
- `color` - Benutzerdefinierte Farbe (überschreibt Standard-Farbschema)

## Text-Markup-Syntax

- **Header**: `caption:` und `height:` definieren Rack-Name und -Höhe
- **Items**: Liste mit `-` Präfix für jedes Gerät
- **Gerätetyp**: `type` oder `custom:type` für benutzerdefinierte Typen
- **Höhe**: `[n]` nach Typ für Geräte mit mehr als 1U
- **Links**: Obsidian-Syntax `[[Note Name]]` oder Markdown `[Text](URL)` für klickbare Labels
- **Leere Geräte**: Leer lassen für `blank` und `gap` Einträge

## Entwicklung

Das Plugin ist in TypeScript geschrieben und basiert auf der ursprünglichen C# Konsolenanwendung.

### Build

```bash
npm install
npm run build
```

### Entwicklung

```bash
npm run dev
```

## Lizenz

MIT License