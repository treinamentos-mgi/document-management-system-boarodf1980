const documentService = require('../services/document.service');
const createError = require('../errors/create-error');

async function upload(req, res) {
  if (!req.file) {
    throw createError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
  }

  const document = await documentService.createDocument(req.file);
  return res.status(201).json(document);
}

function list(req, res) {
  return res.status(200).json({ documents: documentService.listDocuments() });
}

async function download(req, res, next) {
  const document = await documentService.getDownloadDocument(req.params.id);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', document.mimeType);

  return res.download(document.storagePath, document.originalName, (error) => {
    if (!error) return;
    if (res.headersSent) return next(error);

    if (error.code === 'ENOENT') {
      return next(createError(404, 'FILE_NOT_FOUND', 'O arquivo deste documento não está disponível.'));
    }
    return next(createError(500, 'STORAGE_ERROR', 'Não foi possível ler o arquivo.'));
  });
}

module.exports = { upload, list, download };
