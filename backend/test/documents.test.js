const { once } = require('node:events');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const documentRepository = require('../src/repositories/document.repository');

async function startServer(t) {
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('upload, listagem e download de um documento', async (t) => {
  const baseUrl = await startServer(t);
  let documentId;
  t.after(async () => {
    if (documentId) await documentRepository.deleteDocument(documentId);
  });

  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'nota.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });

  assert.equal(uploadResponse.status, 201);
  const uploadedDocument = await uploadResponse.json();
  documentId = uploadedDocument.id;
  assert.deepEqual(Object.keys(uploadedDocument).sort(), [
    'id', 'originalName', 'owner', 'size', 'uploadedAt',
  ]);
  assert.equal(uploadedDocument.originalName, 'nota.txt');
  assert.equal(uploadedDocument.owner, 'local-user');

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  const { documents } = await listResponse.json();
  assert.ok(documents.some((document) => document.id === documentId));

  const downloadResponse = await fetch(`${baseUrl}/documents/${documentId}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /nota\.txt/);
  assert.equal(await downloadResponse.text(), 'conteudo de teste');
});

test('upload sem arquivo retorna erro previsível', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST' });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
  });
});

test('upload de tipo não permitido é rejeitado', async (t) => {
  const baseUrl = await startServer(t);
  const form = new FormData();
  form.append('file', new Blob(['conteudo'], { type: 'application/octet-stream' }), 'arquivo.exe');
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_FILE');
});

test('download de documento inexistente retorna 404', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/documents/id-inexistente/download`);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
