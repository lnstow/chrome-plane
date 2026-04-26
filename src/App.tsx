import { useEffect, useState } from 'react'
import { api } from './api'
import { type CardType } from '../model'
import { CardUI } from './components/Card'

function App() {
  const [items, setItems] = useState<CardType[]>([]);
  const [savedItems, setSavedItems] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // 默认获取某站的数据作为测试演示
    const fetchDefault = async () => {
      setLoading(true);
      setError('');
      try {
        api.init();
        const data = await api.getList('https://japaneseasmr.com');
        setItems(data);
      } catch (err: any) {
        setError(err.message || '获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchDefault();
  }, []);

  const handleSelectCard = (card: CardType) => {
    // 避免重复添加
    if (!savedItems.find(item => item.key === card.key)) {
      setSavedItems(prev => [card, ...prev]);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-200 overflow-hidden text-sm">
      {/* 左侧列表 */}
      <div className="w-1/2 flex flex-col border-r border-gray-700">
        <div className="p-3 border-b border-gray-700 font-bold tracking-wider">
          探索 (Explore)
        </div>
        <div className="flex-1 overflow-y-auto p-4 relative">
          {loading && <div className="text-gray-400 absolute inset-0 flex items-center justify-center">加载中... (正在后台打开页面解析)</div>}
          {error && <div className="text-red-400 absolute inset-0 flex items-center justify-center">错误: {error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-3 gap-4 auto-rows-max">
              {items.map(item => (
                <CardUI key={item.key} data={item} onClick={handleSelectCard} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧列表 */}
      <div className="w-1/2 flex flex-col">
        <div className="p-3 border-b border-gray-700 font-bold tracking-wider text-green-400">
          已保存至内存 ({savedItems.length})
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-4 auto-rows-max">
            {savedItems.map(item => (
              <CardUI key={`saved_${item.key}`} data={item} />
            ))}
          </div>
          {savedItems.length === 0 && (
            <div className="text-gray-500 mt-10 text-center text-sm">点击左侧卡片添加至此</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
