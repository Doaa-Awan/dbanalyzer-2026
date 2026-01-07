export default function DbExplorer({ tables = [], onBack }) {
  return (
    <div className="db-explorer">
      <h2>Database Explorer</h2>
      <button onClick={onBack}>Back</button>
      <h3>Tables</h3>
      {tables.length === 0 ? (
        <p>No tables found.</p>
      ) : (
        <ul>
          {tables.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}