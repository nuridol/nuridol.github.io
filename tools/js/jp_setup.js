// Setup and Tab Routing for Stock Checker (JP)
(function (window, document) {
    'use strict';

    const DEFAULT_TYPE = 'iphone18pro';
    const VALID_TYPES = ['iphone18pro', 'iphoneduo', 'iphone17', 'iphoneair', 'ipad'];

    function getCurrentType() {
        const hash = window.location.hash.replace(/^#/, '').toLowerCase();
        if (VALID_TYPES.includes(hash)) {
            return hash;
        }
        return DEFAULT_TYPE;
    }

    function updateNavTabs(activeType) {
        const navLinks = document.querySelectorAll('#options a.nav-link');
        navLinks.forEach(link => {
            const linkType = link.getAttribute('href').replace(/^#/, '');
            if (linkType === activeType) {
                link.classList.add('active');
                link.setAttribute('aria-selected', 'true');
            } else {
                link.classList.remove('active');
                link.setAttribute('aria-selected', 'false');
            }
        });
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const oldScript = document.getElementById('model_script');
            if (oldScript) {
                oldScript.remove();
            }

            const script = document.createElement('script');
            script.id = 'model_script';
            script.src = `${src}?_t=${Date.now()}`;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script ${src}`));
            document.body.appendChild(script);
        });
    }

    async function switchModel(type) {
        updateNavTabs(type);

        if (window.stockEngine && typeof window.stockEngine.stopWatch === 'function') {
            window.stockEngine.stopWatch();
        }

        const timeEl = document.getElementById('time');
        if (timeEl) timeEl.textContent = 'モデル情報を読込中...';

        try {
            await loadScript(`js/jp_${type}.js`);
            if (window.stockEngine && typeof window.stockEngine.load === 'function') {
                window.stockEngine.load();
            }
        } catch (err) {
            console.error(err);
            if (timeEl) timeEl.textContent = `エラー: モデル情報の取得に失敗しました (${type})`;
        }
    }

    function init() {
        const currentType = getCurrentType();
        if (!window.location.hash || !VALID_TYPES.includes(window.location.hash.replace(/^#/, ''))) {
            history.replaceState(null, '', `#${currentType}`);
        }

        switchModel(currentType);

        window.addEventListener('hashchange', () => {
            const newType = getCurrentType();
            switchModel(newType);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window, document);
