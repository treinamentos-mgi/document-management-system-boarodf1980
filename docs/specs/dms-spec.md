# Especificação - Document Management System

> Especificação funcional e técnica do MVP. Os requisitos abaixo descrevem o comportamento-alvo; não indicam que os fluxos documentais já estejam implementados.

## 1. Objetivo

Permitir que um usuário envie, liste e baixe documentos, mantendo os arquivos no filesystem local da aplicação e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Receber um arquivo por solicitação e armazená-lo localmente.
- Registrar em memória os metadados necessários para listar e localizar o documento durante a execução atual.
- Listar os documentos disponíveis no processo atual.
- Baixar um documento pelo seu identificador, usando o nome original como nome de download.
- Aplicar validação de presença, tamanho e tipo de arquivo.
- Usar uma identidade demonstrativa fixa para `owner`; a listagem do MVP é global.

### Fora do escopo

- Armazenamento em nuvem, serviços de upload externos ou banco de dados persistente.
- Autenticação, cadastro de usuários ou isolamento de documentos entre usuários.
- Versionamento, compartilhamento, busca, edição ou pré-visualização de documentos.
- Garantia de que a listagem ou os downloads possam ser recuperados depois que o processo reiniciar. Os arquivos permanecem no disco, mas os metadados em memória são perdidos.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve aceitar um arquivo enviado como `multipart/form-data` no campo `file`. | Uma solicitação válida retorna `201` e os metadados públicos do documento criado. |
| RF-02 | O sistema deve rejeitar uma solicitação sem arquivo, com tipo não permitido ou que exceda o limite configurado. | A resposta informa o erro por um código estável e não deixa um arquivo parcial como documento disponível. |
| RF-03 | O sistema deve gravar o conteúdo em `backend/storage`, usando Multer com `diskStorage`. | O arquivo é armazenado sob nome interno gerado pelo sistema; o nome enviado pelo usuário não é usado como caminho. |
| RF-04 | O sistema deve registrar os metadados do documento em memória após o armazenamento do arquivo. | O documento aparece na listagem do processo atual e os metadados não incluem caminho local. |
| RF-05 | O sistema deve listar todos os documentos registrados na memória. | A resposta contém uma coleção de metadados públicos; uma coleção vazia é válida. |
| RF-06 | O sistema deve permitir baixar um documento pelo `id`. | Um documento existente é retornado como anexo com o nome original; um identificador desconhecido retorna `404`. |
| RF-07 | O MVP deve atribuir ao documento um `owner` demonstrativo fixo. | O campo é consistente entre upload e listagem; não há autenticação nem filtragem por usuário. |
| RF-08 | O sistema deve tratar falhas de persistência local e de registro dos metadados. | O erro é comunicado sem revelar caminhos internos; se o registro em memória falhar após gravar o arquivo, o arquivo recém-gravado é removido quando possível. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser armazenados exclusivamente no filesystem local, em `backend/storage`, por meio de Multer `diskStorage`; não usar provedores externos. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase. Reiniciar o processo perde o índice de metadados, embora arquivos existentes possam permanecer no disco. |
| RNF-03 | Configurações operacionais devem vir de variáveis de ambiente. `PORT` já possui fallback `3000`; o limite de upload deve ser configurável por `MAX_FILE_SIZE_BYTES`, com padrão proposto de `10485760` (10 MiB). |
| RNF-04 | O MVP deve limitar uploads a 10 MiB por arquivo por padrão e aceitar inicialmente PDF, DOC, DOCX, TXT, CSV, PNG e JPEG. Validar extensão e tipo MIME; não confiar somente no nome fornecido pelo cliente. |
| RNF-05 | O identificador e o nome interno de armazenamento devem ser gerados pelo sistema. O nome original deve ser tratado como dado de apresentação, nunca concatenado a um caminho de filesystem. |
| RNF-06 | Os erros devem ter formato previsível e não expor stack traces, caminhos absolutos ou detalhes internos do filesystem. |
| RNF-07 | O backend deve preservar a separação de responsabilidades definida para o projeto. O frontend deve consumir a API por `fetch` através do prefixo `/api` configurado no proxy do Vite. |

A allowlist e o limite padrão acima são decisões iniciais do MVP. Alterações nesses valores devem atualizar esta especificação e a configuração documentada.

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, gerado pelo sistema (UUID recomendado). |
| `originalName` | string | Nome original fornecido no upload, preservado apenas para apresentação e download. |
| `size` | number | Tamanho do conteúdo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601, preferencialmente UTC. |
| `owner` | string | Identificador demonstrativo fixo no MVP; não representa autenticação. |

### Dados internos de armazenamento

A implementação precisa manter uma associação entre o `id` e o arquivo local, além do tipo de conteúdo necessário para a resposta de download. O nome interno deve ser gerado pelo sistema e o caminho deve ser derivado de uma pasta-base configurada, não de entrada do usuário. Esses dados internos não fazem parte das respostas públicas.

O repositório em memória é a fonte de metadados durante a vida do processo. Não há garantia de recuperação de metadados após reinício. O arquivo não deve ser exposto por acesso estático direto à pasta de armazenamento; o download ocorre pelo endpoint identificado.

