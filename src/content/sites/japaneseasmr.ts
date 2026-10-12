import type { CardTypeItem } from '../../model';
import { dateStr, getHref, relativeUrl } from '../utils';

export function parseJapaneseAsmr(doc: Document = document, pageUrl = location.href): CardTypeItem[] | undefined {
    if (doc.querySelector('.plyr__poster') !== null) {
        // 详情页面保留原有的链接点击拦截，不上报列表数据。
        doc.addEventListener('click', (event) => {
            if (event.target instanceof Element && event.target.matches('a')) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                console.log('拦截到了动态生成的按钮点击！');
            }
        }, true);
        return;
    }

    const data: CardTypeItem[] = [];
    const list = doc.querySelectorAll('div.entry-preview-wrapper.clearfix');
    list.forEach((item) => {
        let cv: CardTypeItem['info'][number]['tag'] = [];
        let rj = '';
        item.querySelectorAll('p').forEach((p) => {
            if (p.textContent.includes('CV: ')) {
                cv = p.textContent.substring(4).split(', ').map((label) => ({ label, url: '' }));
            }
            const rjMatch = p.textContent.match(/\[(RJ\d+)\]/)
                ?? p.textContent.match(/RJ Code:\s*(RJ\d+)\b/);
            if (rjMatch) {
                rj = rjMatch[1];
            }
        });

        const link = item.querySelector<HTMLAnchorElement>('.entry-title > a')!;
        data.push({
            key: rj,
            title: '',
            type: 'item',
            updateDate: dateStr(),
            updateCount: 1,
            cover: item.querySelector('img.lazy')!.getAttribute('data-src')!,
            info: [{
                url: getHref(link, pageUrl),
                tag: [
                    ...Array.from(item.querySelectorAll<HTMLAnchorElement>('.post-meta-span.post-meta-span-category a'))
                        .map((a) => ({ label: a.textContent.trim(), url: relativeUrl(getHref(a, pageUrl), pageUrl) }))
                        .filter((tag) => !tag.label.includes('SFW') && !tag.label.includes('Requested')),
                    ...cv,
                ],
            }],
        });
    });
    return data;
}
