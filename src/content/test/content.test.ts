/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { parsePage } from '../sites';
import list1Expected from './japaneseasmr-list1.json';
import list2Expected from './japaneseasmr-list2.json';

const cases = [
    {
        name: 'japaneseasmr-list1',
        url: 'https://japaneseasmr.com',
        expected: list1Expected,
    },
    {
        name: 'japaneseasmr-list2',
        url: 'https://japaneseasmr.com/tag/kaede-akino/page/67/',
        expected: list2Expected,
    },
];

describe('JapaneseASMR 列表解析', () => {
    for (const { name, url, expected } of cases) {
        test(`${name}：解析结果匹配预期`, async () => {
            const window = new Window({ url });
            try {
                const html = readFileSync(new URL(`./${name}.html`, import.meta.url), 'utf8');
                const doc = new window.DOMParser().parseFromString(html, 'text/html');
                const records = parsePage(doc as unknown as Document, url);

                // 忽略更新信息，其余字段及记录顺序必须完全匹配。
                const actual = records?.map((record) => {
                    const comparable: Record<string, unknown> = { ...record };
                    delete comparable.updateDate;
                    delete comparable.updateCount;
                    return comparable;
                });
                expect(actual).toStrictEqual(expected);
            } finally {
                await window.happyDOM.close();
            }
        });
    }
});
