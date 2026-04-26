import type { CardType } from '../model';

interface RequestContext {
    clear: (data?: CardType[]) => void;
}

// 统一管理所有发出去的请求
const pendingRequests = new Map<HTMLIFrameElement, RequestContext>();

export const api = {
    init: () => {
        // 共享的全局监听器
        window.addEventListener('message', (event: MessageEvent) => {
            if (!event.data) return;
            const type = event.data.type;
            const data = event.data.data;
            console.log("host recv", type)

            // 1. 收到 iframe 中 content.js 准备就绪的握手通知
            if (type === 'PLANE_IFRAME_READY') {

                // 通过发送方 event.source 发出事件
                event.source?.postMessage({
                    type: 'PLANE_REQUEST_DATA',
                }, { targetOrigin: '*' });
                return;
            }

            // 2. 收到解析数据
            if (type === 'PLANE_DATA_RESULT') {
                for (const [iframe, ctx] of pendingRequests) {
                    if (iframe.contentWindow === event.source) {
                        ctx.clear(data);
                        break;
                    }
                }
                return;
            }
        });
    },
    /**
     * 在后台通过 iframe 加载指定的 url，获取解析后的卡片列表
     */
    getList: (url: string): Promise<CardType[]> => {
        return new Promise((resolve, reject) => {

            const iframe = document.createElement('iframe');
            // iframe.style.display = 'none';
            iframe.style.position = 'absolute';
            iframe.style.left = '0px';
            iframe.style.top = '9999px';
            iframe.style.width = "1920px";
            iframe.style.height = "1080px";
            iframe.style.scale = "0.5";
            iframe.sandbox = "allow-scripts allow-same-origin allow-forms";

            // 7秒超时处理
            let timeout: number
            const clear = (data?: CardType[]) => {
                pendingRequests.delete(iframe);
                clearTimeout(timeout);
                if (iframe.parentNode) {
                    iframe.src = "about:blank";
                    iframe.parentNode.removeChild(iframe);
                }
                if (data) resolve(data);
                else reject(new Error(`Timeout fetching data from ${url}`));
            }
            timeout = setTimeout(() => { clear(); }, 17000);

            // 加入全局请求管理池
            pendingRequests.set(iframe, {
                clear,
            });

            // 先挂载 iframe，才能拿到 contentWindow，再开始加载 url
            document.body.appendChild(iframe);
            iframe.src = url;
        });
    }
}
