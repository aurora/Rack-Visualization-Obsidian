export interface RackDevice {
    type: string;
    name: string;
    height: number;
    position?: number;
    href?: string;
    color?: string;
}

export interface Rack {
    name: string;
    height: number;
    devices: RackDevice[];
}

export interface RackSet {
    base?: string;
    racks: Rack[];
}

export enum DeviceType {
    Server = 'server',
    Switch = 'switch',
    Firewall = 'firewall',
    Router = 'router',
    Cables = 'cables',
    Patch = 'patch',
    PDU = 'pdu',
    UPS = 'ups',
    Storage = 'storage',
    Tape = 'tape',
    Monitor = 'monitor',
    Keyboard = 'keyboard',
    KVM = 'kvm',
    Blank = 'blank',
    Gap = 'gap'
}

export interface ColorScheme {
    [key: string]: string;
}

export interface DeviceSymbol {
    [key: string]: string;
}