import React, { useEffect, useState, useRef } from 'react';
import { Rnd } from 'react-rnd';

interface IframeViewerProps {
  url: string;
  index: number;
  show: boolean;
  onFocus: () => void;
  onClose: () => void;
}

export const IframeViewer: React.FC<IframeViewerProps> = ({ url, index, show, onFocus, onClose }) => {
  const SCALE = 0.75; // 在这里可以随意修改这个不规则数字
  const height = 700
  const [isInteracting, setIsInteracting] = useState(false);
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
      className="bg-gray-800 border border-gray-600 shadow-2xl rounded-md"
      style={{ position: 'fixed', display: show ? 'flex' : 'none', flexDirection: 'column', zIndex: 50 + index }}
      onMouseDownCapture={onFocus}
      onDragStart={() => setIsInteracting(true)}
      onDragStop={() => setIsInteracting(false)}
      onResizeStart={() => setIsInteracting(true)}
      onResizeStop={() => setIsInteracting(false)}
    >
      <div className="h-8 bg-gray-900 flex justify-between items-center px-6 cursor-move rnd-drag-handle border-b border-gray-700 rounded-t-md">
        <span
          className="text-gray-300 text-xs truncate max-w-[80%] cursor-pointer hover:text-white transition-colors"
          title="点击复制链接"
          onClick={() => navigator.clipboard.writeText(url)}
        >
          {url}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 relative overflow-hidden bg-gray-950 rounded-b-md">
        <iframe
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
