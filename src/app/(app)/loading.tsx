export default function Loading() {
  return (
    <div className="global-loading" role="status" aria-live="polite">
      <div className="top-loading-bar" />
      <div className="loading-card">
        <span className="large-spinner" aria-hidden="true" />
        <strong>Carregando...</strong>
      </div>
    </div>
  );
}
