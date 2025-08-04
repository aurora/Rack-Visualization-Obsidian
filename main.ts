import { Plugin, MarkdownPostProcessorContext } from 'obsidian';
import { RackMLParser } from './rackml-parser';
import { TextMarkupParser } from './text-markup-parser';
import { SvgGenerator } from './svg-generator';
import { RackSet } from './models';

export default class RackVisualizationPlugin extends Plugin {
    async onload() {
        console.log('Loading Rack Visualization Plugin');

        // Register code block processor for rack-xml
        this.registerMarkdownCodeBlockProcessor('rack-xml', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            this.processRackXml(source, el, ctx);
        });

        // Register code block processor for rack-text
        this.registerMarkdownCodeBlockProcessor('rack-text', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            this.processRackText(source, el, ctx);
        });

        // Also register alternative names for convenience
        this.registerMarkdownCodeBlockProcessor('rackml', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            this.processRackXml(source, el, ctx);
        });

        this.registerMarkdownCodeBlockProcessor('rack', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            this.processRackText(source, el, ctx);
        });
    }

    onunload() {
        console.log('Unloading Rack Visualization Plugin');
    }

    private processRackXml(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        try {
            // Parse RackML XML
            const rackSet = RackMLParser.parseRackML(source.trim());
            
            // Convert Obsidian links in device hrefs
            this.convertObsidianLinks(rackSet, ctx);
            
            // Generate SVG
            const svgGenerator = new SvgGenerator();
            const svgContent = svgGenerator.generateSvg(rackSet);
            
            // Create container and insert SVG
            this.insertSvg(el, svgContent);
            
        } catch (error) {
            this.showError(el, `Error parsing RackML XML: ${error.message}`);
        }
    }

    private processRackText(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        try {
            // Parse text markup
            const parser = new TextMarkupParser(source.trim());
            const rackSet = parser.parse();
            
            // Convert Obsidian links in device hrefs
            this.convertObsidianLinks(rackSet, ctx);
            
            // Generate SVG
            const svgGenerator = new SvgGenerator();
            const svgContent = svgGenerator.generateSvg(rackSet);
            
            // Create container and insert SVG
            this.insertSvg(el, svgContent);
            
        } catch (error) {
            this.showError(el, `Error parsing rack text markup: ${error.message}`);
        }
    }

    private convertObsidianLinks(rackSet: RackSet, ctx: MarkdownPostProcessorContext) {
        // Convert Obsidian-style links [[Note Name]] to proper links
        for (const rack of rackSet.racks) {
            for (const device of rack.devices) {
                if (device.href) {
                    device.href = this.resolveObsidianLink(device.href, ctx);
                }
                
                // Also check for Obsidian links in device names
                if (device.name) {
                    const linkMatch = device.name.match(/\[\[([^\]]+)\]\]/);
                    if (linkMatch) {
                        const linkText = linkMatch[1];
                        const resolvedLink = this.resolveObsidianLink(linkText, ctx);
                        device.name = device.name.replace(linkMatch[0], linkText);
                        device.href = resolvedLink;
                    }
                }
            }
        }
    }

    private resolveObsidianLink(link: string, ctx: MarkdownPostProcessorContext): string {
        // Handle Obsidian internal links
        if (link.startsWith('[[') && link.endsWith(']]')) {
            // Extract the note name
            const noteName = link.slice(2, -2);
            return `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(noteName)}`;
        }
        
        // Handle regular Obsidian links without brackets
        if (!link.startsWith('http://') && !link.startsWith('https://') && !link.startsWith('obsidian://')) {
            // Assume it's an internal note reference
            return `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(link)}`;
        }
        
        return link;
    }

    private insertSvg(el: HTMLElement, svgContent: string) {
        // Clear the element
        el.innerHTML = '';
        
        // Create a container div
        const container = document.createElement('div');
        container.className = 'rack-visualization-container';
        container.style.textAlign = 'center';
        container.style.margin = '1em 0';
        
        // Insert the SVG content
        container.innerHTML = svgContent;
        
        // Add some styling to make it responsive
        const svg = container.querySelector('svg');
        if (svg) {
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
        }
        
        el.appendChild(container);
    }

    private showError(el: HTMLElement, message: string) {
        el.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'rack-visualization-error';
        errorDiv.style.color = 'red';
        errorDiv.style.border = '1px solid red';
        errorDiv.style.padding = '1em';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.backgroundColor = '#ffe6e6';
        errorDiv.textContent = message;
        el.appendChild(errorDiv);
    }
}
