const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

fs.mkdirSync(storageDirectory, { recursive: true });

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function create(file) {
  const originalName = path.basename(String(file.originalname || '').replace(/\\/g, '/'));
  const document = {
    id: crypto.randomUUID(),
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'local-user',
    mimeType: file.mimetype,
    storagePath: file.path,
  };

  documents.set(document.id, document);
  return toPublicDocument(document);
}

function findAll() {
  return [...documents.values()]
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt)
      || left.id.localeCompare(right.id))
    .map(toPublicDocument);
}

function findById(id) {
  return documents.get(id) || null;
}

async function removeFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function deleteDocument(id) {
  const document = documents.get(id);
  if (!document) return;

  documents.delete(id);
  await removeFile(document.storagePath);
}

module.exports = {
  storageDirectory,
  create,
  findAll,
  findById,
  removeFile,
  deleteDocument,
};
