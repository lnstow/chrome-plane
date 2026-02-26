console.log('plane ready');
if (window.self !== window.top) {
    // 注入到 iframe 内的页面，监听 img 点击后发消息给扩展主页面
    document.addEventListener('click', (e) => {
        const img = e.target.closest('img');
        if (!img) return;
        chrome.runtime.sendMessage({
            type: 'img_click',
            src: img.src,
            alt: img.alt || '',
            pageUrl: location.href
        });
    }, true);

}
