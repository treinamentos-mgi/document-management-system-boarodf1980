import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments, uploadDocument } from './services/documentApi';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setIsLoading(true);
      setError('');
      try {
        const result = await listDocuments();
        if (isCurrent) setDocuments(result);
      } catch (loadError) {
        if (isCurrent) setError(loadError.message || 'Não foi possível carregar os documentos.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  async function handleUpload(file) {
    const uploadedDocument = await uploadDocument(file);
    setDocuments((currentDocuments) => [
      uploadedDocument,
      ...currentDocuments.filter((document) => document.id !== uploadedDocument.id),
    ]);
    setError('');
    setNotice(`${uploadedDocument.originalName} foi enviado.`);
  }

  function refreshDocuments() {
    setNotice('');
    setRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DMS<span className="brand-divider">/</span>ARQUIVO</span>
        </a>
        <div className="storage-status"><span className="status-dot" /> ARMAZENAMENTO LOCAL</div>
      </header>

      <main className="page-content" id="inicio">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">SEU ESPAÇO DE DOCUMENTOS</p>
            <h1 id="page-title">Tudo em <span>seu lugar.</span></h1>
            <p className="page-description">Envie, encontre e baixe seus arquivos em um só lugar.</p>
          </div>
          <div className="heading-note"><span>10 MiB</span> tamanho máximo por arquivo</div>
        </section>

        <div className="workspace">
          <aside className="upload-column">
            <UploadComponent onUpload={handleUpload} />
            <p className="privacy-note"><span aria-hidden="true">●</span> Seus arquivos ficam neste servidor.</p>
          </aside>

          <section className="library" aria-labelledby="documents-heading">
            <div className="library-heading">
              <div>
                <p className="section-kicker">BIBLIOTECA</p>
                <h2 id="documents-heading">Documentos <span className="document-count">{documents.length.toString().padStart(2, '0')}</span></h2>
              </div>
              <button
                className="text-button refresh-button"
                type="button"
                onClick={refreshDocuments}
                disabled={isLoading}
                title="Atualizar documentos"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 7v5h-5M4.6 9a7.5 7.5 0 0 1 12.6-2L20 12M4 17v-5h5m10.4 3a7.5 7.5 0 0 1-12.6 2L4 12" />
                </svg>
                Atualizar
              </button>
            </div>

            {notice && <p className="notice-banner" role="status">{notice}</p>}
            {error && (
              <div className="error-banner" role="alert">
                <span>{error}</span>
                <button className="text-button" type="button" onClick={refreshDocuments}>Tentar novamente</button>
              </div>
            )}

            <DocumentList documents={documents} isLoading={isLoading} hasError={Boolean(error)} />
            <footer className="library-footer">
              <span>{documents.length === 1 ? '1 documento' : `${documents.length} documentos`}</span>
              <span>LISTA DESTA SESSÃO</span>
            </footer>
          </section>
        </div>
      </main>

      <footer className="page-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>ARQUIVOS LOCAIS <i className="footer-rule" /> METADADOS EM MEMÓRIA</span>
      </footer>
    </div>
  );
}
