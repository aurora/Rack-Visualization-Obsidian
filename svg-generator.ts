import { RackSet, Rack, RackDevice } from './models';
import { ColorSchemes } from './color-schemes';
import { DeviceSymbols } from './device-symbols';

export class SvgGenerator {
    private static readonly DEFAULT_RACK_HEIGHT_UNITS = 42;
    private static readonly DEFAULT_RACK_SPACING_POINTS = 25;
    private static readonly DEFAULT_RACK_UNIT_POINTS = 25;
    private static readonly DEFAULT_RACK_WIDTH_POINTS = 300;
    private static readonly DEFAULT_SVG_MARGIN = 25;

    public generateSvg(rackSet: RackSet): string {
        // Calculate the actual maximum height needed based on device positions
        const maxRackHeight = rackSet.racks.length > 0
            ? Math.max(...rackSet.racks.map(r => this.calculateActualRackHeight(r)))
            : SvgGenerator.DEFAULT_RACK_HEIGHT_UNITS;

        const rackCount = rackSet.racks.length;
        const svgHeight = (2 * SvgGenerator.DEFAULT_SVG_MARGIN) + (SvgGenerator.DEFAULT_RACK_UNIT_POINTS * maxRackHeight);

        // Calculate maximum label length (in characters) with reasonable limit
        let maxLabelLen = 0;
        for (const rack of rackSet.racks) {
            for (const device of rack.devices) {
                if (device.name && device.name.length > maxLabelLen) {
                    maxLabelLen = device.name.length;
                }
            }
        }
        // Limit label width to prevent excessive SVG width (max 30 characters)
        const effectiveLabelLen = Math.min(maxLabelLen, 30);
        // Estimate width: 8px per character + 32px buffer
        const labelWidth = (effectiveLabelLen * 8) + 32;

        const svgWidth = (2 * SvgGenerator.DEFAULT_SVG_MARGIN) + (rackCount * SvgGenerator.DEFAULT_RACK_WIDTH_POINTS) +
                        ((rackCount - 1) * SvgGenerator.DEFAULT_RACK_SPACING_POINTS) + labelWidth;

        const svg: string[] = [];
        // Use viewBox for responsive scaling - SVG will scale to fit container width
        svg.push(`<svg baseProfile="full" viewBox="0 0 ${svgWidth} ${svgHeight}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="max-width: 100%; height: auto;">`);
        
        // Add CSS styles
        svg.push(`<style>
            a text {
                fill: #0066cc;
                text-decoration: underline;
            }
            a:hover text {
                fill: #004499;
                filter: brightness(90%);
            }
            /* Responsive text scaling */
            text {
                font-size: 13px;
            }
            @media (max-width: 768px) {
                text {
                    font-size: 11px;
                }
            }
        </style>`);

        // Add empty pattern
        svg.push(this.generateEmptyPattern());

        let xOffset = SvgGenerator.DEFAULT_SVG_MARGIN;
        for (const rack of rackSet.racks) {
            // Scale to the left of the rack (with more distance) - use actual height
            svg.push(`<g transform="translate(${xOffset - 50}, 0)">`);
            svg.push(this.generateRackScale(this.calculateActualRackHeight(rack)));
            svg.push('</g>');

            // Rack itself
            svg.push(`<g transform="translate(${xOffset}, 0)">`);
            svg.push(this.generateRack(rack, rackSet.base));
            svg.push('</g>');

            xOffset += SvgGenerator.DEFAULT_RACK_WIDTH_POINTS + SvgGenerator.DEFAULT_RACK_SPACING_POINTS;
        }

        svg.push('</svg>');
        return svg.join('\n');
    }

    private generateEmptyPattern(): string {
        return `<pattern id="pattern-empty" patternUnits="userSpaceOnUse" width="25" height="25">
            <path d="M 0 12.5 L 25 12.5" fill="none" stroke="#ccc" stroke-width="1"/>
        </pattern>`;
    }

