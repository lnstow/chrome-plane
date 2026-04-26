import React from 'react';
import type { CardType as CardType, CardTypeItem, CardTypeList } from '../../model';

interface CardProps {
    data: CardType;
    onClick?: (data: CardType) => void;
}

export const CardUI: React.FC<CardProps> = ({ data, onClick }) => {

    // 根据类型渲染图片区域
    const renderCover = () => {
        if (data.type === 'item') {
            const itemRoot = (data as CardTypeItem).meta[0];
            console.log(data);

            return itemRoot?.cover ? (
                <div className="w-full h-32 bg-gray-200 overflow-hidden flex items-center justify-center">
                    <img src={itemRoot.cover} alt="cover" className="object-cover w-full h-full" />
                </div>
            ) : <div className="w-full h-32 bg-gray-200" />;
        }

        if (data.type === 'list') {
            const listData = data as CardTypeList;
            return (
                <div className="w-full h-32 bg-gray-100 flex gap-1 p-1 overflow-hidden">
                    {listData.previewImgs?.slice(0, 3).map((img, idx) => (
                        <div key={idx} className="flex-1 bg-gray-300 relative border border-white">
                            <img src={img} alt="preview" className="object-cover w-full h-full absolute inset-0" />
                        </div>
                    ))}
                </div>
            );
        }

        return <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400">Default</div>;
    };

    // 渲染 Tag
    const renderTags = () => {
        if (data.type === 'item') {
            const tag = (data as CardTypeItem).meta[0]?.tag;
            const allTags = [...(tag?.actor || []), ...(tag?.other || [])];
            if (allTags.length > 0) {
                return (
                    <div className="line-clamp-1 text-xs text-gray-500 mt-1">
                        {allTags.join(' • ')}
                    </div>
                )
            }
        }
        return <div className="h-4 mt-1"></div>;
    };

    return (
        <div
            className="flex flex-col border border-gray-700 rounded-md overflow-hidden bg-gray-800 cursor-pointer hover:border-gray-500 transition-colors shadow-sm"
            onClick={() => onClick?.(data)}
        >
            {renderCover()}
            <div className="p-2 border-t border-gray-700">
                <div className="text-sm text-gray-100 font-medium line-clamp-2 leading-snug h-[2.5rem]" title={data.title}>
                    {data.title}
                </div>
                {renderTags()}
            </div>
        </div>
    );
};
