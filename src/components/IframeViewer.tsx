import React from 'react';
import { Rnd } from 'react-rnd';

interface IframeViewerProps {
  url: string;
  onClose: () => void;
}

export const IframeViewer: React.FC<IframeViewerProps> = ({ url, onClose }) => {
  const SCALE = 0.75; // 在这里可以随意修改这个不规则数字
  const height = 700

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
      className="z-50 bg-gray-800 border border-gray-600 shadow-2xl rounded-md"
      style={{ position: 'fixed', display: 'flex', flexDirection: 'column' }}
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
      <div className="flex-1 relative overflow-hidden bg-white rounded-b-md">
        <iframe
          src={url}
          className="absolute top-0 left-0 border-none origin-top-left"
          style={{
            transform: `scale(${SCALE})`,
            width: `${(1 / SCALE) * 100}%`,
            height: `${(1 / SCALE) * 100}%`,
          }}
          sandbox="allow-scripts allow-same-origin allow-forms"
          referrerPolicy="no-referrer"
          title="viewer"
        />
      </div>
    </Rnd>
  );
};
