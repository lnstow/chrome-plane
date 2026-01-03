// Ensure only one extension page tab exists. Opens or focuses it on action click.
// Point to the built React page under page/dist.
const pageUrl = chrome.runtime.getURL("page/dist/index.html");

chrome.action.onClicked.addListener(async () => {
    const tabs = await chrome.tabs.query({ url: pageUrl });
    if (tabs.length > 0) {
        const tab = tabs[0];
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
    } else {
        await chrome.tabs.create({ url: pageUrl });
    }
});

// 监听来自扩展页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCRAPE_GOOGLE') {
        scrapeGoogle(sendResponse);
        return true; // 保持消息通道开启以进行异步响应
    }
});

async function scrapeGoogle(sendResponse) {
    try {
        // 1. 创建后台标签页 (active: false 不会立即跳转，但在标签栏可见)
        // 注意：为了尽量不打扰，可以创建一个未被聚焦的窗口，或者 pinned tab
        const tab = await chrome.tabs.create({
            url: "https://www.google.com",
            active: false
        });

        // 2. 监听标签页加载完成
        const listener = (tabId, changeInfo, tabInfo) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
                // 移除监听器
                chrome.tabs.onUpdated.removeListener(listener);

                // 3. 注入脚本提取数据
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: getFirstLinkData,
                })
                    .then((injectionResults) => {
                        // 4. 关闭标签页
                        chrome.tabs.remove(tab.id);

                        const result = injectionResults[0].result;
                        sendResponse({ success: true, data: result });
                    })
                    .catch((error) => {
                        // 出错也要尝试关闭标签
                        chrome.tabs.remove(tab.id);
                        sendResponse({ success: false, error: error.message });
                    });
            }
        };

        chrome.tabs.onUpdated.addListener(listener);

    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// 这个函数会被注入到目标页面执行
function getFirstLinkData() {
    const a = document.querySelector("a");
    if (a) {
        return {
            text: a.innerText,
            href: a.href,
            html: a.outerHTML
        };
    }
    return null;
}

// await(await fetch("https://www.google.com")).text()
