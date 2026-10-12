// Generated from src/content/index.ts. Do not edit directly.
(() => {

  // src/content/utils.ts
  function dateStr() {
    return new Date().toISOString().substring(2, 10);
  }
  function relativeUrl(url) {
    if (!url)
      return "";
    const parsed = new URL(url, location.href);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  // src/content/sites/japaneseasmr.ts
  function parseJapaneseAsmr() {
    if (document.querySelector(".plyr__poster") !== null) {
      document.addEventListener("click", (event) => {
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
    const list = document.querySelectorAll("div.entry-preview-wrapper.clearfix");
    list.forEach((item) => {
      let cv = [];
      let rj = "";
      item.querySelectorAll("p").forEach((p) => {
        if (p.textContent.includes("CV: ")) {
          cv = p.textContent.substring(4).split(", ").map((label) => ({ label, url: "" }));
        }
        if (p.textContent.includes("[RJ")) {
          const start = p.textContent.indexOf("[RJ");
          const end = p.textContent.indexOf("]", start);
          rj = p.textContent.substring(start + 1, end);
        }
      });
      const link = item.querySelector(".entry-title > a");
      data.push({
        key: rj,
        title: link.textContent.trim(),
        type: "item",
        updateDate: dateStr(),
        updateCount: 1,
        cover: item.querySelector("img.lazy").getAttribute("data-src"),
        info: [{
          url: link.href,
          tag: [
            ...Array.from(item.querySelectorAll(".post-meta-span.post-meta-span-category a")).map((a) => ({ label: a.textContent.trim(), url: relativeUrl(a.href) })).filter((tag) => !tag.label.includes("SFW") && !tag.label.includes("Requested")),
            ...cv
          ]
        }]
      });
    });
    return data;
  }

  // src/content/sites/placeholder.ts
  function parsePlaceholder() {
    return [
      {
        key: location.href + "_1",
        title: "Parsed Title 1 from " + location.hostname,
        type: "item",
        updateDate: dateStr(),
        updateCount: 1,
        cover: "https://via.placeholder.com/300x200?text=Cover1",
        info: [{
          url: location.href,
          tag: [
            { label: "Actor A", url: "" },
            { label: "Tag 1", url: "" }
          ]
        }]
      },
      {
        key: location.href + "_2",
        title: "Parsed Title 2 from " + location.hostname,
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
  function parsePage() {
    const parser = siteParsers[location.hostname] ?? parsePlaceholder;
    return parser();
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