## 6. Contratos de API

Os paths abaixo são relativos à origem do backend. No desenvolvimento, o frontend pode prefixá-los com `/api`; o proxy atual do Vite remove esse prefixo antes de encaminhar a requisição. `/api` não faz parte dos paths registrados no backend.

### Formato de erro

Respostas de erro usam JSON no formato:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

`code` é estável para uso pelo cliente. `message` é uma mensagem legível em português. Respostas de erro não incluem stack trace nem caminhos locais.

### `POST /upload`

- **Entrada:** `multipart/form-data` com exatamente um arquivo no campo `file`.
- **Validação:** arquivo obrigatório; tamanho máximo definido por `MAX_FILE_SIZE_BYTES`; extensão e MIME compatíveis com PDF, DOC, DOCX, TXT, CSV, PNG ou JPEG.
- **Sucesso:** `201 Created`, `Content-Type: application/json`, corpo igual ao objeto de metadados públicos.
- **Erros:**
  - `400 Bad Request`, `FILE_REQUIRED`, quando não houver arquivo.
  - `400 Bad Request`, `INVALID_FILE`, quando o upload estiver malformado ou a validação de extensão/MIME falhar.
  - `413 Payload Too Large`, `FILE_TOO_LARGE`, quando o limite for excedido.
  - `500 Internal Server Error`, `STORAGE_ERROR`, quando ocorrer falha ao gravar o arquivo ou registrar os metadados. A mensagem não revela detalhes internos.

Exemplo de sucesso:

```json
{
  "id": "6b7a3d8e-1b59-4c54-9f4e-2c2d48e4770a",
  "originalName": "relatorio.pdf",
  "size": 48213,
  "uploadedAt": "2026-11-23T12:00:00.000Z",
  "owner": "local-user"
}
```

### `GET /documents`

- **Entrada:** sem parâmetros obrigatórios.
- **Sucesso:** `200 OK`, `Content-Type: application/json`, corpo no formato `{ "documents": [...] }`. Cada item contém apenas os metadados públicos definidos na seção 5.
- **Ordenação:** mais recentes primeiro (`uploadedAt` decrescente); desempate estável por `id`.
- Uma lista vazia retorna `200` com `{"documents": []}`.

### `GET /documents/:id/download`

- **Entrada:** `id` do documento na URL.
- **Sucesso:** `200 OK`, corpo binário do arquivo, `Content-Type` correspondente ao tipo validado e `Content-Disposition: attachment` com o nome original devidamente codificado. `Content-Length` deve refletir o tamanho do arquivo quando disponível.
- **Erros:**
  - `404 Not Found`, `DOCUMENT_NOT_FOUND`, quando o identificador não estiver no repositório em memória.
  - `404 Not Found`, `FILE_NOT_FOUND`, quando houver metadado mas o arquivo local não estiver disponível.
  - `500 Internal Server Error`, `STORAGE_ERROR`, para outras falhas de leitura.

## 7. Decisões arquiteturais

- **Backend:** Node.js e Express em CommonJS, com dependências fluindo de `routes` para `controllers`, `services` e `repositories`. Rotas definem endpoints; controllers traduzem HTTP; services aplicam regras de negócio; repositories gerenciam metadados e associação aos arquivos.
- **Upload:** Multer com `diskStorage` grava exclusivamente em `backend/storage`. O nome de arquivo é gerado pelo sistema; o diretório e os limites vêm de configuração controlada pela aplicação.
- **Consistência:** validar a requisição antes de registrar o documento; se a gravação falhar, não criar metadado; se o registro em memória falhar após a gravação, tentar remover o arquivo criado. A remoção pode ser tentada também para uploads rejeitados após criação temporária.
- **Frontend:** React com componentes funcionais. Chamadas à API usam `fetch` e o prefixo `/api` do proxy de desenvolvimento; não duplicar esse prefixo nos paths do backend.
- **Metadados:** armazenamento em memória, sem banco de dados nesta fase. A perda do índice após reinício é uma limitação explícita do MVP.
- **Identidade:** `owner` fixo/demonstrativo. A API não promete autenticação, autorização ou privacidade entre usuários.
- **Estado atual:** o repositório contém apenas a estrutura inicial e `/health` no backend; upload, listagem, download e respectivas camadas são requisitos-alvo, não funcionalidades existentes.

## 8. Plano de execução

Etapas funcionais para uma futura entrega do produto; não definem alterações ou execução de arquivos específicos de back-end ou front-end.

1. Consolidar as regras de validação, limites, tipos permitidos e respostas de erro do fluxo de upload.
2. Disponibilizar o ciclo funcional de upload e registro local, mantendo os metadados consultáveis durante a execução do serviço.
3. Disponibilizar a listagem global e o download por identificador, incluindo os casos de documento inexistente ou arquivo ausente.
4. Integrar a experiência de uso para enviar, consultar e baixar documentos através dos contratos definidos.
5. Validar os fluxos completos e os critérios de aceite, incluindo reinício do processo, limites de arquivo e falhas de armazenamento.