    private generateRack(rack: Rack, baseHref?: string): string {
        const rackSvg: string[] = [];
        const actualRackHeight = this.calculateActualRackHeight(rack);

        // Add rack name if present
        if (rack.name) {
            const nameY = (SvgGenerator.DEFAULT_SVG_MARGIN / 2.0) + 2;
            rackSvg.push(`<text x="${SvgGenerator.DEFAULT_RACK_WIDTH_POINTS / 2}" y="${nameY}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${this.xmlEscape(rack.name)}</text>`);
        }

        // Add rack background - use actual height to ensure all devices fit
        rackSvg.push(`<rect x="0" y="${SvgGenerator.DEFAULT_SVG_MARGIN}" width="${SvgGenerator.DEFAULT_RACK_WIDTH_POINTS}" height="${actualRackHeight * SvgGenerator.DEFAULT_RACK_UNIT_POINTS}" fill="url(#pattern-empty)" stroke="black"/>`);

        // Calculate device positions - use actual height
        const rackBottomY = (actualRackHeight * SvgGenerator.DEFAULT_RACK_UNIT_POINTS) + SvgGenerator.DEFAULT_SVG_MARGIN;
        let currentPosition = 0;

        // Process devices from top to bottom (natural order)
        const devices = rack.devices;

        for (const device of devices) {
            const at = device.position !== undefined ? device.position - 1 : currentPosition;
            const deviceY = SvgGenerator.DEFAULT_SVG_MARGIN + (at * SvgGenerator.DEFAULT_RACK_UNIT_POINTS);

            rackSvg.push(`<g transform="translate(0, ${deviceY})">`);
            rackSvg.push(this.generateDevice(device, baseHref));
            rackSvg.push('</g>');

            currentPosition = at + device.height;
        }

        return rackSvg.join('\n');
    }

    private generateDevice(device: RackDevice, baseHref?: string): string {
        const deviceHeight = device.height * SvgGenerator.DEFAULT_RACK_UNIT_POINTS;
        const color = device.color || ColorSchemes.getColor(device.type);

        const deviceSvg: string[] = [];

        // Device background rectangle
        deviceSvg.push(`<rect x="0" y="0" width="${SvgGenerator.DEFAULT_RACK_WIDTH_POINTS}" height="${deviceHeight}" fill="${color}" stroke="black"/>`);

        // The device type is now displayed in the shape (centered)
        const textY = (deviceHeight / 2.0) + 2;
        deviceSvg.push(`<text x="${SvgGenerator.DEFAULT_RACK_WIDTH_POINTS / 2}" y="${textY}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="13">${this.xmlEscape(device.type)}</text>`);

        // Label outside the rack on the right, vertically centered to the unit
        if (device.name) {
            const labelX = SvgGenerator.DEFAULT_RACK_WIDTH_POINTS + 16; // 16px distance to the right of the rack
            const labelY = (deviceHeight / 2.0) + 2;
            
            // Truncate very long labels and add ellipsis
            const displayName = device.name.length > 30
                ? device.name.substring(0, 27) + '...'
                : device.name;
            
            let labelText = `<text x="${labelX}" y="${labelY}" text-anchor="start" dominant-baseline="middle" font-family="sans-serif" font-size="13" title="${this.xmlEscape(device.name)}">${this.xmlEscape(displayName)}</text>`;

            // Add label outside the rack
            deviceSvg.push(labelText);
        }

        // Device symbols based on type
        this.addDeviceSymbol(deviceSvg, device);

        const deviceContent = deviceSvg.join('\n');

        // Wrap in link if href is provided
        if (device.href) {
            const href = baseHref && this.isAbsoluteUrl(baseHref)
                ? new URL(device.href, baseHref).toString()
                : device.href;

            return `<a href="${this.xmlEscape(href)}">${deviceContent}</a>`;
        }

        return deviceContent;
    }

