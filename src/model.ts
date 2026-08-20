export interface CardType {
    key: string        // 唯一ID，由contentjs解析不同页面得到
    title: string
    type: 'item' | 'list' | 'default'; // 卡片类型
    updateDate: string
    updateCount: number
}

export interface CardTypeItem extends CardType {
    type: 'item'
    cover: string      // 封面图
    info: {
        url: string        // 当前内容的链接
        tag: {
            label: string
            url: string // tag的相对链接，完整url= info.url.origin+tag.url
        }[]
    }[]
}

export interface CardTypeList extends CardType {
    type: 'list'
    previewImgs: string[] // 预览图数组
}

export function cardTypeIsItem(card: CardType): card is CardTypeItem {
    return card.type === 'item';
}

export function cardTypeIsList(card: CardType): card is CardTypeList {
    return card.type === 'list';
}