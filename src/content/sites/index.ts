import type { CardType } from '../../model';
import { parseJapaneseAsmr } from './japaneseasmr';
import { parsePlaceholder } from './placeholder';

// 返回 undefined 表示当前页面无需上报列表；空数组仍会上报。
type SiteParser = (doc: Document, pageUrl: string) => CardType[] | undefined;

const siteParsers: Partial<Record<string, SiteParser>> = {
    'japaneseasmr.com': parseJapaneseAsmr,
};

export function parsePage(doc: Document = document, pageUrl = location.href): CardType[] | undefined {
    const parser = siteParsers[new URL(pageUrl).hostname];
    return parser ? parser(doc, pageUrl) : parsePlaceholder(pageUrl);
}
