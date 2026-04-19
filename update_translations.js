const fs = require('fs');

const path = './src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

const missingEn = {
  'Contact Us': 'Contact Us',
  'Home': 'Home',
  'Services': 'Services',
  'Awards': 'Awards',
  'Building The': 'Building The',
  'Future': 'Future',
  '99.9% Zero Incidents': '99.9% Zero Incidents',
  'Our Global Footprint': 'Our Global Footprint',
  'Setting new benchmarks in architectural intelligence and structural sustainability across the globe.': 'Setting new benchmarks in architectural intelligence and structural sustainability across the globe.',
  'Revolutionizing': 'Revolutionizing',
  'Geo-Tagging': 'Geo-Tagging',
  'Real-time site oversight with neural activity tracking.': 'Real-time site oversight with neural activity tracking.',
  'Precision mapping and structural validation.': 'Precision mapping and structural validation.',
  'Autonomous supply chain management systems.': 'Autonomous supply chain management systems.',
  'GPS precise update reporting and site tagging.': 'GPS precise update reporting and site tagging.',
  'Contact': 'Contact',
  'Legal Terms': 'Legal Terms',
  'Safety Protocols': 'Safety Protocols',
  'Privacy Policy': 'Privacy Policy',
  'Analyzing project data with AI...': 'Analyzing project data with AI...',
  '/ 100 Risk Score': '/ 100 Risk Score',
  'Predictive Analysis Active': 'Predictive Analysis Active',
  'Manage': 'Manage',
  'Overall Progress': 'Overall Progress',
  'On Track': 'On Track',
  'Secure SiteMaster Node': 'Secure SiteMaster Node',
  'Reputed Projects': 'Reputed Projects',
  'Total Ops Budget': 'Total Ops Budget'
};

const missingKn = {
  'Contact Us': 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
  'Home': 'ಮುಖಪುಟ',
  'Services': 'ಸೇವೆಗಳು',
  'Awards': 'ಪ್ರಶಸ್ತಿಗಳು',
  'Building The': 'ನಿರ್ಮಾಣ ಮಾಡುತ್ತಿದ್ದೇವೆ',
  'Future': 'ಭವಿಷ್ಯವನ್ನು',
  '99.9% Zero Incidents': '99.9% ಶೂನ್ಯ ಘಟನೆಗಳು',
  'Our Global Footprint': 'ನಮ್ಮ ಜಾಗತಿಕ ಹೆಜ್ಜೆಗುರುತು',
  'Setting new benchmarks in architectural intelligence and structural sustainability across the globe.': 'ವಾಸ್ತುಶಿಲ್ಪದ ಬುದ್ಧಿಮತ್ತೆ ಮತ್ತು ರಚನಾತ್ಮಕ ಸುಸ್ಥಿರತೆಯಲ್ಲಿ ಹೊಸ ಮಾನದಂಡಗಳನ್ನು ಸ್ಥಾಪಿಸುತ್ತಿದ್ದೇವೆ.',
  'Revolutionizing': 'ಕ್ರಾಂತಿಕಾರಿ',
  'Geo-Tagging': 'ಜಿಯೋ-ಟ್ಯಾಗಿಂಗ್',
  'Real-time site oversight with neural activity tracking.': 'ನ್ಯೂರಲ್ ಚಟುವಟಿಕೆ ಟ್ರ್ಯಾಕಿಂಗ್‌ನೊಂದಿಗೆ ನೈಜ-ಸಮಯದ ಮೇಲ್ವಿಚಾರಣೆ.',
  'Precision mapping and structural validation.': 'ನಿಖರವಾದ ಮ್ಯಾಪಿಂಗ್ ಮತ್ತು ರಚನಾತ್ಮಕ ಮೌಲ್ಯೀಕರಣ.',
  'Autonomous supply chain management systems.': 'ಸ್ವಾಯತ್ತ ಪೂರೈಕೆ ಸರಪಳಿ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆಗಳು.',
  'GPS precise update reporting and site tagging.': 'GPS ನಿಖರವಾದ ನವೀಕರಣ ವರದಿ ಮತ್ತು ಸೈಟ್ ಟ್ಯಾಗಿಂಗ್.',
  'Contact': 'ಸಂಪರ್ಕಿಸಿ',
  'Legal Terms': 'ಕಾನೂನು ನಿಯಮಗಳು',
  'Safety Protocols': 'ಸುರಕ್ಷತಾ ಪ್ರೋಟೋಕಾಲ್ಗಳು',
  'Privacy Policy': 'ಗೌಪ್ಯತೆ ನೀತಿ',
  'Analyzing project data with AI...': 'AI ಯೊಂದಿಗೆ ಯೋಜನೆಯ ಡೇಟಾವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
  '/ 100 Risk Score': '/ 100 ಅಪಾಯದ ಅಂಕ',
  'Predictive Analysis Active': 'ಮುನ್ಸೂಚಕ ವಿಶ್ಲೇಷಣೆ ಸಕ್ರಿಯವಾಗಿದೆ',
  'Manage': 'ನಿರ್ವಹಿಸಿ',
  'Overall Progress': 'ಒಟ್ಟಾರೆ ಪ್ರಗತಿ',
  'On Track': 'ಸರಿಯಾದ ಹಾದಿಯಲ್ಲಿದೆ',
  'Secure SiteMaster Node': 'ಸುರಕ್ಷಿತ ಸೈಟ್‌ಮಾಸ್ಟರ್ ನೋಡ್',
  'Reputed Projects': 'ಪ್ರತಿಷ್ಠಿತ ಯೋಜನೆಗಳು',
  'Total Ops Budget': 'ಒಟ್ಟು ಕಾರ್ಯಚರಣೆ ಬಜೆಟ್'
};

