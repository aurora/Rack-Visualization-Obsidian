import { Plugin } from 'obsidian';
export default class RackVisualizationPlugin extends Plugin {
    onload(): Promise<void>;
    onunload(): void;
    private processRackXml;
    private processRackText;
    private convertObsidianLinks;
    private resolveObsidianLink;
    private insertSvg;
    private showError;
    private saveSvgToAssets;
    private generateSvgFilename;
}
