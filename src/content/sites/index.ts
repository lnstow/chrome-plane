import type { CardType } from '../../model';
import { parseJapaneseAsmr } from './japaneseasmr';
import { parsePlaceholder } from './placeholder';

// 返回 undefined 表示当前页面无需上报列表；空数组仍会上报。
type SiteParser = () => CardType[] | undefined;

const siteParsers: Partial<Record<string, SiteParser>> = {
    'japaneseasmr.com': parseJapaneseAsmr,
};

export function parsePage(): CardType[] | undefined {
    const parser = siteParsers[location.hostname] ?? parsePlaceholder;
    return parser();
}
