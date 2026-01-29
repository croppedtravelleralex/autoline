const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
}

const colors = {
    dark: '1A1A1D',
    emerald: '10B981',
    blue: '3B82F6',
    gray: '4B5563'
};

async function createGradient(filename, color1, color2) {
    const svg = `
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#${color1};stop-opacity:1" />
                <stop offset="100%" style="stop-color:#${color2};stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(assetsDir, filename));
    console.log(`Generated ${filename}`);
}

async function createIcon(filename, svgContent, color) {
    const svg = `
    <svg width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="#${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        ${svgContent}
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(assetsDir, filename));
    console.log(`Generated ${filename}`);
}

const icons = [
    {
        name: 'monitor.png',
        color: colors.emerald,
        svg: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>'
    },
    {
        name: 'sim.png',
        color: colors.blue,
        svg: '<path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93"></path>'
    },
    {
        name: 'mes.png',
        color: colors.emerald,
        svg: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>'
    },
    {
        name: 'data.png',
        color: colors.blue,
        svg: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path>'
    },
    {
        name: 'lock.png',
        color: 'FBBF24', // Amber
        svg: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
    },
    {
        name: 'gear.png',
        color: colors.gray,
        svg: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>'
    }
];

async function main() {
    await createGradient('bg_main.png', '0F172A', '1E293B'); // Slate 900 to Slate 800
    await createGradient('bg_title.png', '020617', '0F172A'); // Darker title

    for (const icon of icons) {
        await createIcon(icon.name, icon.svg, icon.color);
    }
}

main().catch(console.error);
