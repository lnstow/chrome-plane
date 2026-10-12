import type { CardTypeItem } from '../../model';
import { dateStr, relativeUrl } from '../utils';

export function parseJapaneseAsmr(): CardTypeItem[] | undefined {
    if (document.querySelector('.plyr__poster') !== null) {
        // 详情页面保留原有的链接点击拦截，不上报列表数据。
        document.addEventListener('click', (event) => {
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
    const list = document.querySelectorAll('div.entry-preview-wrapper.clearfix');
    list.forEach((item) => {
        let cv: CardTypeItem['info'][number]['tag'] = [];
        let rj = '';
        item.querySelectorAll('p').forEach((p) => {
            if (p.textContent.includes('CV: ')) {
                cv = p.textContent.substring(4).split(', ').map((label) => ({ label, url: '' }));
            }
            if (p.textContent.includes('[RJ')) {
                const start = p.textContent.indexOf('[RJ');
                const end = p.textContent.indexOf(']', start);
                rj = p.textContent.substring(start + 1, end);
            }
        });

        const link = item.querySelector<HTMLAnchorElement>('.entry-title > a')!;
        data.push({
            key: rj,
            title: link.textContent.trim(),
            type: 'item',
            updateDate: dateStr(),
            updateCount: 1,
            cover: item.querySelector('img.lazy')!.getAttribute('data-src')!,
            info: [{
                url: link.href,
                tag: [
                    ...Array.from(item.querySelectorAll<HTMLAnchorElement>('.post-meta-span.post-meta-span-category a'))
                        .map((a) => ({ label: a.textContent.trim(), url: relativeUrl(a.href) }))
                        .filter((tag) => !tag.label.includes('SFW') && !tag.label.includes('Requested')),
                    ...cv,
                ],
            }],
        });
    });
    return data;
}
