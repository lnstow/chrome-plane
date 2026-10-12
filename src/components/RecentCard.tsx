import { cardTypeIsItem, type CardType } from '../model';

interface RecentCardProps {
    data: CardType;
    imageSrcOverride?: string;
    onClick: (data: CardType) => void;
}

export function RecentCard({ data, imageSrcOverride, onClick }: RecentCardProps) {
    const isItem = cardTypeIsItem(data);
    const cover = isItem ? imageSrcOverride ?? data.cover : undefined;

    return (
        <button
            type="button"
            title={data.title || data.key}
            className="relative flex items-center justify-center w-full aspect-[4/3] overflow-hidden rounded-md border border-gray-700 bg-gray-200 p-0 text-sm text-gray-500 hover:border-gray-500 transition-colors cursor-pointer"
            onClick={() => {
                if (isItem) onClick(data);
                else window.alert('todo');
            }}
        >
            {isItem ? (
                cover ? <img src={cover} alt={data.title || data.key} className="absolute inset-0 w-full h-full object-contain" /> : '暂无封面'
            ) : 'todo'}
        </button>
    );
}