    private addDeviceSymbol(deviceSvg: string[], device: RackDevice): void {
        switch (device.type) {
            case 'patch':
                // Patch panel ports (8 rectangles in 2 rows)
                const ports = DeviceSymbols.getPatchPanelPorts();
                for (const port of ports) {
                    deviceSvg.push(`<rect x="${port.x}" y="${port.y}" width="${port.width}" height="${port.height}" fill="#555" stroke="none"/>`);
                }
                break;

            case 'pdu':
                // PDU symbol with specific stroke properties
                const pduPath = DeviceSymbols.getSymbolPath('pdu');
                deviceSvg.push(`<path d="${pduPath}" stroke="#555" fill="none" stroke-width="2" stroke-linecap="round"/>`);
                break;

            case 'storage':
                // Storage symbol with filled rectangles
                const storagePath = DeviceSymbols.getSymbolPath('storage');
                deviceSvg.push(`<path d="${storagePath}" stroke="none" fill="#555" fill-rule="evenodd"/>`);
                break;

            case 'server':
                // Server symbol with filled path
                const serverPath = DeviceSymbols.getSymbolPath('server');
                deviceSvg.push(`<path d="${serverPath}" stroke="none" fill="#555" fill-rule="evenodd"/>`);
                break;

            case 'switch':
                // Switch symbol with filled arrows
                const switchPath = DeviceSymbols.getSymbolPath('switch');
                deviceSvg.push(`<path d="${switchPath}" fill="#555" stroke="none"/>`);
                break;

            case 'tape':
                // Tape drive with background rectangle and two circles
                const bg = DeviceSymbols.getTapeBackground();
                deviceSvg.push(`<rect x="${bg.x}" y="${bg.y}" width="${bg.width}" height="${bg.height}" fill="#555" stroke="none"/>`);
                
                const circle1 = DeviceSymbols.getTapeDriveCircle1();
                const circle2 = DeviceSymbols.getTapeDriveCircle2();
                deviceSvg.push(`<circle cx="${circle1.cx}" cy="${circle1.cy}" r="${circle1.r}" stroke="#ccc" fill="#555" stroke-width="2"/>`);
                deviceSvg.push(`<circle cx="${circle2.cx}" cy="${circle2.cy}" r="${circle2.r}" stroke="#ccc" fill="#555" stroke-width="2"/>`);
                break;

            case 'ups':
                // UPS symbol with filled lightning bolt
                const upsPath = DeviceSymbols.getSymbolPath('ups');
                deviceSvg.push(`<path d="${upsPath}" fill="#555" stroke="none"/>`);
                break;

            default:
                // Default symbols with stroke
                const symbolPath = DeviceSymbols.getSymbolPath(device.type);
                if (symbolPath) {
                    deviceSvg.push(`<path d="${symbolPath}" fill="none" stroke="#555" stroke-width="2"/>`);
                }
                break;
        }
    }

    // Scale for height units (U) to the left of the rack
    private generateRackScale(rackHeight: number): string {
        const sb: string[] = [];
        const scaleX = 44; // Distance from left (scale is positioned from x=0 to x=32)
        const textX = scaleX; // Text right-aligned, some distance from the line
        const lineX1 = scaleX - 14; // Line starts on the left
        const lineX2 = scaleX + 2;      // Line ends on the right (at the rack)

        for (let u = rackHeight; u >= 1; u--) {
            // Y-Position: Top edge of the respective height unit
            const y = SvgGenerator.DEFAULT_SVG_MARGIN + (rackHeight - u) * SvgGenerator.DEFAULT_RACK_UNIT_POINTS;

            // Text (right-aligned, vertically centered in the unit)
            sb.push(`<text x="${textX}" y="${y + SvgGenerator.DEFAULT_RACK_UNIT_POINTS / 2.0 + 2}" text-anchor="end" dominant-baseline="middle" font-family="sans-serif" font-size="12">${u}</text>`);
            // Scale line
            sb.push(`<line x1="${lineX1}" y1="${y}" x2="${lineX2}" y2="${y}" stroke="black" stroke-width="2"/>`);
        }
        // Bottom edge (last line)
        const yBottom = SvgGenerator.DEFAULT_SVG_MARGIN + rackHeight * SvgGenerator.DEFAULT_RACK_UNIT_POINTS;
        sb.push(`<line x1="${lineX1}" y1="${yBottom}" x2="${lineX2}" y2="${yBottom}" stroke="black" stroke-width="2"/>`);

        return sb.join('\n');
    }

    private xmlEscape(input: string): string {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private isAbsoluteUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private calculateActualRackHeight(rack: Rack): number {
        // Start with the nominal rack height
        let maxHeight = rack.height;
        
        // Check all devices to find the actual maximum height needed
        let currentPosition = 0;
        
        for (const device of rack.devices) {
            const at = device.position !== undefined ? device.position - 1 : currentPosition;
            const deviceEndPosition = at + device.height;
            
            // Update the maximum height if this device extends beyond it
            if (deviceEndPosition > maxHeight) {
                maxHeight = deviceEndPosition;
            }
            
            currentPosition = at + device.height;
        }
        
        return maxHeight;
    }
}