# Rack Visualization Text Markup Beispiel

Dieses Beispiel zeigt, wie Sie das Text-Markup Format in Obsidian verwenden können:

```rack-text
caption: Server Rack
height: 42
items:
  - patch: Patch Panel
  - cables: Kabel-Management
  - switch: Core Switch
  - cables: Kabel-Management
  - patch: Patch Panel
  - cables: Kabel-Management
  - switch: Access Switch
  - cables: Kabel-Management
  - firewall: Perimeter Firewall
  - cables: Kabel-Management
  - firewall: Internal Firewall
  - cables: Kabel-Management
  - monitor[8]: KVM Monitor
  - keyboard: KVM Keyboard
  - kvm: KVM Switch
  - blank[2]: 
  - server[2]: Web Server
  - storage[2]: Storage Array
  - server[4]: Database Server
  - gap[2]: 
  - pdu: Power Distribution
  - ups[4]: UPS System
```

## Mit Obsidian Links

```rack-text
caption: Produktions-Rack
height: 20
items:
  - server[2]: [[Produktions-Server]]
  - switch: [[Netzwerk-Switch Konfiguration]]
  - firewall: [[Firewall Regeln]]
  - cables: Kabel-Management
  - patch: [[Patch-Panel Dokumentation]]
  - pdu: Power Distribution Unit
  - ups[4]: [[UPS Wartung]]
```

## Mit Markdown Links

```rack-text
caption: Test-Rack
height: 15
items:
  - server[2]: [Web Server](https://server-docs.example.com)
  - switch: [Core Switch](switch-config)
  - firewall: [Firewall](firewall-rules)
  - cables: Kabel-Management
  - pdu: PDU
```

## Erweiterte Syntax

```rack-text
caption: Rechenzentrum Rack A1
height: 42
items:
  - custom:server[4]: Hochleistungs-Server
  - network:switch[2]: Managed Switch
  - security:firewall: Next-Gen Firewall
  - cables: Strukturierte Verkabelung
  - power:pdu: Intelligente PDU
  - power:ups[6]: Redundante USV
  - blank[10]: Reserviert für Erweiterung