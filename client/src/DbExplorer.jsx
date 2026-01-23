import { useState } from 'react';

export default function DbExplorer({ tables = [], onBack }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="db-explorer-shell">
      <header className="db-explorer-header">
        <div>
          <p className="eyebrow">AI DB Explorer</p>
          <h2>Ask the database</h2>
          <p className="subtitle">Use plain language to explore tables, rows, and relationships.</p>
        </div>
      </header>

      <div className={`db-explorer-body ${isCollapsed ? 'collapsed' : ''}`}>
        <section className="db-main">
          <div className="chat-window">
            <button className="btn ghost chat-back" type="button" onClick={onBack}>
              Back
            </button>
            <div className="chat-header">
              <span>New question</span>
              <span className="chat-hint">AI answers in seconds</span>
            </div>
            <div className="chat-messages">
              <div className="chat-message muted">
                Ask something like “Show total revenue by month” or “List top 10 customers.”
              </div>
            </div>
            <form className="chat-input" onSubmit={(event) => event.preventDefault()}>
              <input
                type="text"
                placeholder="Ask a question about your database"
                aria-label="Ask a question about your database"
              />
              <button className="btn primary" type="submit">
                Ask
              </button>
            </form>
          </div>
        </section>

        <aside
          className={`db-sidebar ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          <button
            className="sidebar-toggle"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsCollapsed((prev) => !prev);
            }}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '>' : '<'}
          </button>
          <div className="sidebar-header">
            <div>
              <h3>Tables</h3>
              <p className="sidebar-meta">{tables.length} total</p>
            </div>
          </div>
          <div
            className="table-list"
            onClick={(event) => event.stopPropagation()}
          >
            {tables.length === 0 ? (
              <p className="empty-state">No tables found.</p>
            ) : (
              <ul>
                {tables.map((table) => (
                  <li key={table.name}>
                    <span>{table.name}</span>
                    <span className="count">{table.columnCount} cols</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
