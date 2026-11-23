import { useRef, useState } from 'react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ onUpload }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function selectFile(nextFile) {
    setError('');
    setFile(nextFile || null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('O arquivo excede o limite de 10 MiB.');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      await onUpload(file);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message || 'Não foi possível enviar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-heading">
      <div className="section-kicker">NOVO DOCUMENTO</div>
      <h2 id="upload-heading">Adicionar arquivo</h2>
      <p className="upload-intro">Escolha um documento para guardar no seu espaço local.</p>

      <form onSubmit={handleSubmit}>
        <label
          className={`drop-zone${isDragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
          htmlFor="document-file"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files[0]);
          }}
        >
          <input
            ref={fileInputRef}
            id="document-file"
            className="visually-hidden"
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={(event) => selectFile(event.target.files[0])}
          />
          <span className="upload-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15.5v3A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-3" />
            </svg>
          </span>
          {file ? (
            <>
              <span className="drop-title file-name">{file.name}</span>
              <span className="drop-hint">{formatFileSize(file.size)} · clique para trocar</span>
            </>
          ) : (
            <>
              <span className="drop-title">Solte seu arquivo aqui</span>
              <span className="drop-hint">ou clique para procurar no dispositivo</span>
            </>
          )}
        </label>

        <p className="file-rules">PDF, DOC, DOCX, TXT, CSV, PNG ou JPEG · até 10 MiB</p>

        {error && <p className="inline-error" role="alert">{error}</p>}

        <button className="primary-button upload-submit" type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
          {!isUploading && <span aria-hidden="true">↗</span>}
        </button>
      </form>
    </section>
  );
}
