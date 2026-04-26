if (window.self !== window.top || true) {
    // 解析当前页面内容，并发送给上层 Window（我们的扩展主页）
    const parsePageAndReport = () => {
        // TODO: 根据不同站点的 DOM 结构提取并组装 Card 数据
        const fakeData = [
            {
                key: location.href + '_1',
                title: 'Parsed Title 1 from ' + location.hostname,
                type: 'item',
                updateDate: dateStr(),
                updateCount: 1,
                meta: [{
                    domain: location.hostname,
                    url: location.href,
                    cover: 'https://via.placeholder.com/300x200?text=Cover1',
                    tag: { actor: ['Actor A'], other: ['Tag 1'] }
                }]
            },
            {
                key: location.href + '_2',
                title: 'Parsed Title 2 from ' + location.hostname,
                type: 'list',
                updateDate: dateStr(),
                updateCount: 5,
                previewImgs: [
                    'https://via.placeholder.com/100x150?text=P1',
                    'https://via.placeholder.com/100x150?text=P2',
                    'https://via.placeholder.com/100x150?text=P3'
                ]
            }
        ];

        let data = fakeData;
        if (location.hostname === 'japaneseasmr.com') {
            const list = document.querySelectorAll("div.entry-preview-wrapper.clearfix");
            data = []
            list.forEach(item => {
                const pList = item.querySelectorAll("p")
                let cv = []
                let rj = ""
                pList.forEach(p => {
                    if (p.textContent.includes("CV: ")) {
                        cv = p.textContent.substring(4).split(", ")
                    }
                    if (p.textContent.includes("[RJ")) {
                        const start = p.textContent.indexOf("[RJ")
                        const end = p.textContent.indexOf("]", start)
                        rj = p.textContent.substring(start + 1, end)
                    }
                })

                data.push({
                    key: rj,
                    title: item.querySelector(".entry-title > a").textContent.trim(),
                    type: 'item',
                    updateDate: dateStr(),
                    updateCount: 1,
                    meta: [{
                        url: item.querySelector(".entry-title > a").href,
                        cover: item.querySelector("img.lazy").getAttribute("data-src"),
                        tag: {
                            actor: cv,
                            other: Array.from(item.querySelectorAll(".post-meta-span.post-meta-span-category a"))
                                .map(a => a.textContent.trim())
                                .filter(a => !a.includes("SFW") && !a.includes("Requested"))
                        }
                    }]
                })
            })
        }

        window.top.postMessage({
            type: 'PLANE_DATA_RESULT',
            data
        }, '*');
    };

    let pendingData = null; // 占位，可以作为后续如果需要多次交互的状态保存

    window.addEventListener('message', (event) => {
        if (!event.data) return;
        const type = event.data.type;
        const data = event.data.data;
        console.log("iframe recv", type)

        if (type === 'PLANE_REQUEST_DATA') {
            parsePageAndReport();
        }
    });

    // 握手：立即向主框架报告说本 script 已经准备好可以接受指令了
    window.addEventListener('load', () => {
        window.top.postMessage({
            type: 'PLANE_IFRAME_READY'
        }, '*');
    });
}

function dateStr() {
    return new Date().toISOString().substring(2, 10);
}