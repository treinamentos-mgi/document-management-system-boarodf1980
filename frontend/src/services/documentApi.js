const API_PREFIX = '/api';

async function getErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload?.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function ensureSuccess(response) {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response;
}

export async function listDocuments() {
  const response = await ensureSuccess(await fetch(`${API_PREFIX}/documents`));
  const payload = await response.json();
  return Array.isArray(payload.documents) ? payload.documents : [];
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await ensureSuccess(await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  }));
  return response.json();
}

function getDownloadFilename(contentDisposition, fallback) {
  const encodedFilename = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedFilename) {
    try {
      return decodeURIComponent(encodedFilename);
    } catch {
      return fallback;
    }
  }

  const filename = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return filename ? filename.trim() : fallback;
}

export async function downloadDocument(document) {
  const response = await ensureSuccess(await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(document.id)}/download`
  ));

  return {
    blob: await response.blob(),
    filename: getDownloadFilename(
      response.headers.get('content-disposition'),
      document.originalName
    ),
  };
}
