import { useState } from 'react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ document }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (isDownloading) return;
    setIsDownloading(true);
    setError('');

    try {
      const { blob, filename } = await downloadDocument(document);
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError.message || 'Não foi possível baixar o documento.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <span className="download-control">
      <button
        className="icon-button download-button"
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={`Baixar ${document.originalName}`}
        title={isDownloading ? 'Baixando documento' : 'Baixar documento'}
      >
        {isDownloading ? (
          <span className="button-spinner" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3.75v10.5m0 0 4-4m-4 4-4-4M5 15.75v3A1.25 1.25 0 0 0 6.25 20h11.5A1.25 1.25 0 0 0 19 18.75v-3" />
          </svg>
        )}
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </span>
  );
}
