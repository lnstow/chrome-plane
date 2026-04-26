export interface CardType {
    key: string        // 唯一ID，由contentjs解析不同页面得到
    title: string
    type: 'item' | 'list' | 'default'; // 卡片类型
    updateDate: string
    updateCount: number
}

export interface CardTypeItem extends CardType {
    type: 'item'
    meta: {
        url: string        // 当前内容的链接
        cover: string      // 封面图
        tag?: {
            actor?: string[]
            other?: string[]
        }
    }[]
}

export interface CardTypeList extends CardType {
    type: 'list'
    previewImgs: string[] // 预览图数组
}