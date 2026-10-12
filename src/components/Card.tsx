import React from 'react';
import type { CardType, CardTypeItem, CardTypeList } from '../model';

interface CardProps {
    data: CardType;
    imageSrcOverride?: string;
    onClick?: (data: CardType) => void;
    onCopy: (text: string) => void;
}

export const CardUI: React.FC<CardProps> = ({ data, imageSrcOverride, onClick, onCopy }) => {
    const displayTitle = data.title || data.key;
    const tags = data.type === 'item' ? (data as CardTypeItem).info[0]?.tag ?? [] : [];

    const copyTitle = () => {
        onCopy(displayTitle);
    };

    // 根据类型渲染图片区域
    const renderCover = () => {
        if (data.type === 'item') {
            const cover = imageSrcOverride ?? (data as CardTypeItem).cover;

            return cover ? (
                <div className="relative w-full aspect-[4/3] bg-gray-200 overflow-hidden">
                    <img src={cover} alt="cover" className="absolute inset-0 object-contain w-full h-full" />
                </div>
            ) : <div className="w-full aspect-[4/3] bg-gray-200" />;
        }

        if (data.type === 'list') {
            const listData = data as CardTypeList;
            return (
                <div className="w-full aspect-[4/3] bg-gray-100 flex gap-1 p-1 overflow-hidden">
                    {listData.previewImgs?.slice(0, 3).map((img, idx) => (
                        <div key={idx} className="flex-1 bg-gray-300 relative border border-white">
                            <img src={imageSrcOverride ?? img} alt="preview" className="object-contain w-full h-full absolute inset-0" />
                        </div>
                    ))}
                </div>
            );
        }

        return <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center text-xs text-gray-400">Default</div>;
    };

    return (
        <div
            className="flex flex-col border border-gray-700 rounded-md overflow-hidden bg-gray-800 cursor-pointer hover:border-gray-500 transition-colors shadow-sm relative"
            onClick={() => onClick?.(data)}
        >
            {renderCover()}
            <div className="p-2 border-t border-gray-700">
                <div className="min-w-0 h-22 overflow-x-hidden overflow-y-auto text-sm leading-7 break-words">
                    <span
                        role="button"
                        tabIndex={0}
                        title={`点击复制：${displayTitle}`}
                        className="font-medium text-gray-100 cursor-pointer hover:text-blue-300 hover:underline"
                        onClick={event => {
                            event.stopPropagation();
                            copyTitle();
                        }}
                        onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                copyTitle();
                            }
                        }}
                    >
                        {displayTitle}
                    </span>
                    {tags.map((tag, index) => (
                        <React.Fragment key={`${tag.url}_${index}`}>
                            {' '}
                            <button
                                type="button"
                                title={tag.label}
                                className="inline-flex min-w-0 max-w-full items-center rounded-full border border-gray-600 bg-gray-700 px-2 py-0.5 align-baseline text-xs font-normal leading-4 text-gray-300 hover:border-gray-400 hover:bg-gray-600 hover:text-white transition-colors cursor-pointer"
                                onClick={event => {
                                    event.stopPropagation();
                                    window.alert('todo');
                                }}
                            >
                                <span className="min-w-0 truncate">{tag.label}</span>
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};
