const { chromium } = require('playwright');
(async () => {
    try {
        console.log('Attempting to launch browser...');
        const browser = await chromium.launch();
        console.log('Browser launched successfully!');
        await browser.close();
    } catch (e) {
        console.error('Launch failed:', e);
    }
})();
