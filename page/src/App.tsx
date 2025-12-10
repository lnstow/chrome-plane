import './App.css'

function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="badge">扩展页面</p>
        <h1>欢迎来到 React 版扩展页面</h1>
        <p className="lead">
          这里可以展示和管理扩展内的数据，比如采集记录、列表和设置。
        </p>
      </header>

      <section className="panel">
        <h2>下一步可以做什么？</h2>
        <ul>
          <li>通过 <code>chrome.runtime.sendMessage</code> 向后台请求/保存数据。</li>
          <li>把后台返回的记录渲染成列表、支持筛选和排序。</li>
          <li>按需添加按钮触发重新采集、导出或清理数据。</li>
        </ul>
      </section>
    </main>
  )
}

export default App
