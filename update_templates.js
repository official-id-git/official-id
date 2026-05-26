const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/cards/CardPreview.tsx',
  'src/components/cards/templates/CardTemplates.tsx',
  'src/components/cards/templates/NewCardTemplates.tsx'
];

function processFile(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Ensure FileText is imported from lucide-react if not present
  if (!content.includes('FileText')) {
    if (content.includes("from 'lucide-react'")) {
      content = content.replace(/import \{(.*?)\} from 'lucide-react'/, (match, p1) => {
        return `import {${p1}, FileText } from 'lucide-react'`;
      });
    } else {
      // If lucide-react isn't imported at all, add it after the first import
      content = content.replace(/^(import .*?;?\n)/m, `$1import { FileText } from 'lucide-react';\n`);
    }
  }

  // Regex to find website rendering block and insert custom links after it
  // Pattern: {visibleFields.website && card.website && ( ... )}
  const websiteRegex = /(\{visibleFields\.website && card\.website && \([\s\S]*?<\/[a-zA-Z]+>\s*\)\s*\})/g;
  
  content = content.replace(websiteRegex, (match) => {
    // Extract the styling classes from the website link to mimic them
    const classMatch = match.match(/className="([^"]+)"/);
    const classes = classMatch ? classMatch[1] : 'flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-900 transition-all border border-gray-300';
    
    // Create the custom links injection block
    const customLinksBlock = `
                    {/* Custom Links */}
                    {visibleFields.custom_links !== false && (card as any).custom_links && ((card as any).custom_links.length > 0) && (
                        (card as any).custom_links.map((link: any) => (
                            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="${classes}">
                                <FileText className="w-5 h-5 shrink-0 opacity-80" />
                                <span className="break-all">{link.label}</span>
                            </a>
                        ))
                    )}
`;
    return match + customLinksBlock;
  });

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

filesToUpdate.forEach(processFile);
