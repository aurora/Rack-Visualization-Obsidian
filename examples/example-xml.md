# Rack Visualization XML Beispiel

Dieses Beispiel zeigt, wie Sie RackML XML in Obsidian verwenden können:

```rack-xml
<racks base="Rack Group Name">
  <rack height="42" name="Example">
    <patch>Patch</patch>
    <cables>Cables</cables>
    <switch>Switch</switch>
    <cables>Cables</cables>
    <patch>Patch</patch>
    <cables>Cables</cables>
    <switch>Switch</switch>
    <cables>Cables</cables>
    <firewall href="firewall-01">Firewall</firewall>
    <cables>Cables</cables>
    <firewall href="firewall-02">Firewall</firewall>
    <cables at="31">Cables</cables>
    <monitor height="8">Monitor</monitor>
    <keyboard>Keyboard</keyboard>
    <kvm>KVM</kvm>
    <blank height="2"/>
    <server height="2" href="server-01">Server</server>
    <storage height="2" href="storage-01">Storage</storage>
    <server href="server-02" height="4">Server</server>
    <gap height="2"/>
    <pdu>Power Distribution Unit</pdu>
    <ups height="4">Power Supply</ups>
  </rack>
</racks>
```

## Mit Obsidian Links

```rack-xml
<racks>
  <rack height="20" name="Produktions-Rack">
    <server height="2" href="[[Produktions-Server]]">Web Server</server>
    <switch href="[[Netzwerk-Konfiguration]]">Core Switch</switch>
    <firewall href="[[Firewall-Regeln]]">Perimeter Firewall</firewall>
    <cables>Kabel-Management</cables>
    <pdu>PDU</pdu>
  </rack>
</racks>