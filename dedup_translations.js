const fs = require('fs');
const path = './src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

// We will parse the file, find duplicate keys and keep the first occurrence as valid, removing subsequent occurrences.
let lines = code.split('\n');

let newLines = [];
let seenKeys = new Set();
let inLangBlock = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // reset seenKeys when entering new block
    if (line.match(/^  [a-z]{2}: \{/)) {
        inLangBlock = true;
        seenKeys.clear();
        newLines.push(line);
        continue;
    }
    
    if (inLangBlock && line.trim() === '},') {
        inLangBlock = false;
        newLines.push(line);
        continue;
    }
    
    if (inLangBlock) {
        // match 'Key': 'Value',
        let match = line.match(/^    '([^']+)':/);
        if (match) {
            let key = match[1];
            if (seenKeys.has(key)) {
                console.log("Removing duplicate:", key);
                // skip adding to newLines
                continue;
            } else {
                seenKeys.add(key);
                newLines.push(line);
            }
        } else {
            newLines.push(line);
        }
    } else {
        newLines.push(line);
    }
}

fs.writeFileSync(path, newLines.join('\n'));
