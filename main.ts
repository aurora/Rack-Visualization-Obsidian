import { Plugin, MarkdownPostProcessorContext, TFile } from 'obsidian';
import { RackVisualization, RackSet, RackMLParser, TextMarkupParser } from '@aurora/rack-visualization-js';

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

    private async processRackXml(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        try {
            // Use the library to parse and generate SVG
            const rackViz = new RackVisualization();
            const svgContent = rackViz.parseRackMLAndGenerateSvg(source.trim());
            
            // We need to parse again to get the RackSet for Obsidian-specific processing
            const rackSet = RackMLParser.parseRackML(source.trim());
            
            // Convert Obsidian links in device hrefs
            this.convertObsidianLinks(rackSet, ctx);
            
            // Regenerate SVG with converted links
            const finalSvgContent = rackViz.generateSvg(rackSet);
            
            // Save SVG to assets folder and get the path
            const svgPath = await this.saveSvgToAssets(finalSvgContent, rackSet, ctx);
            
            // Create container and insert SVG
            this.insertSvg(el, finalSvgContent, svgPath, rackSet);
            
        } catch (error) {
            this.showError(el, `Error parsing RackML XML: ${error.message}`);
        }
    }

    private async processRackText(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        try {
            // Use the library to parse and generate SVG
            const rackViz = new RackVisualization();
            const svgContent = rackViz.parseTextMarkupAndGenerateSvg(source.trim());
            
            // We need to parse again to get the RackSet for Obsidian-specific processing
            const parser = new TextMarkupParser(source.trim());
            const rackSet = parser.parse();
            
            // Convert Obsidian links in device hrefs
            this.convertObsidianLinks(rackSet, ctx);
            
            // Regenerate SVG with converted links
            const finalSvgContent = rackViz.generateSvg(rackSet);
            
            // Save SVG to assets folder and get the path
            const svgPath = await this.saveSvgToAssets(finalSvgContent, rackSet, ctx);
            
            // Create container and insert SVG
            this.insertSvg(el, finalSvgContent, svgPath, rackSet);
            
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

    private insertSvg(el: HTMLElement, svgContent: string, svgPath?: string, rackSet?: RackSet) {
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
        
        // Add a small note about the saved file if path is available
        if (svgPath) {
            const note = document.createElement('div');
            note.className = 'rack-visualization-note';
            note.style.fontSize = '0.8em';
            note.style.color = '#666';
            note.style.marginTop = '0.5em';
            note.textContent = `SVG gespeichert: ${svgPath}`;
            container.appendChild(note);
            
            // Add tip if no ID was provided
            if (rackSet && (!rackSet.id || !rackSet.id.trim())) {
                const tip = document.createElement('div');
                tip.className = 'rack-visualization-tip';
                tip.style.fontSize = '0.75em';
                tip.style.color = '#888';
                tip.style.fontStyle = 'italic';
                tip.style.marginTop = '0.25em';
                tip.textContent = `💡 Tipp: Fügen Sie 'id: mein-name' hinzu für konsistente Dateinamen`;
                container.appendChild(tip);
            }
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

    private async saveSvgToAssets(svgContent: string, rackSet: RackSet, ctx: MarkdownPostProcessorContext): Promise<string | undefined> {
        try {
            // Get the current file path from context
            const currentFile = this.app.workspace.getActiveFile();
            if (!currentFile) {
                console.warn('No active file found, cannot save SVG to assets folder');
                return undefined;
            }

            // Generate a meaningful filename based on content, not timestamp
            const filename = this.generateSvgFilename(rackSet, ctx);
            
            // Create assets folder path relative to current document
            const currentDir = currentFile.parent?.path || '';
            const assetsDir = currentDir ? `${currentDir}/assets` : 'assets';
            
            // Ensure assets directory exists
            if (!await this.app.vault.adapter.exists(assetsDir)) {
                await this.app.vault.adapter.mkdir(assetsDir);
            }
            
            // Full path for the SVG file
            const svgPath = `${assetsDir}/${filename}`;
            
            // Save the SVG file (this will overwrite existing file with same name)
            await this.app.vault.adapter.write(svgPath, svgContent);
            
            console.log(`SVG saved to: ${svgPath}`);
            return svgPath;
            
        } catch (error) {
            console.error('Error saving SVG to assets folder:', error);
            return undefined;
        }
    }

    private generateSvgFilename(rackSet: RackSet, ctx: MarkdownPostProcessorContext): string {
        const currentFile = this.app.workspace.getActiveFile();
        const documentName = currentFile ? currentFile.basename : 'document';
        
        // Clean document name for use in filename
        const cleanDocumentName = documentName
            .toLowerCase()
            .replace(/[^a-z0-9\-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        // Check if user provided an ID
        if (rackSet.id && rackSet.id.trim()) {
            const cleanId = rackSet.id.trim()
                .toLowerCase()
                .replace(/[^a-z0-9\-_]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            return `${cleanDocumentName}-${cleanId}.svg`;
        }
        
        // Fallback: Use position-based naming
        // For now, we'll use a simple counter approach
        // In a more sophisticated implementation, we could track the actual position in the document
        let baseName = 'rack-diagram';
        
        if (rackSet.racks.length > 0) {
            // Use the first rack name if available
            const firstRack = rackSet.racks[0];
            if (firstRack.name && firstRack.name.trim()) {
                baseName = firstRack.name.trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9\-_]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            }
            
            // If multiple racks, add count
            if (rackSet.racks.length > 1) {
                baseName += `-${rackSet.racks.length}racks`;
            }
        }
        
        return `${cleanDocumentName}-${baseName}.svg`;
    }

}
