// NuRi's iframe to object tag converter (Vanilla JS)
(function () {
    'use strict';

    function convertCode() {
        const codeInput = document.getElementById('code');
        const resultArea = document.getElementById('result');
        const copyBtn = document.getElementById('btnCopy');
        if (!codeInput || !resultArea) return;

        let code = codeInput.value.replace(/\n/g, '').trim();
        let convertedCode = '';

        if (code.match(/^<iframe/i)) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(code, 'text/html');
            const iframe = doc.querySelector('iframe');

            if (iframe) {
                let width = iframe.getAttribute('width');
                if (parseInt(width, 10) > 0) {
                    width = parseInt(width, 10);
                } else {
                    width = '100%';
                }

                let height = iframe.getAttribute('height');
                if (parseInt(height, 10) > 0) {
                    height = parseInt(height, 10);
                } else {
                    height = 'auto';
                }

                let extraAttrs = '';
                for (let i = 0; i < iframe.attributes.length; i++) {
                    const attr = iframe.attributes[i];
                    if (attr.name === 'src' || attr.name === 'width' || attr.name === 'height') {
                        continue;
                    }
                    extraAttrs += ' ' + attr.name;
                    if (attr.value !== '') {
                        extraAttrs += '="' + attr.value + '"';
                    }
                }

                const iframeSrc = iframe.getAttribute('src') || '';
                const extraCode = code.replace(/<iframe[\s\S]*?<\/iframe>/i, '');

                convertedCode = '<div><object width="' + width + '" height="' + height + '" data="' + iframeSrc + '" type="text/html"' + extraAttrs + '></object></div>';
                convertedCode = convertedCode + extraCode + '<p><a href="https://nuridol.net/if_convert.html">NuRi\'s Tools - iframe 변환기</a></p>';
            }
        }

        resultArea.value = convertedCode;
        resultArea.removeAttribute('disabled');
        if (copyBtn) {
            copyBtn.disabled = !convertedCode;
        }
    }

    function copyResult() {
        const resultArea = document.getElementById('result');
        const copyBtn = document.getElementById('btnCopy');
        if (!resultArea || !resultArea.value) return;

        navigator.clipboard.writeText(resultArea.value).then(() => {
            if (copyBtn) {
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> 복사됨!';
                copyBtn.classList.remove('btn-outline-secondary');
                copyBtn.classList.add('btn-success');
                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                    copyBtn.classList.remove('btn-success');
                    copyBtn.classList.add('btn-outline-secondary');
                }, 2000);
            }
        }).catch(err => {
            console.error('Copy failed:', err);
            resultArea.select();
            document.execCommand('copy');
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const convertBtn = document.getElementById('convert');
        if (convertBtn) {
            convertBtn.addEventListener('click', convertCode);
        }

        const copyBtn = document.getElementById('btnCopy');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyResult);
        }
    });
})();
