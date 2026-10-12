/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { parsePage } from '../sites';
import japaneseasmrList1Html from './japaneseasmr-list1.html' with { type: 'text' };
import japaneseasmrList1Expected from './japaneseasmr-list1.json';

const cases = [
    {
        url: 'https://japaneseasmr.com',
        html: japaneseasmrList1Html,
        expected: japaneseasmrList1Expected,
    },
];

describe('JapaneseASMR 列表解析', () => {
    for (const { url, html, expected } of cases) {
        test(url, async () => {
            const window = new Window({ url });
            try {
                const doc = new window.DOMParser().parseFromString(html as unknown as string, 'text/html');
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
