const fs = require('fs');

const path = './src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

const missingEn = {
  'Documents': 'Documents',
  'View files shared by your engineer and upload your own plans or photos.': 'View files shared by your engineer and upload your own plans or photos.',
  'Upload Document': 'Upload Document',
  'From Your Engineer': 'From Your Engineer',
  'My Uploads': 'My Uploads',
  'No uploads yet. Use the button above to share plans or photos.': 'No uploads yet. Use the button above to share plans or photos.',
  'Document Name': 'Document Name',
  'e.g., Site Plan v2': 'e.g., Site Plan v2',
  'File Type': 'File Type',
  'Image / Photo': 'Image / Photo',
  'Spreadsheet': 'Spreadsheet',
  'ZIP Archive': 'ZIP Archive',
  'Select File': 'Select File',
  'Click to browse': 'Click to browse',
  'Your uploaded document will be visible to your assigned engineer and the admin team.': 'Your uploaded document will be visible to your assigned engineer and the admin team.',
  'Uploading...': 'Uploading...',
  'Upload File': 'Upload File'
};

const missingKn = {
  'Documents': 'ದಾಖಲೆಗಳು',
  'View files shared by your engineer and upload your own plans or photos.': 'ನಿಮ್ಮ ಎಂಜಿನಿಯರ್ ಹಂಚಿಕೊಂಡ ಫೈಲ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಸ್ವಂತ ಯೋಜನೆಗಳು ಅಥವಾ ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
  'Upload Document': 'ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
  'From Your Engineer': 'ನಿಮ್ಮ ಎಂಜಿನಿಯರ್‌ನಿಂದ',
  'My Uploads': 'ನನ್ನ ಅಪ್‌ಲೋಡ್‌ಗಳು',
  'No uploads yet. Use the button above to share plans or photos.': 'ಇನ್ನೂ ಯಾವುದೇ ಅಪ್‌ಲೋಡ್‌ಗಳಿಲ್ಲ. ಯೋಜನೆಗಳು ಅಥವಾ ಫೋಟೋಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಮೇಲಿನ ಬಟನ್ ಬಳಸಿ.',
  'Document Name': 'ದಾಖಲೆಯ ಹೆಸರು',
  'e.g., Site Plan v2': 'ಉದಾ: ಸೈಟ್ ಯೋಜನೆ ವಿ-2',
  'File Type': 'ಫೈಲ್ ಪ್ರಕಾರ',
  'Image / Photo': 'ಚಿತ್ರ / ಫೋಟೋ',
  'Spreadsheet': 'ಸ್ಪ್ರೆಡ್‌ಶೀಟ್',
  'ZIP Archive': 'ZIP ಆರ್ಕೈವ್',
  'Select File': 'ಫೈಲ್ ಅನ್ನು ಆಯ್ಕೆ ಮಾಡಿ',
  'Click to browse': 'ಬ್ರೌಸ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
  'Your uploaded document will be visible to your assigned engineer and the admin team.': 'ನೀವು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆ ನಿಮ್ಮ ಎಂಜಿನಿಯರ್ ಮತ್ತು ನಿರ್ವಾಹಕ ತಂಡಕ್ಕೆ ಗೋಚರಿಸುತ್ತದೆ.',
  'Uploading...': 'ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  'Upload File': 'ಫೈಲ್ ಅಪ್ಲೋಡ್ ಮಾಡಿ'
};

const missingHi = {
  'Documents': 'दस्तावेज़',
  'View files shared by your engineer and upload your own plans or photos.': 'अपने इंजीनियर द्वारा साझा की गई फ़ाइलें देखें और अपने स्वयं के चित्र या फ़ोटो अपलोड करें।',
  'Upload Document': 'दस्तावेज़ अपलोड करें',
  'From Your Engineer': 'आपके इंजीनियर से',
  'My Uploads': 'मेरे अपलोड',
  'No uploads yet. Use the button above to share plans or photos.': 'अभी तक कोई अपलोड नहीं। चित्र या फोटो साझा करने के लिए ऊपर दिए गए बटन का उपयोग करें।',
  'Document Name': 'दस्तावेज़ का नाम',
  'e.g., Site Plan v2': 'उदा., साइट प्लान v2',
  'File Type': 'फ़ाइल प्रकार',
  'Image / Photo': 'चित्र / फ़ोटो',
  'Spreadsheet': 'स्प्रेडशीट',
  'ZIP Archive': 'ज़िप संग्रह',
  'Select File': 'फ़ाइल चुनें',
  'Click to browse': 'ब्राउज़ करने के लिए क्लिक करें',
  'Your uploaded document will be visible to your assigned engineer and the admin team.': 'आपका अपलोड किया गया दस्तावेज़ आपके नियुक्त इंजीनियर और व्यवस्थापक टीम को दिखाई देगा।',
  'Uploading...': 'अपलोड किया जा रहा है...',
  'Upload File': 'फाइल अपलोड करें'
};

function insertEntries(langCode, entriesMap) {
    const langStart = code.lastIndexOf(`  ${langCode}: {`);
    if (langStart === -1) return;
    const items = Object.entries(entriesMap).map(([k, v]) => `    '${k.replace(/'/g, "\\'")}': '${v.replace(/'/g, "\\'")}',`);
    const insertStr = '\n    // Missed Keys Iteration 3\n' + items.join('\n') + '\n';
    
    // Find where the block for this language ends
    let cursor = langStart + `  ${langCode}: {`.length;
    let braceCount = 1;
    while(cursor < code.length) {
        if(code[cursor] === '{') braceCount++;
        else if(code[cursor] === '}') {
            braceCount--;
            if(braceCount === 0) {
                break;
            }
        }
        cursor++;
    }
    
    code = code.slice(0, cursor) + insertStr + code.slice(cursor);
}

insertEntries('hi', missingHi);
insertEntries('kn', missingKn);
insertEntries('en', missingEn);

fs.writeFileSync(path, code);
console.log("Done adding missed translation keys.");
