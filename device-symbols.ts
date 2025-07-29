export class DeviceSymbols {
    public static getSymbolPath(deviceType: string): string {
        switch (deviceType) {
            case 'router':
                return 'M 12 7 l -5 5 l 5 5 m 3 -5 a 1,1 0 1,1 -2,0 a 1,1 0 1,1 2,0 m 5 0 a 1,1 0 1,1 -2,0 a 1,1 0 1,1 2,0 m 5 0 a 1,1 0 1,1 -2,0 a 1,1 0 1,1 2,0 m 1 -5 l 5 5 l -5 5';
            
            case 'cables':
                return 'M 12 7 l -5 5 l 5 5 m 3 -5 a 1,1 0 1,1 -2,0 a 1,1 0 1,1 2,0 m 5 0 a 1,1 0 1,1 -2,0 a 1,1 0 1,1 2,0 m 5 0 a 1,1 0 1,1 -2,0 a 1,1 0 1,1 2,0 m 1 -5 l 5 5 l -5 5';
            
            case 'firewall':
                return 'M 8 6.5 h 20 v 12 h -20 z m 0 4 h 20 m 0 4 h -20 M 7 7 m 7 0 v 4 m 8 0 v -4 m -4 4 v 4 m -4 0 v 4 m 8 0 v -4';
            
            case 'pdu':
                return 'M 17 5 v 7 m 3 -5 a 6 6 240 1 1 -6 0';
            
            case 'storage':
                return 'M 7 7 v 15 h 5 v -15 h -5 m 7 0 v 15 h 5 v -15 h -5 m 7 0 v 15 h 5 v -15 h -5';
            
            case 'server':
                return 'M 7 5 h 20 v 7 h -20 v -7 m 0 8 h 20 v 7 h -20 v -7 M 25 8 a 2,2 0 1,1 -4,0 a 2,2 0 1,1 4,0 M 25 16 a 2,2 0 1,1 -4,0 a 2,2 0 1,1 4,0';
            
            case 'switch':
                return 'M 19 5 h 6 v -2.5 l 4 4 l -4 4 v -2.5 h -6 m -2 1 h -6 v -2.5 l -4 4 l 4 4 v -2.5 h 6 m 2 2 h 6 v -2.5 l 4 4 l -4 4 v -2.5 h -6 m -2 1 h -6 v -2.5 l -4 4 l 4 4 v -2.5 h 6';
            
            case 'ups':
                return 'M 15 7 h 6 l -3 5 h 3 l -8 10 l 2 -7 h -3';
            
            default:
                return '';
        }
    }

    public static getPatchPanelPorts(): Array<{x: number, y: number, width: number, height: number}> {
        const ports: Array<{x: number, y: number, width: number, height: number}> = [];
        
        // Create 8 ports in 2 rows, exactly like C# version
        const positions = [
            {x: 7, y: 7}, {x: 14, y: 7}, {x: 21, y: 7}, {x: 28, y: 7},
            {x: 7, y: 14}, {x: 14, y: 14}, {x: 21, y: 14}, {x: 28, y: 14}
        ];
        
        for (const pos of positions) {
            ports.push({x: pos.x, y: pos.y, width: 4, height: 4});
        }
        
        return ports;
    }

    public static getTapeBackground(): {x: number, y: number, width: number, height: number} {
        return {x: 6, y: 7, width: 24, height: 15};
    }

    public static getTapeDriveCircle1(): {cx: number, cy: number, r: number} {
        return {cx: 13, cy: 15, r: 3};
    }

    public static getTapeDriveCircle2(): {cx: number, cy: number, r: number} {
        return {cx: 23, cy: 15, r: 3};
    }
}