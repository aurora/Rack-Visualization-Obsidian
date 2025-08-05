# SVG Responsive Skalierung - Lösung für Abschneideproblem

## Problem
Das SVG wurde in Obsidian manchmal abgeschnitten, besonders wenn:
- Der Viewport/Schreibbereich schmaler wurde
- Labels außerhalb der Racks sehr lang waren
- Das SVG eine feste Breite hatte, die nicht responsiv war

## Ursache
1. **Feste SVG-Dimensionen**: Das SVG verwendete feste `width` und `height` Attribute
2. **Keine responsive Skalierung**: Kein `viewBox` für automatische Anpassung
3. **Unbegrenzte Label-Länge**: Sehr lange Gerätenamen führten zu extrem breiten SVGs

## Implementierte Lösung

### 1. ViewBox für responsive Skalierung
```typescript
// Vorher: Feste Dimensionen
svg.push(`<svg width="${svgWidth}" height="${svgHeight}" ...>`);

// Nachher: Responsive mit viewBox
svg.push(`<svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="max-width: 100%; height: auto;" ...>`);
```

### 2. Label-Längen-Begrenzung
```typescript
// Begrenze Label-Breite auf maximal 30 Zeichen
const effectiveLabelLen = Math.min(maxLabelLen, 30);
const labelWidth = (effectiveLabelLen * 8) + 32;

// Kürze lange Labels mit Ellipsis
const displayName = device.name.length > 30 
    ? device.name.substring(0, 27) + '...' 
    : device.name;
```

### 3. Responsive CSS-Styles
```css
text { font-size: 13px; }
@media (max-width: 768px) {
    text { font-size: 11px; }
}
```

## Vorteile der Lösung

1. **Automatische Skalierung**: SVG passt sich an jeden Container an
2. **Keine Abschneidung**: Vollständige Sichtbarkeit in allen Viewport-Größen
3. **Bessere UX**: Lange Labels werden gekürzt, aber mit Tooltip verfügbar
4. **Rückwärtskompatibilität**: Bestehende Funktionalität bleibt erhalten
5. **Performance**: Begrenzte SVG-Breite verhindert extreme Größen

## Getestete Szenarien

- ✅ Schmale Viewports (400px)
- ✅ Normale Desktop-Ansicht (800px)
- ✅ Breite Bildschirme (1200px)
- ✅ Sehr lange Gerätenamen
- ✅ Multiple Racks
- ✅ Verschiedene Rack-Höhen

## Technische Details

### Geänderte Dateien
- `svg-generator.ts`: Hauptimplementierung der responsive Skalierung

### Neue Features
- `viewBox`-basierte Skalierung
- Label-Kürzung mit Tooltip
- Responsive CSS-Styles
- Begrenzte maximale SVG-Breite

### Backward Compatibility
- Alle bestehenden Features funktionieren weiterhin
- Keine Breaking Changes
- Bestehende Rack-Definitionen bleiben kompatibel