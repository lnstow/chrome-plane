export function dateStr(): string {
    return new Date().toISOString().substring(2, 10);
}

export function relativeUrl(url: string | null | undefined): string {
    if (!url) return '';
    const parsed = new URL(url, location.href);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
