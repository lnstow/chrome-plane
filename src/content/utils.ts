export function dateStr(): string {
    return new Date().toISOString().substring(2, 10);
}

export function relativeUrl(url: string | null | undefined, baseUrl = location.href): string {
    if (!url) return '';
    const parsed = new URL(url, baseUrl);
    return decodeURIComponent(`${parsed.pathname}${parsed.search}${parsed.hash}`);
}

export function getHref(a: HTMLAnchorElement, baseUrl = location.href): string {
    // 读取原始属性，避免 a.href 已按测试主页的地址补全。
    const href = a.getAttribute('href');
    return href === null ? '' : new URL(href, baseUrl).href;
}
