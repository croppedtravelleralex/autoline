const pptxgen = require('pptxgenjs');
const html2pptx = require('./html2pptx');
const path = require('path');

async function createPresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Antigravity AI';
    pptx.title = 'Autoline Presentation';

    // Slide files
    const slides = [
        'slide1.html',
        'slide2.html',
        'slide3.html',
        'slide4.html',
        'slide5.html',
        'slide6.html',
        'slide7.html'
    ];

    console.log('Starting presentation generation...');

    for (const slideFile of slides) {
        console.log(`Processing ${slideFile}...`);
        const slidePath = path.join(__dirname, 'slides', slideFile);

        try {
            // Create a new slide for each HTML file
            await html2pptx(slidePath, pptx);
        } catch (error) {
            console.error(`Error processing ${slideFile}:`, error);
        }
    }

    const outputPath = path.join(__dirname, 'Autoline_Presentation.pptx');
    await pptx.writeFile({ fileName: outputPath });
    console.log(`Presentation saved to: ${outputPath}`);
}

createPresentation().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
