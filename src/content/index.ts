import { parsePage } from './sites';

const topWindow = window.top;

if (topWindow && window.self !== topWindow) {
    const parsePageAndReport = () => {
        const data = parsePage();
        if (data === undefined) return;

        topWindow.postMessage({
            type: 'PLANE_DATA_RESULT',
            data,
        }, '*');
    };

    window.addEventListener('message', (event) => {
        if (!event.data) return;
        const type = event.data.type;
        console.log('iframe recv', type);

        if (type === 'PLANE_REQUEST_DATA') {
            parsePageAndReport();
        }
    });

    // 握手：页面加载后通知主框架，等待其请求解析数据。
    window.addEventListener('load', () => {
        if (document.title === 'Just a moment...' || document.title === '请稍候…') {
            topWindow.postMessage({
                type: 'PLANE_IFRAME_CLOUDFLARE',
            }, '*');
            const timer = setInterval(() => {
                if (document.title !== 'Just a moment...' && document.title !== '请稍候…') {
                    topWindow.postMessage({
                        type: 'PLANE_IFRAME_READY',
                    }, '*');
                    clearInterval(timer);
                }
            }, 1000);
            return;
        }
        topWindow.postMessage({
            type: 'PLANE_IFRAME_READY',
        }, '*');
    });
}
