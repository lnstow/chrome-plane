// Generated from src/content/index.ts. Do not edit directly.
(() => {

  // src/content/utils.ts
  function dateStr() {
    return new Date().toISOString().substring(2, 10);
  }
  function relativeUrl(url, baseUrl = location.href) {
    if (!url)
      return "";
    const parsed = new URL(url, baseUrl);
    return decodeURIComponent(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  }
  function getHref(a, baseUrl = location.href) {
    const href = a.getAttribute("href");
    return href === null ? "" : new URL(href, baseUrl).href;
  }

  // src/content/sites/japaneseasmr.ts
  function parseJapaneseAsmr(doc = document, pageUrl = location.href) {
    if (doc.querySelector(".plyr__poster") !== null) {
      doc.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.matches("a")) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          console.log("拦截到了动态生成的按钮点击！");
        }
      }, true);
      return;
    }
    const data = [];
    const list = doc.querySelectorAll("div.entry-preview-wrapper.clearfix");
    list.forEach((item) => {
      let cv = [];
      let rj = "";
      item.querySelectorAll("p").forEach((p) => {
        if (p.textContent.includes("CV: ")) {
          cv = p.textContent.substring(4).split(", ").map((label) => ({ label, url: "" }));
        }
        const rjMatch = p.textContent.match(/\[(RJ\d+)\]/) ?? p.textContent.match(/RJ Code:\s*(RJ\d+)\b/);
        if (rjMatch) {
          rj = rjMatch[1];
        }
      });
      const link = item.querySelector(".entry-title > a");
      data.push({
        key: rj,
        title: "",
        type: "item",
        updateDate: dateStr(),
        updateCount: 1,
        cover: item.querySelector("img.lazy").getAttribute("data-src"),
        info: [{
          url: getHref(link, pageUrl),
          tag: [
            ...Array.from(item.querySelectorAll(".post-meta-span.post-meta-span-category a")).map((a) => ({ label: a.textContent.trim(), url: relativeUrl(getHref(a, pageUrl), pageUrl) })).filter((tag) => !tag.label.includes("SFW") && !tag.label.includes("Requested")),
            ...cv
          ]
        }]
      });
    });
    return data;
  }

  // src/content/sites/placeholder.ts
  function parsePlaceholder(pageUrl = location.href) {
    const hostname = new URL(pageUrl).hostname;
    return [
      {
        key: pageUrl + "_1",
        title: "Parsed Title 1 from " + hostname,
        type: "item",
        updateDate: dateStr(),
        updateCount: 1,
        cover: "https://via.placeholder.com/300x200?text=Cover1",
        info: [{
          url: pageUrl,
          tag: [
            { label: "Actor A", url: "" },
            { label: "Tag 1", url: "" }
          ]
        }]
      },
      {
        key: pageUrl + "_2",
        title: "Parsed Title 2 from " + hostname,
        type: "list",
        updateDate: dateStr(),
        updateCount: 5,
        previewImgs: [
          "https://via.placeholder.com/100x150?text=P1",
          "https://via.placeholder.com/100x150?text=P2",
          "https://via.placeholder.com/100x150?text=P3"
        ]
      }
    ];
  }

  // src/content/sites/index.ts
  var siteParsers = {
    "japaneseasmr.com": parseJapaneseAsmr
  };
  function parsePage(doc = document, pageUrl = location.href) {
    const parser = siteParsers[new URL(pageUrl).hostname];
    return parser ? parser(doc, pageUrl) : parsePlaceholder(pageUrl);
  }

  // src/content/index.ts
  var topWindow = window.top;
  if (topWindow && window.self !== topWindow) {
    const parsePageAndReport = () => {
      const data = parsePage();
      if (data === undefined)
        return;
      topWindow.postMessage({
        type: "PLANE_DATA_RESULT",
        data
      }, "*");
    };
    window.addEventListener("message", (event) => {
      if (!event.data)
        return;
      const type = event.data.type;
      console.log("iframe recv", type);
      if (type === "PLANE_REQUEST_DATA") {
        parsePageAndReport();
      }
    });
    window.addEventListener("load", () => {
      if (document.title === "Just a moment..." || document.title === "请稍候…") {
        topWindow.postMessage({
          type: "PLANE_IFRAME_CLOUDFLARE"
        }, "*");
        const timer = setInterval(() => {
          if (document.title !== "Just a moment..." && document.title !== "请稍候…") {
            topWindow.postMessage({
              type: "PLANE_IFRAME_READY"
            }, "*");
            clearInterval(timer);
          }
        }, 1000);
        return;
      }
      topWindow.postMessage({
        type: "PLANE_IFRAME_READY"
      }, "*");
    });
  }
})();
