import { useEffect, useState, forwardRef, useCallback } from 'react'
import { api } from './api'
import { type CardType } from './model'
import { CardUI } from './components/Card'
import { VirtuosoGrid } from 'react-virtuoso'

const GridContainer = forwardRef<HTMLDivElement, any>(({ style, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...style }}
      className="grid grid-cols-3 gap-4 auto-rows-max"
    >
      {children}
    </div>
  );
});
GridContainer.displayName = 'GridContainer';

function App() {
  const [items, setItems] = useState<CardType[]>([]);
  const [savedItems, setSavedItems] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);

  const fetchPageData = async (targetPage: number, append: boolean = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const url = targetPage === 1
        ? 'https://japaneseasmr.com'
        : `https://japaneseasmr.com/page/${targetPage}/`;
      const data = await api.getList(url);
      setItems(prev => append ? [...prev, ...data] : data);
      setPage(targetPage);
    } catch (err: any) {
      setError(err.message || '获取数据失败');
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    api.init();
    fetchPageData(1);
  }, []);

  const handleSelectCard = useCallback((card: CardType) => {
    // 避免重复添加
    setSavedItems(prev => {
      if (!prev.find(item => item.key === card.key)) {
        return [card, ...prev];
      }
      return prev;
    });
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && !error && items.length > 0) {
      fetchPageData(page + 1, true);
    }
  }, [loading, loadingMore, error, items.length, page]);

  const handleJumpPage = () => {
    const input = prompt('请输入要跳转的页码:', String(page));
    if (input) {
      const target = parseInt(input, 10);
      if (!isNaN(target) && target > 0) {
        fetchPageData(target, false);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-200 overflow-hidden text-sm">
      {/* 左侧列表 */}
      <div className="w-1/2 flex flex-col border-r border-gray-700 relative">
        <div className="p-3 border-b border-gray-700 font-bold tracking-wider">
          探索 (Explore)
        </div>
        <div className="flex-1 p-4 relative">
          {loading && items.length === 0 && <div className="text-gray-400 absolute inset-0 flex items-center justify-center">加载中... (正在后台打开页面解析)</div>}
          {error && items.length === 0 && <div className="text-red-400 absolute inset-0 flex items-center justify-center">错误: {error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="text-gray-500 absolute inset-0 flex items-center justify-center">暂无数据</div>
          )}

          <VirtuosoGrid
            style={{ height: '100%' }}
            data={items}
            endReached={loadMore}
            components={{
              List: GridContainer,
              Footer: () => (
                loadingMore ? <div className="text-center py-4 text-gray-400 w-full col-span-3">正在加载下一页...</div> : null
              )
            }}
            itemContent={(index, item) => (
              <CardUI key={`${item.key}_${index}`} data={item} onClick={handleSelectCard} />
            )}
          />
        </div>

        {/* 悬浮页码按钮 */}
        <button
          onClick={handleJumpPage}
          className="absolute bottom-6 right-6 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 transition-colors z-10 font-bold cursor-pointer"
          title="跳转页码"
        >
          {page}
        </button>
      </div>

      {/* 右侧列表 */}
      <div className="w-1/2 flex flex-col">
        <div className="p-3 border-b border-gray-700 font-bold tracking-wider text-green-400">
          已保存至内存 ({savedItems.length})
        </div>
        <div className="flex-1 p-4 relative">
          {savedItems.length === 0 ? (
            <div className="text-gray-500 mt-10 text-center text-sm absolute inset-0 flex items-center justify-center">点击左侧卡片添加至此</div>
          ) : (
            <VirtuosoGrid
              style={{ height: '100%' }}
              data={savedItems}
              components={{
                List: GridContainer,
              }}
              itemContent={(index, item) => (
                <CardUI key={`saved_${item.key}_${index}`} data={item} />
              )}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
