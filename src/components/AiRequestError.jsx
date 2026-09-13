export default function AiRequestError({ error }) {
  if (!error) return null;
  return (
    <div className="warning-text ai-request-error" role="alert">
      <strong>{error.status === 402 ? 'Permintaan ditolak provider (402)' : 'Konten belum dapat dibuat'}</strong>
      {error.stage && <p>Tahap: {error.stage}.</p>}
      <p>{error.message}</p>
      {error.status === 402 && <>
        <details>
          <summary>Detail error</summary>
          {error.model && <p>Model: {error.model}</p>}
          <p>{error.providerMessage || 'Payment Required'}</p>
          {error.providerCode && <p>Kode: {error.providerCode}</p>}
          {error.requestId && <p>ID permintaan: {error.requestId}</p>}
        </details>
        <p><a href="https://1inference.com/dashboard/api-keys" target="_blank" rel="noreferrer">Periksa API key 1inference</a> · <a href="https://www.1inference.com/contact" target="_blank" rel="noreferrer">Hubungi 1inference</a></p>
      </>}
    </div>
  );
}
