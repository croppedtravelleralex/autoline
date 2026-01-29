const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
// Assuming html2pptx is available in the skill path or locally
// I will attempt to find the exact path of html2pptx.js
const html2pptxPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\skills\\pptx\\scripts\\html2pptx.js';
const html2pptx = require(html2pptxPath);

async function generatePPT() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Autoline 连续线智能监控系统介绍';
    pptx.author = 'Antigravity AI';

    const slidesDir = path.join(__dirname, 'slides_output');
    const templatePath = path.join(slidesDir, 'template.html');
    const template = fs.readFileSync(templatePath, 'utf8');

    const slidesData = [
        {
            type: 'title',
            title: 'Autoline: 连续线智能监控系统',
            subtitle: '工业级真空生产线全流程自动化管理专家'
        },
        {
            title: '项目背景与核心价值',
            content: [
                '针对微光夜视仪生产线（阴极 & 阳极）设计',
                '真空环境下的精密工艺挑战：',
                '- 跨腔室传输的压差控制',
                '- 长周期烘烤的温度曲线精准度',
                '- 生产全链路数据的真实性与不可篡改性'
            ]
        },
        {
            title: '线体架构: 阴极线与阳极线',
            content: [
                '<b>阳极线 (Anode)</b>: 进样 → 烘烤 → 冷却 → 清刷 → 对接 → 铟封 → 出样',
                '<b>阴极线 (Cathode)</b>: 进样 → 烘烤 → 生长 (激活) → 出样',
                '<b>物理隔离</b>: 采用高性能插板阀，确保各工序腔室的独立性与气压隔离'
            ]
        },
        {
            title: '实时监控与硬件控制',
            content: [
                '<b>工业级可视化</b>: 高对比度深色面板，拟物化设备状态显示',
                '<b>动态反馈</b>: 实时反映阀门开启、泵组转速、温度梯度及真空深浅',
                '<b>安全闭环</b>: 关键操作采用二次确认或长按设计，严防误操作'
            ]
        },
        {
            title: '智能仿真引擎',
            content: [
                '<b>后端深度驱动</b>: 实时计算各种物理参数',
                '<b>温度模拟</b>: 精确匹配烘烤升降温曲线',
                '<b>真空动力学</b>: 基于流体模型，模拟实时压力波动',
                '<b>工艺预演</b>: 无需实机运行，即可进行工艺配方的可行性分析'
            ]
        },
        {
            title: '多重安全联锁保护',
            content: [
                '<b>真空度联锁</b>: 压差不合格时物理锁定传输指令',
                '<b>冲泵保护</b>: 严禁高压差下直接开启分子泵，触发自动预警',
                '<b>操作互锁</b>: 插板阀开启状态下，关联放气阀物理锁死',
                '<b>报警分级</b>: 提供黄色警告与红色停机分级处理逻辑'
            ]
        },
        {
            title: '工艺配方管理系统',
            content: [
                '<b>审核流管控</b>: Draft (草案) → Review (审核) → Approved (批准)',
                '<b>权限隔离</b>: 仅批准后的配方允许载入生产流水线',
                '<b>版本追溯</b>: 全过程版本控制，详细参数变更比对'
            ]
        },
        {
            title: '生产数据全链路追溯',
            content: [
                '<b>一管一档 (EBR)</b>: 为每个产品生成独立的电子批记录',
                '<b>高频采集</b>: 关键工序采样率 &ge; 1Hz',
                '<b>数据安全</b>: 原始数据加密存储，符合 FDA 21 CFR Part 11 合规',
                '<b>统计分析</b>: 自动生成温度/真空历史趋势图表'
            ]
        },
        {
            title: '系统性能指标',
            content: [
                '<b>响应实时性</b>: 状态刷新延迟 < 1000ms',
                '<b>高并发支持</b>: 支持多终端并行监控',
                '<b>无缝集成</b>: 标准化 API 接口，支持与 MES/ERP 系统对接'
            ]
        },
        {
            title: '结语',
            content: [
                '提升生产良率，降低人为风险',
                '引领真空连续线智能化新纪元',
                '<b>技术支持</b>: 研发团队 24/7 在线'
            ]
        }
    ];

    for (let i = 0; i < slidesData.length; i++) {
        const data = slidesData[i];
        let contentHtml = '';
        if (data.type === 'title') {
            contentHtml = `
                <div class="title-slide">
                    <div class="hero">
                        <h1>${data.title}</h1>
                        <p>${data.subtitle}</p>
                    </div>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="header-bar">
                    <h1>${data.title}</h1>
                </div>
                <div class="content-area">
                    <div class="main-content">
                        <ul>
                            ${data.content.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        const slideHtml = template.replace('<div id="slide-container">', `<div id="slide-container">${contentHtml}`);
        const slidePath = path.join(slidesDir, `slide_${i}.html`);
        fs.writeFileSync(slidePath, slideHtml);

        console.log(`Generating slide ${i}...`);
        await html2pptx(slidePath, pptx);
    }

    const outputPath = path.join(__dirname, 'Autoline_Software_Introduction.pptx');
    await pptx.writeFile({ fileName: outputPath });
    console.log(`PPT generated at: ${outputPath}`);
}

generatePPT().catch(err => {
    console.error('Error generating PPT:', err);
    process.exit(1);
});
