import { __awaiter } from "tslib";
import { Plugin } from 'obsidian';
import { RackVisualization, RackMLParser, TextMarkupParser } from '@aurora/rack-visualization-js';
export default class RackVisualizationPlugin extends Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Loading Rack Visualization Plugin');
            // Register code block processor for rack-xml
            this.registerMarkdownCodeBlockProcessor('rack-xml', (source, el, ctx) => {
                this.processRackXml(source, el, ctx);
            });
            // Register code block processor for rack-text
            this.registerMarkdownCodeBlockProcessor('rack-text', (source, el, ctx) => {
                this.processRackText(source, el, ctx);
            });
            // Also register alternative names for convenience
            this.registerMarkdownCodeBlockProcessor('rackml', (source, el, ctx) => {
                this.processRackXml(source, el, ctx);
            });
            this.registerMarkdownCodeBlockProcessor('rack', (source, el, ctx) => {
                this.processRackText(source, el, ctx);
            });
        });
    }
    onunload() {
        console.log('Unloading Rack Visualization Plugin');
    }
    processRackXml(source, el, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const svgPath = yield this.saveSvgToAssets(finalSvgContent, rackSet, ctx);
                // Create container and insert SVG
                this.insertSvg(el, finalSvgContent, svgPath, rackSet);
            }
            catch (error) {
                this.showError(el, `Error parsing RackML XML: ${error.message}`);
            }
        });
    }
    processRackText(source, el, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const svgPath = yield this.saveSvgToAssets(finalSvgContent, rackSet, ctx);
                // Create container and insert SVG
                this.insertSvg(el, finalSvgContent, svgPath, rackSet);
            }
            catch (error) {
                this.showError(el, `Error parsing rack text markup: ${error.message}`);
            }
        });
    }
    convertObsidianLinks(rackSet, ctx) {
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
    resolveObsidianLink(link, ctx) {
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
    insertSvg(el, svgContent, svgPath, rackSet) {
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
    showError(el, message) {
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
    saveSvgToAssets(svgContent, rackSet, ctx) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
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
                const currentDir = ((_a = currentFile.parent) === null || _a === void 0 ? void 0 : _a.path) || '';
                const assetsDir = currentDir ? `${currentDir}/assets` : 'assets';
                // Ensure assets directory exists
                if (!(yield this.app.vault.adapter.exists(assetsDir))) {
                    yield this.app.vault.adapter.mkdir(assetsDir);
                }
                // Full path for the SVG file
                const svgPath = `${assetsDir}/${filename}`;
                // Save the SVG file (this will overwrite existing file with same name)
                yield this.app.vault.adapter.write(svgPath, svgContent);
                console.log(`SVG saved to: ${svgPath}`);
                return svgPath;
            }
            catch (error) {
                console.error('Error saving SVG to assets folder:', error);
                return undefined;
            }
        });
    }
    generateSvgFilename(rackSet, ctx) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQXVDLE1BQU0sVUFBVSxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxpQkFBaUIsRUFBVyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUUzRyxNQUFNLENBQUMsT0FBTyxPQUFPLHVCQUF3QixTQUFRLE1BQU07SUFDakQsTUFBTTs7WUFDUixPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFFakQsNkNBQTZDO1lBQzdDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxNQUFjLEVBQUUsRUFBZSxFQUFFLEdBQWlDLEVBQUUsRUFBRTtnQkFDdkgsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1lBRUgsOENBQThDO1lBQzlDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxNQUFjLEVBQUUsRUFBZSxFQUFFLEdBQWlDLEVBQUUsRUFBRTtnQkFDeEgsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLENBQUMsQ0FBQyxDQUFDO1lBRUgsa0RBQWtEO1lBQ2xELElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFjLEVBQUUsRUFBZSxFQUFFLEdBQWlDLEVBQUUsRUFBRTtnQkFDckgsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQWMsRUFBRSxFQUFlLEVBQUUsR0FBaUMsRUFBRSxFQUFFO2dCQUNuSCxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDO0tBQUE7SUFFRCxRQUFRO1FBQ0osT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFYSxjQUFjLENBQUMsTUFBYyxFQUFFLEVBQWUsRUFBRSxHQUFpQzs7WUFDM0YsSUFBSTtnQkFDQSw0Q0FBNEM7Z0JBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUVwRSw2RUFBNkU7Z0JBQzdFLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBRXhELHlDQUF5QztnQkFDekMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFFeEMsc0NBQXNDO2dCQUN0QyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUVyRCw2Q0FBNkM7Z0JBQzdDLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUUxRSxrQ0FBa0M7Z0JBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFFekQ7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSw2QkFBNkIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7YUFDcEU7UUFDTCxDQUFDO0tBQUE7SUFFYSxlQUFlLENBQUMsTUFBYyxFQUFFLEVBQWUsRUFBRSxHQUFpQzs7WUFDNUYsSUFBSTtnQkFDQSw0Q0FBNEM7Z0JBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUV4RSw2RUFBNkU7Z0JBQzdFLE1BQU0sTUFBTSxHQUFHLElBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFL0IseUNBQXlDO2dCQUN6QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUV4QyxzQ0FBc0M7Z0JBQ3RDLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRXJELDZDQUE2QztnQkFDN0MsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBRTFFLGtDQUFrQztnQkFDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQzthQUV6RDtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNaLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLG1DQUFtQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQzthQUMxRTtRQUNMLENBQUM7S0FBQTtJQUVPLG9CQUFvQixDQUFDLE9BQWdCLEVBQUUsR0FBaUM7UUFDNUUsNkRBQTZEO1FBQzdELEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtZQUM5QixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQy9CLElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtvQkFDYixNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUM1RDtnQkFFRCxnREFBZ0Q7Z0JBQ2hELElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtvQkFDYixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUN4RCxJQUFJLFNBQVMsRUFBRTt3QkFDWCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzlCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7d0JBQzdELE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUMxRCxNQUFNLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztxQkFDOUI7aUJBQ0o7YUFDSjtTQUNKO0lBQ0wsQ0FBQztJQUVPLG1CQUFtQixDQUFDLElBQVksRUFBRSxHQUFpQztRQUN2RSxpQ0FBaUM7UUFDakMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDOUMsd0JBQXdCO1lBQ3hCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsT0FBTyx5QkFBeUIsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsU0FBUyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1NBQ3ZIO1FBRUQsaURBQWlEO1FBQ2pELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDaEcseUNBQXlDO1lBQ3pDLE9BQU8seUJBQXlCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLFNBQVMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztTQUNuSDtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTyxTQUFTLENBQUMsRUFBZSxFQUFFLFVBQWtCLEVBQUUsT0FBZ0IsRUFBRSxPQUFpQjtRQUN0RixvQkFBb0I7UUFDcEIsRUFBRSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFFbEIseUJBQXlCO1FBQ3pCLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEQsU0FBUyxDQUFDLFNBQVMsR0FBRyw4QkFBOEIsQ0FBQztRQUNyRCxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDckMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBRWpDLHlCQUF5QjtRQUN6QixTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQztRQUVqQyx5Q0FBeUM7UUFDekMsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLEdBQUcsRUFBRTtZQUNMLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztZQUM1QixHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7U0FDN0I7UUFFRCw2REFBNkQ7UUFDN0QsSUFBSSxPQUFPLEVBQUU7WUFDVCxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxTQUFTLEdBQUcseUJBQXlCLENBQUM7WUFDM0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztZQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7WUFDL0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxvQkFBb0IsT0FBTyxFQUFFLENBQUM7WUFDakQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU1QixnQ0FBZ0M7WUFDaEMsSUFBSSxPQUFPLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUU7Z0JBQ2hELE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsd0JBQXdCLENBQUM7Z0JBQ3pDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztnQkFDOUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO2dCQUN6QixHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7Z0JBQy9CLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztnQkFDL0IsR0FBRyxDQUFDLFdBQVcsR0FBRyxxRUFBcUUsQ0FBQztnQkFDeEYsU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUM5QjtTQUNKO1FBRUQsRUFBRSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRU8sU0FBUyxDQUFDLEVBQWUsRUFBRSxPQUFlO1FBQzlDLEVBQUUsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0MsUUFBUSxDQUFDLFNBQVMsR0FBRywwQkFBMEIsQ0FBQztRQUNoRCxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDN0IsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsZUFBZSxDQUFDO1FBQ3hDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUMvQixRQUFRLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDcEMsUUFBUSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO1FBQzNDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVhLGVBQWUsQ0FBQyxVQUFrQixFQUFFLE9BQWdCLEVBQUUsR0FBaUM7OztZQUNqRyxJQUFJO2dCQUNBLHlDQUF5QztnQkFDekMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ2QsT0FBTyxDQUFDLElBQUksQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO29CQUN2RSxPQUFPLFNBQVMsQ0FBQztpQkFDcEI7Z0JBRUQsaUVBQWlFO2dCQUNqRSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUV4RCx5REFBeUQ7Z0JBQ3pELE1BQU0sVUFBVSxHQUFHLENBQUEsTUFBQSxXQUFXLENBQUMsTUFBTSwwQ0FBRSxJQUFJLEtBQUksRUFBRSxDQUFDO2dCQUNsRCxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztnQkFFakUsaUNBQWlDO2dCQUNqQyxJQUFJLENBQUMsQ0FBQSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUEsRUFBRTtvQkFDakQsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUNqRDtnQkFFRCw2QkFBNkI7Z0JBQzdCLE1BQU0sT0FBTyxHQUFHLEdBQUcsU0FBUyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUUzQyx1RUFBdUU7Z0JBQ3ZFLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXhELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ3hDLE9BQU8sT0FBTyxDQUFDO2FBRWxCO1lBQUMsT0FBTyxLQUFLLEVBQUU7Z0JBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDM0QsT0FBTyxTQUFTLENBQUM7YUFDcEI7O0tBQ0o7SUFFTyxtQkFBbUIsQ0FBQyxPQUFnQixFQUFFLEdBQWlDO1FBQzNFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3ZELE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBRXJFLDBDQUEwQztRQUMxQyxNQUFNLGlCQUFpQixHQUFHLFlBQVk7YUFDakMsV0FBVyxFQUFFO2FBQ2IsT0FBTyxDQUFDLGVBQWUsRUFBRSxHQUFHLENBQUM7YUFDN0IsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUM7YUFDbkIsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUUzQiwrQkFBK0I7UUFDL0IsSUFBSSxPQUFPLENBQUMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDakMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7aUJBQzVCLFdBQVcsRUFBRTtpQkFDYixPQUFPLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQztpQkFDN0IsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUM7aUJBQ25CLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0IsT0FBTyxHQUFHLGlCQUFpQixJQUFJLE9BQU8sTUFBTSxDQUFDO1NBQ2hEO1FBRUQsc0NBQXNDO1FBQ3RDLCtDQUErQztRQUMvQyw2RkFBNkY7UUFDN0YsSUFBSSxRQUFRLEdBQUcsY0FBYyxDQUFDO1FBRTlCLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLHVDQUF1QztZQUN2QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25DLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN6QyxRQUFRLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7cUJBQzNCLFdBQVcsRUFBRTtxQkFDYixPQUFPLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQztxQkFDN0IsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUM7cUJBQ25CLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDOUI7WUFFRCwrQkFBK0I7WUFDL0IsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzFCLFFBQVEsSUFBSSxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxPQUFPLENBQUM7YUFDL0M7U0FDSjtRQUVELE9BQU8sR0FBRyxpQkFBaUIsSUFBSSxRQUFRLE1BQU0sQ0FBQztJQUNsRCxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQbHVnaW4sIE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBSYWNrVmlzdWFsaXphdGlvbiwgUmFja1NldCwgUmFja01MUGFyc2VyLCBUZXh0TWFya3VwUGFyc2VyIH0gZnJvbSAnQGF1cm9yYS9yYWNrLXZpc3VhbGl6YXRpb24tanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmFja1Zpc3VhbGl6YXRpb25QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xyXG4gICAgYXN5bmMgb25sb2FkKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdMb2FkaW5nIFJhY2sgVmlzdWFsaXphdGlvbiBQbHVnaW4nKTtcclxuXHJcbiAgICAgICAgLy8gUmVnaXN0ZXIgY29kZSBibG9jayBwcm9jZXNzb3IgZm9yIHJhY2steG1sXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKCdyYWNrLXhtbCcsIChzb3VyY2U6IHN0cmluZywgZWw6IEhUTUxFbGVtZW50LCBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmFja1htbChzb3VyY2UsIGVsLCBjdHgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBSZWdpc3RlciBjb2RlIGJsb2NrIHByb2Nlc3NvciBmb3IgcmFjay10ZXh0XHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKCdyYWNrLXRleHQnLCAoc291cmNlOiBzdHJpbmcsIGVsOiBIVE1MRWxlbWVudCwgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1JhY2tUZXh0KHNvdXJjZSwgZWwsIGN0eCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEFsc28gcmVnaXN0ZXIgYWx0ZXJuYXRpdmUgbmFtZXMgZm9yIGNvbnZlbmllbmNlXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKCdyYWNrbWwnLCAoc291cmNlOiBzdHJpbmcsIGVsOiBIVE1MRWxlbWVudCwgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1JhY2tYbWwoc291cmNlLCBlbCwgY3R4KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKCdyYWNrJywgKHNvdXJjZTogc3RyaW5nLCBlbDogSFRNTEVsZW1lbnQsIGN0eDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSYWNrVGV4dChzb3VyY2UsIGVsLCBjdHgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbnVubG9hZCgpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnVW5sb2FkaW5nIFJhY2sgVmlzdWFsaXphdGlvbiBQbHVnaW4nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHByb2Nlc3NSYWNrWG1sKHNvdXJjZTogc3RyaW5nLCBlbDogSFRNTEVsZW1lbnQsIGN0eDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSB0aGUgbGlicmFyeSB0byBwYXJzZSBhbmQgZ2VuZXJhdGUgU1ZHXHJcbiAgICAgICAgICAgIGNvbnN0IHJhY2tWaXogPSBuZXcgUmFja1Zpc3VhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgY29uc3Qgc3ZnQ29udGVudCA9IHJhY2tWaXoucGFyc2VSYWNrTUxBbmRHZW5lcmF0ZVN2Zyhzb3VyY2UudHJpbSgpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gcGFyc2UgYWdhaW4gdG8gZ2V0IHRoZSBSYWNrU2V0IGZvciBPYnNpZGlhbi1zcGVjaWZpYyBwcm9jZXNzaW5nXHJcbiAgICAgICAgICAgIGNvbnN0IHJhY2tTZXQgPSBSYWNrTUxQYXJzZXIucGFyc2VSYWNrTUwoc291cmNlLnRyaW0oKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBDb252ZXJ0IE9ic2lkaWFuIGxpbmtzIGluIGRldmljZSBocmVmc1xyXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnRPYnNpZGlhbkxpbmtzKHJhY2tTZXQsIGN0eCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBSZWdlbmVyYXRlIFNWRyB3aXRoIGNvbnZlcnRlZCBsaW5rc1xyXG4gICAgICAgICAgICBjb25zdCBmaW5hbFN2Z0NvbnRlbnQgPSByYWNrVml6LmdlbmVyYXRlU3ZnKHJhY2tTZXQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gU2F2ZSBTVkcgdG8gYXNzZXRzIGZvbGRlciBhbmQgZ2V0IHRoZSBwYXRoXHJcbiAgICAgICAgICAgIGNvbnN0IHN2Z1BhdGggPSBhd2FpdCB0aGlzLnNhdmVTdmdUb0Fzc2V0cyhmaW5hbFN2Z0NvbnRlbnQsIHJhY2tTZXQsIGN0eCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgY29udGFpbmVyIGFuZCBpbnNlcnQgU1ZHXHJcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0U3ZnKGVsLCBmaW5hbFN2Z0NvbnRlbnQsIHN2Z1BhdGgsIHJhY2tTZXQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFcnJvcihlbCwgYEVycm9yIHBhcnNpbmcgUmFja01MIFhNTDogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHByb2Nlc3NSYWNrVGV4dChzb3VyY2U6IHN0cmluZywgZWw6IEhUTUxFbGVtZW50LCBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBVc2UgdGhlIGxpYnJhcnkgdG8gcGFyc2UgYW5kIGdlbmVyYXRlIFNWR1xyXG4gICAgICAgICAgICBjb25zdCByYWNrVml6ID0gbmV3IFJhY2tWaXN1YWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHN2Z0NvbnRlbnQgPSByYWNrVml6LnBhcnNlVGV4dE1hcmt1cEFuZEdlbmVyYXRlU3ZnKHNvdXJjZS50cmltKCkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gV2UgbmVlZCB0byBwYXJzZSBhZ2FpbiB0byBnZXQgdGhlIFJhY2tTZXQgZm9yIE9ic2lkaWFuLXNwZWNpZmljIHByb2Nlc3NpbmdcclxuICAgICAgICAgICAgY29uc3QgcGFyc2VyID0gbmV3IFRleHRNYXJrdXBQYXJzZXIoc291cmNlLnRyaW0oKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJhY2tTZXQgPSBwYXJzZXIucGFyc2UoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIENvbnZlcnQgT2JzaWRpYW4gbGlua3MgaW4gZGV2aWNlIGhyZWZzXHJcbiAgICAgICAgICAgIHRoaXMuY29udmVydE9ic2lkaWFuTGlua3MocmFja1NldCwgY3R4KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFJlZ2VuZXJhdGUgU1ZHIHdpdGggY29udmVydGVkIGxpbmtzXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbmFsU3ZnQ29udGVudCA9IHJhY2tWaXouZ2VuZXJhdGVTdmcocmFja1NldCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBTYXZlIFNWRyB0byBhc3NldHMgZm9sZGVyIGFuZCBnZXQgdGhlIHBhdGhcclxuICAgICAgICAgICAgY29uc3Qgc3ZnUGF0aCA9IGF3YWl0IHRoaXMuc2F2ZVN2Z1RvQXNzZXRzKGZpbmFsU3ZnQ29udGVudCwgcmFja1NldCwgY3R4KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb250YWluZXIgYW5kIGluc2VydCBTVkdcclxuICAgICAgICAgICAgdGhpcy5pbnNlcnRTdmcoZWwsIGZpbmFsU3ZnQ29udGVudCwgc3ZnUGF0aCwgcmFja1NldCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKGVsLCBgRXJyb3IgcGFyc2luZyByYWNrIHRleHQgbWFya3VwOiAke2Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29udmVydE9ic2lkaWFuTGlua3MocmFja1NldDogUmFja1NldCwgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KSB7XHJcbiAgICAgICAgLy8gQ29udmVydCBPYnNpZGlhbi1zdHlsZSBsaW5rcyBbW05vdGUgTmFtZV1dIHRvIHByb3BlciBsaW5rc1xyXG4gICAgICAgIGZvciAoY29uc3QgcmFjayBvZiByYWNrU2V0LnJhY2tzKSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgZGV2aWNlIG9mIHJhY2suZGV2aWNlcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRldmljZS5ocmVmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGV2aWNlLmhyZWYgPSB0aGlzLnJlc29sdmVPYnNpZGlhbkxpbmsoZGV2aWNlLmhyZWYsIGN0eCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEFsc28gY2hlY2sgZm9yIE9ic2lkaWFuIGxpbmtzIGluIGRldmljZSBuYW1lc1xyXG4gICAgICAgICAgICAgICAgaWYgKGRldmljZS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGlua01hdGNoID0gZGV2aWNlLm5hbWUubWF0Y2goL1xcW1xcWyhbXlxcXV0rKVxcXVxcXS8pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5rTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGlua1RleHQgPSBsaW5rTWF0Y2hbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkTGluayA9IHRoaXMucmVzb2x2ZU9ic2lkaWFuTGluayhsaW5rVGV4dCwgY3R4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlLm5hbWUgPSBkZXZpY2UubmFtZS5yZXBsYWNlKGxpbmtNYXRjaFswXSwgbGlua1RleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2UuaHJlZiA9IHJlc29sdmVkTGluaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNvbHZlT2JzaWRpYW5MaW5rKGxpbms6IHN0cmluZywgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KTogc3RyaW5nIHtcclxuICAgICAgICAvLyBIYW5kbGUgT2JzaWRpYW4gaW50ZXJuYWwgbGlua3NcclxuICAgICAgICBpZiAobGluay5zdGFydHNXaXRoKCdbWycpICYmIGxpbmsuZW5kc1dpdGgoJ11dJykpIHtcclxuICAgICAgICAgICAgLy8gRXh0cmFjdCB0aGUgbm90ZSBuYW1lXHJcbiAgICAgICAgICAgIGNvbnN0IG5vdGVOYW1lID0gbGluay5zbGljZSgyLCAtMik7XHJcbiAgICAgICAgICAgIHJldHVybiBgb2JzaWRpYW46Ly9vcGVuP3ZhdWx0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuYXBwLnZhdWx0LmdldE5hbWUoKSl9JmZpbGU9JHtlbmNvZGVVUklDb21wb25lbnQobm90ZU5hbWUpfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEhhbmRsZSByZWd1bGFyIE9ic2lkaWFuIGxpbmtzIHdpdGhvdXQgYnJhY2tldHNcclxuICAgICAgICBpZiAoIWxpbmsuc3RhcnRzV2l0aCgnaHR0cDovLycpICYmICFsaW5rLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykgJiYgIWxpbmsuc3RhcnRzV2l0aCgnb2JzaWRpYW46Ly8nKSkge1xyXG4gICAgICAgICAgICAvLyBBc3N1bWUgaXQncyBhbiBpbnRlcm5hbCBub3RlIHJlZmVyZW5jZVxyXG4gICAgICAgICAgICByZXR1cm4gYG9ic2lkaWFuOi8vb3Blbj92YXVsdD0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLmFwcC52YXVsdC5nZXROYW1lKCkpfSZmaWxlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGxpbmspfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBsaW5rO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW5zZXJ0U3ZnKGVsOiBIVE1MRWxlbWVudCwgc3ZnQ29udGVudDogc3RyaW5nLCBzdmdQYXRoPzogc3RyaW5nLCByYWNrU2V0PzogUmFja1NldCkge1xyXG4gICAgICAgIC8vIENsZWFyIHRoZSBlbGVtZW50XHJcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ3JlYXRlIGEgY29udGFpbmVyIGRpdlxyXG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSAncmFjay12aXN1YWxpemF0aW9uLWNvbnRhaW5lcic7XHJcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW4gPSAnMWVtIDAnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEluc2VydCB0aGUgU1ZHIGNvbnRlbnRcclxuICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gc3ZnQ29udGVudDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgc29tZSBzdHlsaW5nIHRvIG1ha2UgaXQgcmVzcG9uc2l2ZVxyXG4gICAgICAgIGNvbnN0IHN2ZyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdzdmcnKTtcclxuICAgICAgICBpZiAoc3ZnKSB7XHJcbiAgICAgICAgICAgIHN2Zy5zdHlsZS5tYXhXaWR0aCA9ICcxMDAlJztcclxuICAgICAgICAgICAgc3ZnLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIGEgc21hbGwgbm90ZSBhYm91dCB0aGUgc2F2ZWQgZmlsZSBpZiBwYXRoIGlzIGF2YWlsYWJsZVxyXG4gICAgICAgIGlmIChzdmdQYXRoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgbm90ZS5jbGFzc05hbWUgPSAncmFjay12aXN1YWxpemF0aW9uLW5vdGUnO1xyXG4gICAgICAgICAgICBub3RlLnN0eWxlLmZvbnRTaXplID0gJzAuOGVtJztcclxuICAgICAgICAgICAgbm90ZS5zdHlsZS5jb2xvciA9ICcjNjY2JztcclxuICAgICAgICAgICAgbm90ZS5zdHlsZS5tYXJnaW5Ub3AgPSAnMC41ZW0nO1xyXG4gICAgICAgICAgICBub3RlLnRleHRDb250ZW50ID0gYFNWRyBnZXNwZWljaGVydDogJHtzdmdQYXRofWA7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub3RlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEFkZCB0aXAgaWYgbm8gSUQgd2FzIHByb3ZpZGVkXHJcbiAgICAgICAgICAgIGlmIChyYWNrU2V0ICYmICghcmFja1NldC5pZCB8fCAhcmFja1NldC5pZC50cmltKCkpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHRpcC5jbGFzc05hbWUgPSAncmFjay12aXN1YWxpemF0aW9uLXRpcCc7XHJcbiAgICAgICAgICAgICAgICB0aXAuc3R5bGUuZm9udFNpemUgPSAnMC43NWVtJztcclxuICAgICAgICAgICAgICAgIHRpcC5zdHlsZS5jb2xvciA9ICcjODg4JztcclxuICAgICAgICAgICAgICAgIHRpcC5zdHlsZS5mb250U3R5bGUgPSAnaXRhbGljJztcclxuICAgICAgICAgICAgICAgIHRpcC5zdHlsZS5tYXJnaW5Ub3AgPSAnMC4yNWVtJztcclxuICAgICAgICAgICAgICAgIHRpcC50ZXh0Q29udGVudCA9IGDwn5KhIFRpcHA6IEbDvGdlbiBTaWUgJ2lkOiBtZWluLW5hbWUnIGhpbnp1IGbDvHIga29uc2lzdGVudGUgRGF0ZWluYW1lbmA7XHJcbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGlwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBlbC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvd0Vycm9yKGVsOiBIVE1MRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nKSB7XHJcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgY29uc3QgZXJyb3JEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBlcnJvckRpdi5jbGFzc05hbWUgPSAncmFjay12aXN1YWxpemF0aW9uLWVycm9yJztcclxuICAgICAgICBlcnJvckRpdi5zdHlsZS5jb2xvciA9ICdyZWQnO1xyXG4gICAgICAgIGVycm9yRGl2LnN0eWxlLmJvcmRlciA9ICcxcHggc29saWQgcmVkJztcclxuICAgICAgICBlcnJvckRpdi5zdHlsZS5wYWRkaW5nID0gJzFlbSc7XHJcbiAgICAgICAgZXJyb3JEaXYuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzRweCc7XHJcbiAgICAgICAgZXJyb3JEaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmZmU2ZTYnO1xyXG4gICAgICAgIGVycm9yRGl2LnRleHRDb250ZW50ID0gbWVzc2FnZTtcclxuICAgICAgICBlbC5hcHBlbmRDaGlsZChlcnJvckRpdik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlU3ZnVG9Bc3NldHMoc3ZnQ29udGVudDogc3RyaW5nLCByYWNrU2V0OiBSYWNrU2V0LCBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgY3VycmVudCBmaWxlIHBhdGggZnJvbSBjb250ZXh0XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRGaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuICAgICAgICAgICAgaWYgKCFjdXJyZW50RmlsZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdObyBhY3RpdmUgZmlsZSBmb3VuZCwgY2Fubm90IHNhdmUgU1ZHIHRvIGFzc2V0cyBmb2xkZXInKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIGEgbWVhbmluZ2Z1bCBmaWxlbmFtZSBiYXNlZCBvbiBjb250ZW50LCBub3QgdGltZXN0YW1wXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gdGhpcy5nZW5lcmF0ZVN2Z0ZpbGVuYW1lKHJhY2tTZXQsIGN0eCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgYXNzZXRzIGZvbGRlciBwYXRoIHJlbGF0aXZlIHRvIGN1cnJlbnQgZG9jdW1lbnRcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudERpciA9IGN1cnJlbnRGaWxlLnBhcmVudD8ucGF0aCB8fCAnJztcclxuICAgICAgICAgICAgY29uc3QgYXNzZXRzRGlyID0gY3VycmVudERpciA/IGAke2N1cnJlbnREaXJ9L2Fzc2V0c2AgOiAnYXNzZXRzJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEVuc3VyZSBhc3NldHMgZGlyZWN0b3J5IGV4aXN0c1xyXG4gICAgICAgICAgICBpZiAoIWF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZXhpc3RzKGFzc2V0c0RpcikpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIubWtkaXIoYXNzZXRzRGlyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRnVsbCBwYXRoIGZvciB0aGUgU1ZHIGZpbGVcclxuICAgICAgICAgICAgY29uc3Qgc3ZnUGF0aCA9IGAke2Fzc2V0c0Rpcn0vJHtmaWxlbmFtZX1gO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgU1ZHIGZpbGUgKHRoaXMgd2lsbCBvdmVyd3JpdGUgZXhpc3RpbmcgZmlsZSB3aXRoIHNhbWUgbmFtZSlcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci53cml0ZShzdmdQYXRoLCBzdmdDb250ZW50KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTVkcgc2F2ZWQgdG86ICR7c3ZnUGF0aH1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIHN2Z1BhdGg7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNhdmluZyBTVkcgdG8gYXNzZXRzIGZvbGRlcjonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2VuZXJhdGVTdmdGaWxlbmFtZShyYWNrU2V0OiBSYWNrU2V0LCBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRGaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuICAgICAgICBjb25zdCBkb2N1bWVudE5hbWUgPSBjdXJyZW50RmlsZSA/IGN1cnJlbnRGaWxlLmJhc2VuYW1lIDogJ2RvY3VtZW50JztcclxuICAgICAgICBcclxuICAgICAgICAvLyBDbGVhbiBkb2N1bWVudCBuYW1lIGZvciB1c2UgaW4gZmlsZW5hbWVcclxuICAgICAgICBjb25zdCBjbGVhbkRvY3VtZW50TmFtZSA9IGRvY3VtZW50TmFtZVxyXG4gICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvW15hLXowLTlcXC1fXS9nLCAnLScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC8tKy9nLCAnLScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9eLXwtJC9nLCAnJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdXNlciBwcm92aWRlZCBhbiBJRFxyXG4gICAgICAgIGlmIChyYWNrU2V0LmlkICYmIHJhY2tTZXQuaWQudHJpbSgpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuSWQgPSByYWNrU2V0LmlkLnRyaW0oKVxyXG4gICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcLV9dL2csICctJylcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8tKy9nLCAnLScpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXi18LSQvZywgJycpO1xyXG4gICAgICAgICAgICByZXR1cm4gYCR7Y2xlYW5Eb2N1bWVudE5hbWV9LSR7Y2xlYW5JZH0uc3ZnYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRmFsbGJhY2s6IFVzZSBwb3NpdGlvbi1iYXNlZCBuYW1pbmdcclxuICAgICAgICAvLyBGb3Igbm93LCB3ZSdsbCB1c2UgYSBzaW1wbGUgY291bnRlciBhcHByb2FjaFxyXG4gICAgICAgIC8vIEluIGEgbW9yZSBzb3BoaXN0aWNhdGVkIGltcGxlbWVudGF0aW9uLCB3ZSBjb3VsZCB0cmFjayB0aGUgYWN0dWFsIHBvc2l0aW9uIGluIHRoZSBkb2N1bWVudFxyXG4gICAgICAgIGxldCBiYXNlTmFtZSA9ICdyYWNrLWRpYWdyYW0nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChyYWNrU2V0LnJhY2tzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgLy8gVXNlIHRoZSBmaXJzdCByYWNrIG5hbWUgaWYgYXZhaWxhYmxlXHJcbiAgICAgICAgICAgIGNvbnN0IGZpcnN0UmFjayA9IHJhY2tTZXQucmFja3NbMF07XHJcbiAgICAgICAgICAgIGlmIChmaXJzdFJhY2submFtZSAmJiBmaXJzdFJhY2submFtZS50cmltKCkpIHtcclxuICAgICAgICAgICAgICAgIGJhc2VOYW1lID0gZmlyc3RSYWNrLm5hbWUudHJpbSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvW15hLXowLTlcXC1fXS9nLCAnLScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLy0rL2csICctJylcclxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXi18LSQvZywgJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJZiBtdWx0aXBsZSByYWNrcywgYWRkIGNvdW50XHJcbiAgICAgICAgICAgIGlmIChyYWNrU2V0LnJhY2tzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgIGJhc2VOYW1lICs9IGAtJHtyYWNrU2V0LnJhY2tzLmxlbmd0aH1yYWNrc2A7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGAke2NsZWFuRG9jdW1lbnROYW1lfS0ke2Jhc2VOYW1lfS5zdmdgO1xyXG4gICAgfVxyXG5cclxufVxyXG4iXX0=