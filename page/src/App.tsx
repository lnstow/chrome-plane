import { useState } from 'react';
import './App.css';

// 简单的类型声明避免 TS 报错
declare const chrome: any;

interface ScrapeResult {
  text: string;
  href: string;
  html: string;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = () => {
    setLoading(true);
    setResult(null);
    setError(null);

    // 发送消息给后台
    chrome.runtime.sendMessage({ type: 'SCRAPE_GOOGLE' }, (response: any) => {
      setLoading(false);
      // 检查运行时错误（如无法连接后台）
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message || "无法连接到后台");
        return;
      }

      if (response && response.success) {
        setResult(response.data);
      } else {
        setError(response?.error || "采集失败");
      }
    });
  };

  return (
    <main className="page">
      <header className="hero">
        <p className="badge">扩展页面</p>
        <h1>Google 采集器</h1>
        <p className="lead">
          点击下方按钮，后台将静默访问 Google 并获取第一个链接。
        </p>
      </header>

      <section className="panel">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button 
            onClick={handleScrape} 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: '#646cff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {loading ? '正在后台采集...' : '开始采集 Google'}
          </button>
        </div>

        {error && (
          <div className="error" style={{ color: '#d32f2f', padding: '10px', background: '#ffebee', borderRadius: '4px', marginBottom: '10px' }}>
            <strong>出错啦:</strong> {error}
          </div>
        )}

        {result && (
          <div className="result" style={{ textAlign: 'left', background: '#f5f5f5', padding: '15px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <h3 style={{ marginTop: 0 }}>采集结果</h3>
            <div style={{ marginBottom: '8px' }}>
              <strong>链接文本:</strong> <span style={{ color: '#333' }}>{result.text || "(无文本)"}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>链接地址:</strong> <br/>
              <a href={result.href} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>{result.href}</a>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', color: '#646cff' }}>查看 HTML 源码</summary>
              <pre style={{ 
                overflowX: 'auto', 
                marginTop: '10px', 
                background: '#333', 
                color: '#fff', 
                padding: '10px', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>{result.html}</pre>
            </details>
          </div>
        )}

        <div style={{ marginTop: '30px', fontSize: '0.9em', color: '#666' }}>
          <h3>原理说明</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>扩展将在后台创建一个不激活的标签页 (<code>active: false</code>)。</li>
            <li>等待页面加载完成后，注入脚本执行 <code>document.querySelector("a")</code>。</li>
            <li>获取结果后自动关闭该标签页，用户几乎无感知。</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

export default App;
