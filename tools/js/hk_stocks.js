// NuRi's Apple Store Pickup Checker Engine (Vanilla JS - HK)
(function (window) {
    'use strict';

    const COUNTRY = 'hk';
    const CORS_PROXY = 'https://polished-disk-d743.nuridol.workers.dev/?';
    const APPLE_STORE_URL = `https://www.apple.com/${COUNTRY}/shop/retail/pickup-message?pl=true&searchNearby=true&store=`;
    const STORE_SEEDS = ['R499', 'R409']; // Causeway Bay, ifc mall

    function getBuyUrl() {
        const hash = (window.location.hash || '').replace(/^#/, '').toLowerCase() || 'iphone18pro';
        const typeMap = {
            'iphone18pro': 'shop/buy-iphone/iphone-18-pro',
            'iphoneduo': 'shop/buy-iphone/iphone-duo',
            'iphone17': 'shop/buy-iphone/iphone-17',
            'iphoneair': 'shop/buy-iphone/iphone-air',
            'mac': 'shop/buy-mac/macbook-air',
            'ipad': 'ipad/'
        };
        const path = typeMap[hash] || 'shop/buy-iphone/iphone-18-pro';
        return `https://www.apple.com/${COUNTRY}/${path}`;
    }

    function updatePickupLink() {
        const pickupLink = document.getElementById('pickupLink');
        if (pickupLink) {
            pickupLink.href = getBuyUrl();
        }
    }

    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    let isDebugMode = isLocal && (new URLSearchParams(window.location.search).get('debug') !== 'false');

    let shopList = {};
    let watchTimer = null;
    let isWatching = false;
    let audioElement = null;

    function initAudio() {
        if (!audioElement) {
            audioElement = new Audio('sound.mp3');
        }
        return audioElement;
    }

    function playAlertSound() {
        try {
            const audio = initAudio();
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn('Audio playback was blocked by browser policy:', err);
                });
            }
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    function getModelListUrl() {
        const modelList = window.MODEL_LIST || {};
        let query = '';
        let i = 0;
        for (const key of Object.keys(modelList)) {
            query += `&parts.${i}=${encodeURIComponent(key)}`;
            i++;
        }
        return query;
    }

    async function fetchPickupData(storeCode) {
        const partsQuery = getModelListUrl();
        if (!partsQuery) {
            return { body: { stores: [] } };
        }
        const fullUrl = `${CORS_PROXY}${APPLE_STORE_URL}${storeCode}${partsQuery}`;
        const response = await fetch(fullUrl, {
            method: 'GET',
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} from ${storeCode}`);
        }
        return await response.json();
    }

    function aggregateData(data) {
        const stockData = { stores: {} };
        if (!data || !data.body || !Array.isArray(data.body.stores)) {
            return stockData;
        }

        for (const store of data.body.stores) {
            const storeCode = store.storeNumber;
            const storeName = store.storeName;
            shopList[storeCode] = storeName;

            if (!stockData.stores[storeCode]) {
                stockData.stores[storeCode] = {};
            }

            const parts = store.partsAvailability || {};
            for (const modelId of Object.keys(parts)) {
                const isAvailable = parts[modelId]?.pickupDisplay === 'available';
                stockData.stores[storeCode][modelId] = {
                    availability: {
                        contract: isAvailable ? 'true' : 'false',
                        unlocked: isAvailable ? 'true' : 'false'
                    }
                };
            }
        }
        return stockData;
    }

    function formatTimestamp(date) {
        const pad = (n) => String(n).padStart(2, '0');
        const y = date.getFullYear();
        const m = pad(date.getMonth() + 1);
        const d = pad(date.getDate());
        const hh = pad(date.getHours());
        const mm = pad(date.getMinutes());
        const ss = pad(date.getSeconds());
        return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
    }

    function clearTable() {
        const table = document.getElementById('table');
        if (table) {
            const thead = table.querySelector('thead');
            const tbody = table.querySelector('tbody');
            if (thead) thead.innerHTML = '';
            if (tbody) tbody.innerHTML = '';
        }
    }

    function getWatchItems() {
        const raw = document.getElementById('watchData')?.value || '';
        return raw.split(',').map(s => s.trim()).filter(Boolean);
    }

    function setWatchItems(items) {
        const input = document.getElementById('watchData');
        if (input) {
            input.value = items.join(',');
        }
    }

    function removeWatch(id) {
        const items = getWatchItems().filter(item => item !== id);
        setWatchItems(items);
        drawWatchList();
        updateCellWatchStatus();
    }

    function toggleWatch(shopCode, modelCode) {
        const internalModel = modelCode.replace('/', '_');
        const id = `${shopCode}-${internalModel}`;
        const items = getWatchItems();
        const exists = items.includes(id);

        if (exists) {
            removeWatch(id);
        } else {
            items.push(id);
            setWatchItems(items);
            drawWatchList();
            updateCellWatchStatus();
        }
    }

    function updateCellWatchStatus() {
        const items = getWatchItems();
        const cells = document.querySelectorAll('#table tbody td');
        cells.forEach(td => {
            const cellShop = td.getAttribute('data-shopcode');
            const cellModel = td.getAttribute('data-modelcode')?.replace('/', '_');
            const cellId = `${cellShop}-${cellModel}`;
            if (items.includes(cellId)) {
                td.classList.add('watched');
            } else {
                td.classList.remove('watched');
            }
        });
    }

    function drawWatchList() {
        const container = document.getElementById('watchList');
        if (!container) return;

        container.innerHTML = '';
        const items = getWatchItems();
        const modelList = window.MODEL_LIST || {};

        items.forEach(item => {
            const parts = item.split('-');
            const shopCode = parts[0];
            const modelCode = (parts[1] || '').replace('_', '/');
            const shopName = shopList[shopCode] || shopCode;
            const modelName = modelList[modelCode] || modelCode;

            const badge = document.createElement('span');
            badge.className = 'badge bg-primary badge-clickable py-2 px-2';
            badge.innerHTML = `${shopName} ${modelName} <i class="bi bi-x-circle ms-1"></i>`;
            badge.title = 'Click to remove from watch list';
            badge.addEventListener('click', () => removeWatch(item));
            container.appendChild(badge);
        });

        toggleWatchControls(items.length > 0);
    }

    function toggleWatchControls(hasItems) {
        const controls = document.getElementById('watchControls');
        if (!controls) return;

        if (hasItems) {
            if (!document.getElementById('watchButton')) {
                controls.innerHTML = `
                    <div class="form-check form-check-inline mb-0 d-inline-flex align-items-center gap-1" style="font-size: 0.72rem;">
                        <input class="form-check-input my-0" type="checkbox" id="audiocheck" checked>
                        <label class="form-check-label text-secondary" for="audiocheck"><i class="bi bi-volume-up"></i> Audio Alert</label>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm py-0 px-2 fw-semibold" id="watchButton" style="font-size: 0.72rem;">
                        <i class="bi bi-repeat"></i> WATCH
                    </button>
                `;
                const btn = document.getElementById('watchButton');
                btn.addEventListener('click', () => {
                    if (!isWatching) {
                        startWatch();
                    } else {
                        stopWatch();
                    }
                });
            }
        } else {
            stopWatch();
            controls.innerHTML = '';
        }
    }

    function startWatch() {
        isWatching = true;
        const btn = document.getElementById('watchButton');
        if (btn) {
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-success');
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" style="width:0.65rem;height:0.65rem;" role="status"></span> Watching';
        }
        initAudio();
        runWatchLoop();
    }

    function stopWatch() {
        isWatching = false;
        if (watchTimer) {
            clearTimeout(watchTimer);
            watchTimer = null;
        }
        const btn = document.getElementById('watchButton');
        if (btn) {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-danger');
            btn.innerHTML = '<i class="bi bi-repeat"></i> WATCH';
        }
    }

    function runWatchLoop() {
        if (!isWatching) return;
        getStoreData().finally(() => {
            if (isWatching) {
                watchTimer = setTimeout(runWatchLoop, 15000);
            }
        });
    }

    function checkStockData(data) {
        if (!isWatching) return;

        const timeText = document.getElementById('time')?.textContent || '';
        const lastCheck = document.getElementById('lastCheck');
        if (lastCheck && lastCheck.value === timeText) {
            return;
        }
        if (lastCheck) {
            lastCheck.value = timeText;
        }

        const items = getWatchItems();
        const modelList = window.MODEL_LIST || {};
        let foundFlag = false;

        items.forEach(item => {
            const parts = item.split('-');
            const shopCode = parts[0];
            const modelCode = (parts[1] || '').replace('_', '/');

            const store = data.stores?.[shopCode];
            const info = store?.[modelCode] || store?.[modelCode.replace('/', '_')];
            if (info && (info.availability?.contract === 'true' || info.availability?.unlocked === 'true')) {
                const shopName = shopList[shopCode] || shopCode;
                const modelName = modelList[modelCode] || modelCode;
                const log = `[${timeText}] [${shopName} ${modelName}] In stock!\n`;
                const logArea = document.getElementById('logtext');
                if (logArea) {
                    logArea.value += log;
                    logArea.scrollTop = logArea.scrollHeight;
                }
                foundFlag = true;
            }
        });

        const audioCheck = document.getElementById('audiocheck');
        if (foundFlag && audioCheck && audioCheck.checked) {
            playAlertSound();
        }
    }

    function drawTable(data) {
        const thead = document.querySelector('#table thead');
        const tbody = document.querySelector('#table tbody');
        if (!thead || !tbody) return;

        const date = new Date(parseInt(data.updated, 10));
        const timeEl = document.getElementById('time');
        if (timeEl) {
            const debugBadge = data.isDebug ? '<span class="badge bg-danger py-0 px-1 me-1" style="font-size: 0.65rem;">MOCK DEBUG</span>' : '';
            timeEl.innerHTML = `${debugBadge}<span>Last updated: ${formatTimestamp(date)}</span>`;
        }

        const modelList = window.MODEL_LIST || {};
        const shopCodes = Object.keys(shopList);

        // Header
        let headHtml = '<tr><th class="model-header">Type / Model</th>';
        shopCodes.forEach(code => {
            headHtml += `<th class="shop-column" data-shopcode="${code}">${shopList[code]}</th>`;
        });
        headHtml += '</tr>';
        thead.innerHTML = headHtml;

        // Body rows
        const items = getWatchItems();
        let bodyHtml = '';

        updatePickupLink();
        const buyUrl = getBuyUrl();

        for (const modelCode of Object.keys(modelList)) {
            const internalModel = modelCode.replace('/', '_');
            bodyHtml += `<tr><th class="model-name" data-modelcode="${modelCode}"><a href="${buyUrl}" target="_blank" rel="noopener" class="text-reset text-decoration-none" title="Visit Apple Store">${modelList[modelCode]}</a></th>`;

            shopCodes.forEach(code => {
                const store = data.stores?.[code] || {};
                const check = store[modelCode] || store[internalModel];
                const isAvailable = check && (check.availability?.contract === 'true' || check.availability?.unlocked === 'true');
                const cellId = `${code}-${internalModel}`;
                const isWatched = items.includes(cellId);

                const statusClass = isAvailable ? 'in-stock' : 'out-of-stock';
                const icon = isAvailable ? '<i class="bi bi-check-circle-fill"></i>' : '<i class="bi bi-dash"></i>';
                const watchedClass = isWatched ? ' watched' : '';

                bodyHtml += `<td class="shop-column ${statusClass}${watchedClass}" data-shopcode="${code}" data-modelcode="${modelCode}">${icon}</td>`;
            });

            bodyHtml += '</tr>';
        }
        tbody.innerHTML = bodyHtml;

        // Event listeners for td cells
        tbody.querySelectorAll('td').forEach(td => {
            td.addEventListener('click', function () {
                const shop = this.getAttribute('data-shopcode');
                const model = this.getAttribute('data-modelcode');
                toggleWatch(shop, model);
            });
        });
    }

    async function fetchMockData() {
        const response = await fetch('test_data/mock_stock_hk.json?_t=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load mock file (test_data/mock_stock_hk.json). (HTTP ${response.status})`);
        }
        return await response.json();
    }

    async function getStoreData() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.remove('d-none');

        const stockData = {
            updated: Date.now(),
            stores: {},
            isDebug: false
        };

        try {
            if (isDebugMode) {
                // Load local mock JSON
                const mockRes = await fetchMockData();
                const agg = aggregateData(mockRes);
                Object.assign(stockData.stores, agg.stores);
                stockData.isDebug = true;
            } else {
                // Live fetch
                const results = await Promise.all(
                    STORE_SEEDS.map(code => fetchPickupData(code).catch(err => {
                        console.warn(`Fetch error for store seed ${code}:`, err);
                        return null;
                    }))
                );

                results.forEach(res => {
                    if (res) {
                        const agg = aggregateData(res);
                        Object.assign(stockData.stores, agg.stores);
                    }
                });

                // Fallback to mock on local server if live API fails
                if (Object.keys(stockData.stores).length === 0) {
                    if (isLocal) {
                        console.warn('Live API failed. Automatically falling back to test_data/mock_stock_hk.json (Local debug)');
                        const mockRes = await fetchMockData();
                        const agg = aggregateData(mockRes);
                        Object.assign(stockData.stores, agg.stores);
                        stockData.isDebug = true;
                    } else {
                        throw new Error('Failed to retrieve stock data. Please try again later.');
                    }
                }
            }

            drawWatchList();
            clearTable();
            drawTable(stockData);
            checkStockData(stockData);
        } catch (e) {
            console.error('getStoreData error:', e);
            const timeEl = document.getElementById('time');
            if (timeEl) {
                timeEl.textContent = `Error: ${e.message}`;
            }
        } finally {
            if (spinner) spinner.classList.add('d-none');
            updateDebugButton();
        }
    }

    // Exported controller
    window.stockEngine = {
        load: function () {
            const timeEl = document.getElementById('time');
            if (timeEl) timeEl.textContent = 'Loading stock data...';
            clearTable();
            return getStoreData();
        },
        refresh: function () {
            return getStoreData();
        },
        stopWatch: stopWatch
    };

    function updateDebugButton() {
        const btn = document.getElementById('btnDebugToggle');
        if (!btn) return;
        if (!isLocal) {
            btn.classList.add('d-none');
            return;
        }

        btn.classList.remove('d-none');
        if (!btn.dataset.initialized) {
            btn.dataset.initialized = 'true';
            btn.addEventListener('click', () => {
                isDebugMode = !isDebugMode;
                updateDebugButton();
                window.stockEngine.refresh();
            });
        }

        if (isDebugMode) {
            btn.className = 'btn btn-danger btn-sm py-0 px-2';
            btn.innerHTML = '<i class="bi bi-bug-fill"></i>';
            btn.title = 'Debug Mode ON (Click to switch to Live Mode)';
        } else {
            btn.className = 'btn btn-outline-secondary btn-sm py-0 px-2';
            btn.innerHTML = '<i class="bi bi-bug"></i>';
            btn.title = 'Debug Mode OFF (Click to switch to Mock Data)';
        }
    }

    // Attach base page listeners
    document.addEventListener('DOMContentLoaded', () => {
        const btnRefresh = document.getElementById('refresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', function () {
                this.blur();
                window.stockEngine.refresh();
            });
        }
        updateDebugButton();
    });

})(window);