const missingHi = {
  'Contact Us': 'संपर्क करें',
  'Home': 'होम',
  'Services': 'सेवाएं',
  'Awards': 'पुरस्कार',
  'Building The': 'निर्माण कर रहे हैं',
  'Future': 'भविष्य का',
  '99.9% Zero Incidents': '99.9% शून्य घटनाएं',
  'Our Global Footprint': 'हमारी वैश्विक उपस्थिति',
  'Setting new benchmarks in architectural intelligence and structural sustainability across the globe.': 'वास्तुकला की बुद्धिमत्ता और संरचनात्मक स्थिरता में नए मानक स्थापित करना।',
  'Revolutionizing': 'क्रांति लाना',
  'Geo-Tagging': 'जियो-टैगिंग',
  'Real-time site oversight with neural activity tracking.': 'तंत्रिका गतिविधि ट्रैकिंग के साथ रियल-टाइम साइट की निगरानी।',
  'Precision mapping and structural validation.': 'सटीक मैपिंग और संरचनात्मक मान्यता।',
  'Autonomous supply chain management systems.': 'स्वायत्त आपूर्ति श्रृंखला प्रबंधन प्रणाली।',
  'GPS precise update reporting and site tagging.': 'जीपीएस सटीक अद्यतन रिपोर्टिंग और साइट टैगिंग।',
  'Contact': 'संपर्क करें',
  'Legal Terms': 'कानूनी शर्तें',
  'Safety Protocols': 'सुरक्षा प्रोटोकॉल',
  'Privacy Policy': 'गोपनीयता नीति',
  'Analyzing project data with AI...': 'AI के साथ प्रोजेक्ट डेटा का विश्लेषण किया जा रहा है...',
  '/ 100 Risk Score': '/ 100 जोखिम स्कोर',
  'Predictive Analysis Active': 'भविष्य कहनेवाला विश्लेषण सक्रिय',
  'Manage': 'प्रबंधित करें',
  'Overall Progress': 'समग्र प्रगति',
  'On Track': 'सही राह पर',
  'Secure SiteMaster Node': 'सुरक्षित साइटमास्टर नोड',
  'Reputed Projects': 'प्रतिष्ठित परियोजनाएं',
  'Total Ops Budget': 'कुल संचालन बजट'
};

function insertEntries(langCode, entriesMap) {
    const langStart = code.lastIndexOf(`  ${langCode}: {`);
    if (langStart === -1) return;
    const items = Object.entries(entriesMap).map(([k, v]) => `    '${k.replace(/'/g, "\\'")}': '${v.replace(/'/g, "\\'")}',`);
    const insertStr = '\n    // Missed Keys Iteration 2\n' + items.join('\n') + '\n';
    
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
