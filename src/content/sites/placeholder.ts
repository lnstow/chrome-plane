import type { CardTypeItem, CardTypeList } from '../../model';
import { dateStr } from '../utils';

// TODO: 其余站点暂时保留原有占位数据，逐步添加对应的解析模块。
export function parsePlaceholder(): (CardTypeItem | CardTypeList)[] {
    return [
        {
            key: location.href + '_1',
            title: 'Parsed Title 1 from ' + location.hostname,
            type: 'item',
            updateDate: dateStr(),
            updateCount: 1,
            cover: 'https://via.placeholder.com/300x200?text=Cover1',
            info: [{
                url: location.href,
                tag: [
                    { label: 'Actor A', url: '' },
                    { label: 'Tag 1', url: '' },
                ],
            }],
        },
        {
            key: location.href + '_2',
            title: 'Parsed Title 2 from ' + location.hostname,
            type: 'list',
            updateDate: dateStr(),
            updateCount: 5,
            previewImgs: [
                'https://via.placeholder.com/100x150?text=P1',
                'https://via.placeholder.com/100x150?text=P2',
                'https://via.placeholder.com/100x150?text=P3',
            ],
        },
    ];
}
