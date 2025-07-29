import { ColorScheme } from './models';

export class ColorSchemes {
    private static readonly schemes: { [key: string]: ColorScheme } = {
        'default': {
            '_default': 'white',
            'blank': '#e2e8f0',
            'cables': '#f6ad55',
            'firewall': '#f56565',
            'patch': '#faf089',
            'pdu': '#38a169',
            'storage': '#4fd1c5',
            'server': '#63b3ed',
            'switch': '#b1dd9e',
            'ups': '#38a169',
            'router': '#0583D2',
            'monitor': '#e2e8f0',
            'keyboard': '#e2e8f0',
            'kvm': '#e2e8f0',
            'tape': '#c7ceea'
        },
        'pastel': {
            '_default': '#f4f4f4',
            'cables': '#ffdac1',
            'firewall': '#ff9aa2',
            'patch': '#ffdac1',
            'pdu': '#b5ead7',
            'storage': '#c7ceea',
            'server': '#c7ceea',
            'switch': '#b1dd9e',
            'tape': '#c7ceea',
            'ups': '#b5ead7',
            'router': '#54c2cc',
            'monitor': '#f4f4f4',
            'keyboard': '#f4f4f4',
            'kvm': '#f4f4f4',
            'blank': '#f4f4f4'
        }
    };

    public static getColor(deviceType: string, scheme: string = 'pastel'): string {
        const colorScheme = this.schemes[scheme];
        if (colorScheme) {
            return colorScheme[deviceType] || colorScheme['_default'];
        }
        return 'white';
    }

    public static getSchemes(): { [key: string]: ColorScheme } {
        return this.schemes;
    }
}