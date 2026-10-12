import React, { useEffect, useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { Minus, RefreshCw, Trash2, X } from 'lucide-react';

const windowButtonClassName = 'h-full w-10 shrink-0 p-0 flex items-center justify-center transition-colors cursor-pointer';

interface IframeViewerProps {
  url: string;
  index: number;
  show: boolean;
  onFocus: () => void;
  onDelete: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const IframeViewer: React.FC<IframeViewerProps> = ({ url, index, show, onFocus, onDelete, onMinimize, onClose }) => {
  const SCALE = 0.75; // 在这里可以随意修改这个不规则数字
  const height = 700
  const [isInteracting, setIsInteracting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleBlur = () => {
      setTimeout(() => {
        if (document.activeElement === iframeRef.current) {
          onFocus();
        }
      }, 0);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [onFocus]);

  return (
    <Rnd
      default={{
        x: 20,
        y: window.innerHeight - height - 20,
        width: 900,
        height: height,
      }}
      minWidth={200}
      minHeight={150}
      dragHandleClassName="rnd-drag-handle"
      cancel="button"
      className="bg-gray-800 border border-gray-600 shadow-2xl rounded-md"
      style={{ position: 'fixed', display: show ? 'flex' : 'none', flexDirection: 'column', zIndex: 50 + index }}
      onMouseDownCapture={onFocus}
      onDragStart={() => setIsInteracting(true)}
      onDragStop={() => setIsInteracting(false)}
      onResizeStart={() => setIsInteracting(true)}
      onResizeStop={() => setIsInteracting(false)}
    >
      <div className="h-9 bg-gray-900 flex justify-between items-center pl-6 cursor-move rnd-drag-handle border-b border-gray-700 rounded-t-md">
        <span
          className="min-w-0 flex-1 text-gray-300 text-xs truncate cursor-pointer hover:text-white transition-colors"
          title="点击复制链接"
          onClick={() => navigator.clipboard.writeText(url)}
        >
          {url}
        </span>
        <div className="h-full flex items-stretch shrink-0 mr-4">
          <button
            type="button"
            title="从右侧列表删除"
            onClick={onDelete}
            className={`${windowButtonClassName} text-red-400 hover:bg-red-500/20 hover:text-red-300`}
          >
            <Trash2 size={16} className="shrink-0" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="刷新窗口"
            onClick={() => setReloadKey(key => key + 1)}
            className={`${windowButtonClassName} text-gray-400 hover:bg-gray-700 hover:text-white`}
          >
            <RefreshCw size={16} className="shrink-0" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="缩小"
            onClick={onMinimize}
            className={`${windowButtonClassName} text-gray-400 hover:bg-gray-700 hover:text-white`}
          >
            <Minus size={16} className="shrink-0" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="关闭 iframe"
            onClick={onClose}
            className={`${windowButtonClassName} text-gray-400 hover:bg-red-600 hover:text-white rounded-tr-md`}
          >
            <X size={16} className="shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden bg-gray-950 rounded-b-md">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={url}
          className="absolute top-0 left-0 border-none origin-top-left"
          style={{
            transform: `scale(${SCALE})`,
            width: `${(1 / SCALE) * 100}%`,
            height: `${(1 / SCALE) * 100}%`,
            pointerEvents: isInteracting ? 'none' : 'auto',
          }}
          sandbox="allow-scripts allow-same-origin allow-forms"
          referrerPolicy="no-referrer"
          title="viewer"
        />
      </div>
    </Rnd>
  );
};
