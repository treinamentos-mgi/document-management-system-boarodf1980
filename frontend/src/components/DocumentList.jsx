import DownloadButton from './DownloadButton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename) {
  const extension = filename.split('.').pop();
  return extension && extension !== filename ? extension.slice(0, 4).toUpperCase() : 'FILE';
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : dateFormatter.format(date);
}

export default function DocumentList({ documents, isLoading, hasError }) {
  if (isLoading && documents.length === 0) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (hasError && documents.length === 0) return null;

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-index" aria-hidden="true">00</span>
        <div>
          <h3>Nenhum documento por aqui</h3>
          <p>Os arquivos enviados aparecerão nesta lista.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-list" aria-busy={isLoading}>
      <div className="list-columns" aria-hidden="true">
        <span>Documento</span>
        <span>Tamanho</span>
        <span>Responsável</span>
        <span className="visually-hidden">Ações</span>
      </div>
      <ul>
        {documents.map((document) => (
          <li className="document-row" key={document.id}>
            <div className="document-identity">
              <span className="file-type" aria-hidden="true">{getFileExtension(document.originalName)}</span>
              <div className="document-copy">
                <span className="document-name" title={document.originalName}>{document.originalName}</span>
                <span className="document-date">Enviado {formatDate(document.uploadedAt)}</span>
              </div>
            </div>
            <span className="document-size">{formatFileSize(document.size)}</span>
            <span className="document-owner">{document.owner}</span>
            <DownloadButton document={document} />
          </li>
        ))}
      </ul>
    </div>
  );
}
