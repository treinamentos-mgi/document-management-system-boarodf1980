const { randomUUID } = require('node:crypto');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');

const router = express.Router();
const storageDirectory = path.resolve(__dirname, '../../storage');
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const configuredMaxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);
const maxFileSize = Number.isSafeInteger(configuredMaxFileSize) && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : DEFAULT_MAX_FILE_SIZE_BYTES;

const allowedMimeTypesByExtension = new Map([
  ['.pdf', new Set(['application/pdf'])],
  ['.doc', new Set(['application/msword'])],
  ['.docx', new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])],
  ['.txt', new Set(['text/plain'])],
  ['.csv', new Set(['text/csv', 'application/csv', 'text/plain'])],
  ['.png', new Set(['image/png'])],
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
]);

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, storageDirectory),
  filename: (req, file, callback) => {
    callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = allowedMimeTypesByExtension.get(extension);
    if (!allowedMimeTypes || !allowedMimeTypes.has(file.mimetype.toLowerCase())) {
      const error = new Error('Tipo de arquivo não permitido.');
      error.code = 'INVALID_FILE';
      return callback(error);
    }
    callback(null, true);
  },
});

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const isSizeError = error.code === 'LIMIT_FILE_SIZE';
    return res.status(isSizeError ? 413 : 400).json({
      error: {
        code: isSizeError ? 'FILE_TOO_LARGE' : 'INVALID_FILE',
        message: isSizeError
          ? 'O arquivo excede o limite permitido.'
          : 'O envio do arquivo é inválido.',
      },
    });
  }

  if (error.code === 'INVALID_FILE') {
    return res.status(400).json({
      error: { code: 'INVALID_FILE', message: 'Tipo de arquivo não permitido.' },
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = status < 500 ? error.message : 'Ocorreu um erro interno.';
  return res.status(status).json({ error: { code, message } });
});

module.exports = router;
