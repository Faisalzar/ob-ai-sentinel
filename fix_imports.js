
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'components', 'ui');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Replace @/components/ui/ with ./ (since files are in same dir)
    newContent = newContent.replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, 'from "./$1"');

    // Replace @/lib/utils with ../../lib/utils
    newContent = newContent.replace(/from\s+["']@\/lib\/utils["']/g, 'from "../../lib/utils"');

    // Replace "@/components/ui/..." with "./..." in dynamic imports or requires if any (mostly imports)
    // Also check for user dashboard file itself which is in pages/user

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated ${path.basename(filePath)}`);
    }
}

if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.jsx') || file.endsWith('.js')) {
            processFile(path.join(dir, file));
        }
    });
} else {
    console.log('Directory not found:', dir);
}
