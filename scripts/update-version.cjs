const fs = require('fs');
const path = require('path');

const frontendPkgPath = path.join('frontend', 'package.json');
const changelogPath = '更新日志.md';

function updateVersion(message) {
    if (!fs.existsSync(frontendPkgPath)) {
        console.error(`致命错误: 找不到 ${frontendPkgPath}`);
        return;
    }

    // 1. 读取版本号
    const pkgData = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
    const currentVersion = pkgData.version || '0.0.0';

    // 2. 增加版本号 (patch)
    const vParts = currentVersion.split('.');
    vParts[vParts.length - 1] = parseInt(vParts[vParts.length - 1], 10) + 1;
    const newVersion = vParts.join('.');

    pkgData.version = newVersion;

    // 3. 写回 package.json
    fs.writeFileSync(frontendPkgPath, JSON.stringify(pkgData, null, 2), 'utf8');

    // 4. 更新日志记录
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const logEntry = `\n## [${newVersion}] - ${now}\n- ${message}\n`;

    fs.appendFileSync(changelogPath, logEntry, 'utf8');

    console.log(`版本已更新: ${currentVersion} -> ${newVersion}`);
    console.log(`已在 ${changelogPath} 中添加更新记录。`);
}

const message = process.argv[2];
if (!message) {
    console.log('使用方法: node update-version.js "更新内容描述"');
} else {
    updateVersion(message);
}
