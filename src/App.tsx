import { useEffect, useState, forwardRef, useCallback, useRef, type ComponentPropsWithoutRef } from 'react'
import { api } from './api'
import { cardTypeIsItem, type CardType } from './model'
import { CardUI } from './components/Card'
import { IframeViewer } from './components/IframeViewer'
import { VirtuosoGrid } from 'react-virtuoso'

const GridContainer = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(({ style, children, ...props }, ref) => {
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

interface TabInfo {
  id: string;
  title: string;
  url: string;
  closable: boolean;
}

function App() {
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: 'japaneseasmr', title: 'JapaneseASMR', url: 'https://japaneseasmr.com', closable: false }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('japaneseasmr');
  const [items, setItems] = useState<CardType[]>([]);
  const [savedItems, setSavedItems] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [exploreGridKey, setExploreGridKey] = useState(0);
  const [viewers, setViewers] = useState<{ url: string, order: number, show: boolean, key: string }[]>([]);
  const [ruleset2Enabled, setRuleset2Enabled] = useState(false);
  const viewerOrderCounter = useRef(0);
  const currentRequestId = useRef(0);
  const testImageUrl = ruleset2Enabled && typeof chrome !== 'undefined'
    ? chrome.runtime.getURL('test.jpg')
    : undefined;
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const fetchPageData = useCallback(async (targetPage: number, append: boolean = false, tabOverride?: TabInfo) => {
    const targetTab = tabOverride || activeTab;
    if (!targetTab) return;

    const requestId = ++currentRequestId.current;

    if (append) {
      setLoadingMore(true);
      setLoading(false); // 清除可能卡住的全局 loading 状态
    } else {
      setItems([]);
      setPage(targetPage);
      setLoading(true);
      setLoadingMore(false); // 清除可能卡住的 loadingMore 状态
    }
    setError('');

    try {
      let baseUrl = targetTab.url;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      const url = targetPage === 1
        ? targetTab.url
        : `${baseUrl}/page/${targetPage}/`;
      
      const data = await api.getList(url);

      if (requestId !== currentRequestId.current) return;

      setItems(prev => append ? [...prev, ...data] : data);
      setPage(targetPage);
      if (!append) setExploreGridKey(prev => prev + 1);
    } catch (err: unknown) {
      if (requestId !== currentRequestId.current) return;
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      if (requestId === currentRequestId.current) {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    api.init();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const readRulesetState = async () => {
      if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest?.getEnabledRulesets) return;

      try {
        const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
        if (!cancelled) setRuleset2Enabled(enabledRulesets.includes('ruleset_2'));
      } catch (error) {
        console.error('读取 ruleset_2 状态失败:', error);
      }
    };

    void readRulesetState();
    window.addEventListener('focus', readRulesetState);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', readRulesetState);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) return fetchPageData(1, false, activeTab);
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, fetchPageData]);

  const handleCloseTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      setActiveTabId(currentActive => {
        if (currentActive === id && next.length > 0) {
          return next[next.length - 1].id;
        }
        return currentActive;
      });
      return next;
    });
  }, []);

  const handleAddTab = useCallback(() => {
    const url = prompt('请输入网站链接 (URL):', 'https://');
    if (!url) return;
    const title = prompt('请输入标签标题:', 'New Tab');
    if (!title) return;

    const newTab: TabInfo = {
      id: Date.now().toString(),
      title,
      url,
      closable: true
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const handleSelectCard = useCallback((card: CardType) => {
    setSavedItems(prev => {
      if (!prev.find(item => item.key === card.key)) {
        return [card, ...prev];
      }
      return prev;
    });
  }, []);

  const handleViewCard = useCallback((card: CardType) => {
    if (cardTypeIsItem(card)) {
      const url = card.meta[0].url;
      viewerOrderCounter.current += 1;
      const currentOrder = viewerOrderCounter.current;
      setViewers(prev => {
        const existing = prev.find(v => v.url === url);
        if (existing) {
          return prev.map(v => v.url === url ? { ...v, order: currentOrder, show: true } : v);
        }

        const next = [...prev];
        if (next.length >= 10) {
          let minIndex = 0;
          for (let i = 1; i < next.length; i++) {
            if (next[i].order < next[minIndex].order) minIndex = i;
          }
          next.splice(minIndex, 1);
        }
        next.push({ url, order: currentOrder, show: true, key: card.key });
        return next;
      });
    }
  }, []);

  const loadMore = useCallback(() => {
    // 即使有 error，只要用户继续滚动或重试，也允许重新触发
    if (!loading && !loadingMore && items.length > 0) {
      fetchPageData(page + 1, true);
    }
  }, [loading, loadingMore, items.length, page, fetchPageData]);

  const handleFocusIframe = useCallback((url: string) => {
    viewerOrderCounter.current += 1;
    const currentOrder = viewerOrderCounter.current;
    setViewers(prev => prev.map(v => v.url === url ? { ...v, order: currentOrder } : v));
  }, []);

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
        {/* Tab 栏 */}
        <div className="flex border-b border-gray-700 overflow-x-auto bg-gray-800 shrink-0" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center px-4 py-2 cursor-pointer border-r border-gray-700 min-w-max text-sm select-none transition-colors ${
                activeTabId === tab.id ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
              }`}
            >
              <span>{tab.title}</span>
              {tab.closable && (
                <span
                  className="ml-2 w-4 h-4 flex items-center justify-center rounded hover:bg-gray-500 text-gray-400 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                >
                  ×
                </span>
              )}
            </div>
          ))}
          <div
            onClick={handleAddTab}
            className="flex items-center justify-center px-4 py-2 cursor-pointer text-gray-400 hover:bg-gray-700/50 hover:text-white border-r border-gray-700 select-none transition-colors font-bold text-lg"
            title="添加新标签"
          >
            +
          </div>
        </div>
        <div className="flex-1 p-4 relative">
          {loading && items.length === 0 && <div className="text-gray-400 absolute inset-0 flex items-center justify-center">加载中... (正在后台打开页面解析)</div>}
          {error && items.length === 0 && <div className="text-red-400 absolute inset-0 flex items-center justify-center">错误: {error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="text-gray-500 absolute inset-0 flex items-center justify-center">暂无数据</div>
          )}

          <VirtuosoGrid
            key={exploreGridKey}
            style={{ height: '100%' }}
            data={items}
            endReached={loadMore}
            components={{
              List: GridContainer,
              Footer: () => (
                <div className="w-full col-span-3 pb-4">
                  {loadingMore && <div className="text-center text-gray-400">正在加载下一页...</div>}
                  {error && items.length > 0 && <div className="text-center text-red-400 cursor-pointer" onClick={loadMore}>加载失败，点击重试: {error}</div>}
                </div>
              )
            }}
            itemContent={(index, item) => {
              const viewer = viewers.find(v => v.key === item.key);
              return (
                <CardUI key={`${item.key}_${index}`} data={item} order={viewer?.order} imageSrcOverride={testImageUrl} onClick={handleSelectCard} />
              )
            }}
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
              itemContent={(index, item) => {
                const viewer = viewers.find(v => v.key === item.key);
                return (
                  <CardUI key={`${item.key}_${index}`} data={item} order={viewer?.order} imageSrcOverride={testImageUrl} onClick={handleViewCard} />
                )
              }}
            />
          )}
        </div>
      </div>

      {viewers.map((v) => (
        <IframeViewer
          key={v.url}
          url={v.url}
          index={v.order}
          show={v.show}
          onFocus={() => handleFocusIframe(v.url)}
          onClose={() => setViewers(prev => prev.map(u => u.url === v.url ? { ...u, show: false } : u))}
        />
      ))}
    </div>
  )
}

export default App
