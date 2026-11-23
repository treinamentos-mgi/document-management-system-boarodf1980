const documentRepository = require('../repositories/document.repository');
const createError = require('../errors/create-error');

async function createDocument(file) {
  try {
    return documentRepository.create(file);
  } catch (error) {
    await documentRepository.removeFile(file.path).catch(() => {});
    throw createError(500, 'STORAGE_ERROR', 'Não foi possível registrar o documento.');
  }
}

function listDocuments() {
  return documentRepository.findAll();
}

async function getDownloadDocument(id) {
  const document = documentRepository.findById(id);
  if (!document) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  try {
    if (!await documentRepository.isFileAvailable(document.storagePath)) {
      throw createError(404, 'FILE_NOT_FOUND', 'O arquivo deste documento não está disponível.');
    }
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw createError(404, 'FILE_NOT_FOUND', 'O arquivo deste documento não está disponível.');
    }
    if (error.status) throw error;
    throw createError(500, 'STORAGE_ERROR', 'Não foi possível ler o arquivo.');
  }

  return document;
}

module.exports = { createDocument, listDocuments, getDownloadDocument };
