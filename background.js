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

