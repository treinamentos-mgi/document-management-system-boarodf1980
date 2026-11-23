const fs = require('node:fs/promises');
const documentRepository = require('../repositories/document.repository');

function createError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

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
    const file = await fs.stat(document.storagePath);
    if (!file.isFile()) {
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
