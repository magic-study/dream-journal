import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDreamStore } from './store/useDreamStore'
import type { MoodScore } from './types'

type Page = 'timeline' | 'compose' | 'insights' | 'settings'

function scoreOptions() {
  return [1, 2, 3, 4, 5] as MoodScore[]
}

function App() {
  const {
    entries,
    draft,
    draftHistory,
    loading,
    filters,
    selectedId,
    init,
    setFilters,
    updateDraft,
    undoDraft,
    saveDraftAsEntry,
    createNewDraft,
    setSelectedId,
    removeEntry,
    editEntry,
    exportData,
    importData,
    clearAll,
  } = useDreamStore()
  const [page, setPage] = useState<Page>('timeline')
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    void init()
  }, [init])

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const queryMatched =
        !filters.query ||
        `${entry.title ?? ''} ${entry.content}`.toLowerCase().includes(filters.query.toLowerCase())
      const tagMatched = !filters.tag || entry.tags.includes(filters.tag)
      const lucidMatched = !filters.lucidOnly || entry.isLucid
      const emotionMatched = entry.emotion >= filters.emotionMin
      return queryMatched && tagMatched && lucidMatched && emotionMatched
    })
  }, [entries, filters])

  const selected = entries.find((entry) => entry.id === selectedId) ?? null
  const topTags = useMemo(() => {
    const count = new Map<string, number>()
    for (const entry of entries) {
      for (const tag of entry.tags) count.set(tag, (count.get(tag) ?? 0) + 1)
    }
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [entries])

  const trendData = useMemo(() => {
    return entries
      .slice()
      .reverse()
      .map((entry) => ({
        date: entry.dreamDate.slice(5),
        emotion: entry.emotion,
        vividness: entry.vividness,
      }))
  }, [entries])

  async function downloadBackup() {
    const payload = await exportData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `dream-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app">
      <header className="header">
        <h1>Dream Journal</h1>
        <p>记录刚醒来的画面，抓住潜意识的线索。</p>
      </header>

      {page === 'timeline' && (
        <section className="card">
          <h2>时间线</h2>
          <div className="filters">
            <input
              placeholder="搜索标题或内容"
              value={filters.query}
              onChange={(event) => setFilters({ query: event.target.value })}
            />
            <input
              placeholder="标签筛选"
              value={filters.tag}
              onChange={(event) => setFilters({ tag: event.target.value.trim() })}
            />
            <label className="row">
              <span>最低情绪</span>
              <select
                value={filters.emotionMin}
                onChange={(event) => setFilters({ emotionMin: Number(event.target.value) as MoodScore })}
              >
                {scoreOptions().map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            </label>
            <label className="row">
              <input
                type="checkbox"
                checked={filters.lucidOnly}
                onChange={(event) => setFilters({ lucidOnly: event.target.checked })}
              />
              <span>仅清醒梦</span>
            </label>
          </div>

          {loading && <p>加载中...</p>}
          {!loading && filteredEntries.length === 0 && <p>还没有符合筛选条件的梦境。</p>}
          <div className="list">
            {filteredEntries.map((entry) => (
              <article key={entry.id} className="entry" onClick={() => setSelectedId(entry.id)}>
                <div className="entry-head">
                  <h3>{entry.title || '未命名梦境'}</h3>
                  <small>{entry.dreamDate}</small>
                </div>
                <p>{entry.content.slice(0, 80)}...</p>
                <div className="tags">
                  {entry.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {page === 'compose' && (
        <section className="card">
          <h2>记录梦境</h2>
          <input
            placeholder="标题（可选）"
            value={draft.title ?? ''}
            onChange={(event) => updateDraft({ title: event.target.value })}
          />
          <textarea
            placeholder="把梦里的细节写下来..."
            rows={8}
            value={draft.content}
            onChange={(event) => updateDraft({ content: event.target.value })}
          />
          <label className="row">
            <span>梦境日期</span>
            <input
              type="date"
              value={draft.dreamDate}
              onChange={(event) => updateDraft({ dreamDate: event.target.value })}
            />
          </label>
          <label className="row">
            <span>情绪</span>
            <select
              value={draft.emotion}
              onChange={(event) => updateDraft({ emotion: Number(event.target.value) as MoodScore })}
            >
              {scoreOptions().map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </label>
          <label className="row">
            <span>清晰度</span>
            <select
              value={draft.vividness}
              onChange={(event) => updateDraft({ vividness: Number(event.target.value) as MoodScore })}
            >
              {scoreOptions().map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={draft.isLucid}
              onChange={(event) => updateDraft({ isLucid: event.target.checked })}
            />
            <span>清醒梦</span>
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={draft.isNightmare}
              onChange={(event) => updateDraft({ isNightmare: event.target.checked })}
            />
            <span>噩梦</span>
          </label>
          <div className="row">
            <span>标签</span>
            <input
              placeholder="输入后回车添加"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && tagInput.trim()) {
                  event.preventDefault()
                  if (!draft.tags.includes(tagInput.trim())) {
                    updateDraft({ tags: [...draft.tags, tagInput.trim()] })
                  }
                  setTagInput('')
                }
              }}
            />
          </div>
          <div className="tags">
            {draft.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => updateDraft({ tags: draft.tags.filter((item) => item !== tag) })}
              >
                #{tag} x
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="button" onClick={undoDraft} disabled={draftHistory.length === 0}>
              撤销上一步
            </button>
            <button
              type="button"
              onClick={async () => {
                await saveDraftAsEntry()
                setPage('timeline')
              }}
            >
              保存梦境
            </button>
            <button type="button" onClick={createNewDraft}>
              清空草稿
            </button>
          </div>
        </section>
      )}

      {page === 'insights' && (
        <section className="card">
          <h2>统计洞察</h2>
          <p>近 7 天记录数：{entries.filter((entry) => Date.now() - Date.parse(entry.createdAt) < 7 * 86400000).length}</p>
          <p>近 30 天记录数：{entries.filter((entry) => Date.now() - Date.parse(entry.createdAt) < 30 * 86400000).length}</p>
          <h3>高频标签</h3>
          <ul>
            {topTags.map(([tag, count]) => (
              <li key={tag}>
                #{tag} ({count})
              </li>
            ))}
          </ul>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[1, 5]} />
                <Tooltip />
                <Area type="monotone" dataKey="emotion" stroke="#6366f1" fill="#c7d2fe" />
                <Area type="monotone" dataKey="vividness" stroke="#9333ea" fill="#e9d5ff" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {page === 'settings' && (
        <section className="card">
          <h2>设置</h2>
          <div className="actions">
            <button type="button" onClick={downloadBackup}>
              导出 JSON
            </button>
            <label className="upload">
              导入 JSON
              <input
                type="file"
                accept="application/json"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  await importData(text)
                }}
              />
            </label>
            <button type="button" onClick={clearAll}>
              清空本地数据
            </button>
          </div>
        </section>
      )}

      {selected && (
        <section className="card">
          <h2>梦境详情</h2>
          <h3>{selected.title || '未命名梦境'}</h3>
          <p>{selected.content}</p>
          <p>
            情绪 {selected.emotion} / 清晰度 {selected.vividness}
          </p>
          <div className="tags">
            {selected.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                updateDraft({
                  ...selected,
                  id: selected.id,
                })
                setPage('compose')
              }}
            >
              重新编辑
            </button>
            <button
              type="button"
              onClick={async () => {
                await editEntry(selected.id, { content: `${selected.content}\n\n[补充]` })
              }}
            >
              快速补充
            </button>
            <button
              type="button"
              onClick={async () => {
                await removeEntry(selected.id)
              }}
            >
              删除
            </button>
          </div>
        </section>
      )}

      <nav className="tabs">
        <button type="button" onClick={() => setPage('timeline')}>
          搜索
        </button>
        <button type="button" onClick={() => setPage('compose')}>
          新建
        </button>
        <button type="button" onClick={() => setPage('insights')}>
          统计
        </button>
        <button type="button" onClick={() => setPage('settings')}>
          设置
        </button>
      </nav>
    </main>
  )
}

export default App
