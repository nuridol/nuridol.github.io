// NuRi's YouTube iframe to embed/object tag converter (Vanilla JS)
(function () {
    'use strict';

    function convertYoutubeCode() {
        const codeInput = document.getElementById('code');
        const resultArea = document.getElementById('result');
        const copyBtn = document.getElementById('btnCopy');
        if (!codeInput || !resultArea) return;

        let code = codeInput.value.trim();
        let convertedCode = '';

        if (code.match(/^<iframe/i) && (code.includes('youtube.com') || code.includes('youtube-nocookie.com'))) {
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

                let fullScreen = 'false';
                if (code.includes('allowfullscreen')) {
                    fullScreen = 'true';
                }

                let videoSrc = (iframe.getAttribute('src') || '')
                    .replace('www.youtube.com/embed', 'www.youtube.com/v')
                    .replace('www.youtube-nocookie.com/embed', 'www.youtube-nocookie.com/v');

                if (videoSrc.includes('?')) {
                    videoSrc = videoSrc + '&version=3';
                } else {
                    videoSrc = videoSrc + '?version=3';
                }

                const convertedVideoCode = '<div><object width="' + width + '" height="' + height + '"><param name="movie" value="' + videoSrc + '"></param><param name="allowFullScreen" value="' + fullScreen + '"></param><param name="allowscriptaccess" value="always"></param><embed src="' + videoSrc + '" type="application/x-shockwave-flash" width="' + width + '" height="' + height + '" allowscriptaccess="always" allowfullscreen="' + fullScreen + '"></embed></object></div>';

                convertedCode = convertedVideoCode + '<p><a href="https://nuridol.net/ut_convert.html">NuRi\'s Tools - YouTube 변환기</a></p>';
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
            convertBtn.addEventListener('click', convertYoutubeCode);
        }

        const copyBtn = document.getElementById('btnCopy');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyResult);
        }
    });
})();
