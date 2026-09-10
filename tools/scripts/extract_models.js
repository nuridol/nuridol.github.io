#!/usr/bin/env node

/**
 * Extract Apple Store iPhone part numbers and labels
 * Usage:
 *   node tools/scripts/extract_models.js --country kr --device iphone-18-pro
 *   node tools/scripts/extract_models.js --country kr --device iphone-duo --output tools/js/kr_iphoneduo.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        country: 'kr',
        device: 'iphone-18-pro',
        output: null
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--country' || args[i] === '-c') {
            options.country = args[++i];
        } else if (args[i] === '--device' || args[i] === '-d') {
            options.device = args[++i];
        } else if (args[i] === '--output' || args[i] === '-o') {
            options.output = args[++i];
        }
    }
    return options;
}

function getStoreUrl(country, device) {
    const countryPaths = {
        kr: 'kr',
        jp: 'jp',
        hk: 'hk',
        'hk-zh': 'hk-zh',
        us: ''
    };

    const cPath = countryPaths[country.toLowerCase()] !== undefined ? countryPaths[country.toLowerCase()] : country;
    const prefix = cPath ? `/${cPath}` : '';
    return `https://www.apple.com${prefix}/shop/buy-iphone/${device}`;
}

function normalizeLabel(productName) {
    let clean = productName.replace(/\u00a0/g, ' ').trim();

    let typePrefix = '';
    if (/pro\s*max/i.test(clean)) {
        typePrefix = 'max ';
    } else if (/pro/i.test(clean)) {
        typePrefix = 'pro ';
    } else if (/duo/i.test(clean)) {
        typePrefix = 'duo ';
    } else if (/air/i.test(clean)) {
        typePrefix = 'air ';
    }

    const capMatch = clean.match(/(\d+\s*(?:GB|TB))/i);
    const capacity = capMatch ? capMatch[1].replace(/\s+/g, '') : '';

    let color = '';
    if (capMatch) {
        const afterCap = clean.substring(clean.indexOf(capMatch[0]) + capMatch[0].length).trim();
        color = afterCap.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    return `${typePrefix}${capacity} ${color}`.trim();
}

function fetchPageHtml(url) {
    try {
        const buffer = execSync(`curl -sL "${url}"`, {
            maxBuffer: 20 * 1024 * 1024,
            encoding: 'utf8'
        });
        return buffer;
    } catch (err) {
        throw new Error(`Failed to fetch ${url}: ${err.message}`);
    }
}

function extractProducts(html) {
    const metricsMatch = html.match(/<script\s+type="application\/json"\s+id="metrics">([\s\S]*?)<\/script>/i);
    if (!metricsMatch) {
        throw new Error('Could not find metrics script tag with JSON data.');
    }

    const data = JSON.parse(metricsMatch[1]);
    const products = data?.data?.products;
    if (!Array.isArray(products) || products.length === 0) {
        throw new Error('No products array found in JSON metrics.');
    }

    return products;
}

function parseLabelParts(label) {
    let model = 'regular';
    if (label.startsWith('pro ')) model = 'pro';
    else if (label.startsWith('max ')) model = 'max';
    else if (label.startsWith('duo ')) model = 'duo';
    else if (label.startsWith('air ')) model = 'air';

    const capMatch = label.match(/(\d+)\s*(GB|TB)/i);
    let capValue = 0;
    let capText = '';
    if (capMatch) {
        capText = capMatch[0];
        const num = parseInt(capMatch[1], 10);
        capValue = capMatch[2].toUpperCase() === 'TB' ? num * 1024 : num;
    }

    let remaining = label;
    if (model !== 'regular') {
        remaining = remaining.replace(new RegExp(`^${model}\\s*`, 'i'), '');
    }
    if (capText) {
        remaining = remaining.replace(capText, '');
    }
    const color = remaining.trim().toLowerCase();

    return { model, color, capValue };
}

function sortEntries(entries) {
    function getModelOrder(model) {
        if (model === 'pro') return 1;
        if (model === 'max') return 2;
        if (model === 'duo') return 3;
        if (model === 'air') return 4;
        return 5;
    }

    return entries.sort((a, b) => {
        const infoA = parseLabelParts(a[1]);
        const infoB = parseLabelParts(b[1]);

        // 1. 모델명 (pro 우선, max 차순)
        const mA = getModelOrder(infoA.model);
        const mB = getModelOrder(infoB.model);
        if (mA !== mB) return mA - mB;

        // 2. 용량 (GB/TB 구분: 256GB < 512GB < 1TB < 2TB)
        const capDiff = infoA.capValue - infoB.capValue;
        if (capDiff !== 0) return capDiff;

        // 3. 색상 (알파벳순)
        return infoA.color.localeCompare(infoB.color);
    });
}

function generateModelListJs(products) {
    const modelList = {};
    for (const p of products) {
        if (!p.partNumber) continue;
        modelList[p.partNumber] = normalizeLabel(p.name);
    }

    let js = '// models\nvar MODEL_LIST = {\n';
    const entries = sortEntries(Object.entries(modelList));
    entries.forEach(([part, label], index) => {
        const comma = index < entries.length - 1 ? ',' : '';
        js += `'${part}': '${label}'${comma}\n`;
    });
    js += '};\n';
    return js;
}

function main() {
    const options = parseArgs();
    const url = getStoreUrl(options.country, options.device);
    console.log(`Fetching from: ${url}`);

    const html = fetchPageHtml(url);
    const products = extractProducts(html);
    console.log(`Extracted ${products.length} products.`);

    const jsContent = generateModelListJs(products);

    let outputPath = options.output;
    if (!outputPath) {
        const normalizedDevice = options.device.replace(/-/g, '');
        outputPath = path.join(__dirname, '..', 'js', `${options.country}_${normalizedDevice}.js`);
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, jsContent, 'utf8');
    console.log(`Saved model list to: ${outputPath}`);
}

main();
