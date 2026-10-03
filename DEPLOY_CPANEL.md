# Deploy no cPanel — Sala de Imprensa ENDIAMA

Guia específico para **este** projecto (frontend Next.js na raiz do repositório + backend Express/Prisma em `backend/`, MySQL/MariaDB). Não é um tutorial genérico — os caminhos, ficheiros e comandos abaixo são exactamente os deste repositório.

A base de dados de produção (`novoendiamaimpre_imprensa`) **já tem a estrutura e os dados importados** através do dump corrigido (`backend/migration-backup/sala_de_imprensa_endiama_mysql_cpanel.sql`). Este guia **não** volta a criar tabelas nem a popular dados — só liga a aplicação a essa base já existente.

---

## 1. Clonar o projecto no servidor

Via SSH (ou o Terminal do cPanel, se o plano o disponibilizar):

```bash
cd ~
git clone https://github.com/viralizaoficial98-cloud/endiamaimprensa.git sala-imprensa
cd sala-imprensa
```

## 2. Onde fica cada parte

```
sala-imprensa/              ← frontend (Next.js) — Application Root da app #1
  ├── backend/               ← backend (Express/Prisma) — Application Root da app #2
  ├── .next/standalone/      ← gerado pelo build, não está no Git
  └── server.js NÃO existe   ← ver secção 10, o startup file é o gerado pelo Next
```

São **duas aplicações Node separadas** no cPanel (Setup Node.js App), uma para cada pasta.

## 3. Comandos npm necessários

| | Frontend (raiz) | Backend (`backend/`) |
|---|---|---|
| Instalar | `npm install` | `npm install` |
| Build | `npm run build` | `npm run build` |
| Iniciar | `npm start` | `npm start` |

- Frontend `npm run build` = `next build` (com `output: "standalone"`) + `postbuild` automático que copia `public/` e `.next/static/` para dentro de `.next/standalone/`.
- Frontend `npm start` = `node .next/standalone/server.js` (gerado pelo próprio Next — não escrevi um `server.js` manual: uma versão feita à mão com a API pública `next()` do Next 15 falhou em testes reais sob o App Router/RSC; o `server.js` gerado pelo `output: "standalone"` é o caminho oficialmente documentado e testado que funcionou).
- Backend `npm run build` = `tsc` → `dist/`. `npm start` = `node dist/server.js`. O `postinstall` já corre `prisma generate` automaticamente a seguir a `npm install`.

**IMPORTANTE:** o Node Selector do cPanel só tem botão para "Run NPM Install", não para build. Depois do `npm install`, o `npm run build` de cada app tem de ser corrido manualmente via Terminal/SSH (ver secção 10).

## 4. Configurar `.env`

Nenhum `.env` real está no Git. Em cada pasta, copiar o exemplo e preencher:

```bash
cp .env.example .env               # na raiz (frontend)
cp backend/.env.example backend/.env   # no backend
```

Editar os dois ficheiros com os valores reais de produção (ver secções 5 e 13).

## 5. `DATABASE_URL`

```
DATABASE_URL="mysql://novoendiamaimpre_imprensa:PASSWORD_REAL@localhost:3306/novoendiamaimpre_imprensa"
```
`PASSWORD_REAL` nunca entra no Git — só neste `backend/.env` no servidor.

## 6. Prisma — a base já tem os dados, NÃO recriar nada

```bash
cd backend
npx prisma generate          # já corre automaticamente no postinstall, mas sem mal nenhum repetir
npx prisma migrate status    # confirma que a migration já importada está reconhecida
npx prisma migrate deploy    # aplica migrations pendentes — aqui deverá ser um no-op seguro
```

**Porque é seguro:** o dump importado incluiu a própria tabela `_prisma_migrations` do ambiente local, já com a migration `20261003130617_init_mysql` marcada como aplicada. `prisma migrate deploy` vai reconhecer isto e **não vai tentar recriar nada** — só confirma que o schema está em sincronia. Testado localmente contra uma base no mesmo estado: `Database schema is up to date!`.

**NUNCA executar em produção:** `prisma migrate dev`, `prisma db push`, `prisma migrate reset`, `prisma db seed`.

## 7. Iniciar o backend

Dentro do Node Selector do cPanel (ver secção 10) ou manualmente para testar:
```bash
cd backend && npm start
```
Escuta em `process.env.PORT` (o Node Selector define-a automaticamente); `4000` só é usado como *fallback* se `PORT` não estiver definida (nunca acontece no cPanel).

## 8. Iniciar o frontend

```bash
npm start
```
(a partir da raiz do projecto). Também respeita `PORT`/`HOSTNAME` do ambiente — ambos definidos automaticamente pelo Node Selector do cPanel.

## 9. Application Root / Startup File / Environment Variables

### App #1 — Frontend
| Campo | Valor |
|---|---|
| Application Root | `sala-imprensa` (a pasta onde fez `git clone`) |
| Application Startup File | `.next/standalone/server.js` |
| Application URL | o domínio/subdomínio do portal |
| Node version | 20.x LTS |

### App #2 — Backend
| Campo | Valor |
|---|---|
| Application Root | `sala-imprensa/backend` |
| Application Startup File | `dist/server.js` |
| Application URL | o domínio/subdomínio da API (ex.: `api-imprensa...`) |
| Node version | 20.x LTS |

### Environment Variables (definir no painel do Node Selector de cada app, não em ficheiro)
Todas as de `backend/.env.example` na app do backend; todas as de `.env.example` (raiz) na app do frontend. Os valores reais (domínio, `DATABASE_URL` com a password, `JWT_SECRET`, etc.) são os únicos que mudam entre as duas.

## 10. Build manual via Terminal/SSH do cPanel

O botão "Run NPM Install" do Node Selector não corre `npm run build`. Depois de criar cada app e carregar as `node_modules`, é preciso activar o ambiente virtual Node que o cPanel cria para essa app e correr o build manualmente:

```bash
# backend
source /home/SEU_UTILIZADOR/nodevenv/sala-imprensa/backend/20/bin/activate
cd ~/sala-imprensa/backend
npm run build
deactivate

# frontend
source /home/SEU_UTILIZADOR/nodevenv/sala-imprensa/20/bin/activate
cd ~/sala-imprensa
npm run build
deactivate
```
(o caminho exacto do `nodevenv` é mostrado na própria página do Node Selector de cada app, em "Enter to the virtual environment").

## 11. Application Root — confirmação

Já coberto na tabela da secção 9 — duas Application Roots distintas, uma por app.

## 12. Permissões

As pastas já existem com permissões normais de ficheiros criados pelo próprio utilizador cPanel (o processo Node corre como esse utilizador). Não é necessário `chmod` manual em circunstâncias normais. A única pasta que precisa de ser **escrevível** pelo processo Node é `backend/uploads/`.

## 13. Enviar `backend/uploads/`

Os ficheiros reais **não estão no Git** (propositadamente). A estrutura de 12 subpastas já existe via `.gitkeep` (preservada pelo `git clone`) e a aplicação também as recria automaticamente no arranque (`ensureUploadFoldersExist()`) caso faltem. Só falta enviar o **conteúdo real**:

```bash
# a partir da sua máquina local, para o servidor (SFTP/rsync/File Manager)
scp -r "backend/uploads/*" utilizador@servidor:~/sala-imprensa/backend/uploads/
```
ou arrastar pelo File Manager do cPanel para `sala-imprensa/backend/uploads/<pasta>/`.

## 14. Testar `/api/health`

```bash
curl https://api-imprensa.SEUDOMINIO/api/health
```
Deve devolver `{"success":true,"status":"ok","database":"connected",...}`.

## 15. Testar o frontend

Abrir a `Application URL` do frontend no navegador — a homepage deve mostrar notícias reais (confirma que o frontend está a falar com o backend através de `NEXT_PUBLIC_API_URL`).

## 16. Ver logs

No Node Selector do cPanel, cada app tem um link/botão "Log file" (normalmente dentro de `~/nodevenv/.../logs/` ou configurável). Para testar manualmente via SSH, basta correr `npm start` directamente no terminal e observar a saída.

## 17. Reiniciar a aplicação

No Node Selector do cPanel: botão **"Restart"** em cada app, depois de qualquer alteração de `.env` ou após um novo build.

## 18. CORS e domínios

O backend só aceita pedidos de `FRONTEND_URL` + `ADDITIONAL_CORS_ORIGINS` (lista separada por vírgulas) — nunca `*`, e `credentials: true`. Definir `FRONTEND_URL=https://imprensa.SEUDOMINIO` em produção; se existirem outros domínios autorizados (ex.: `www.`), acrescentá-los a `ADDITIONAL_CORS_ORIGINS`.

---

## PROCEDIMENTO DE ACTUALIZAÇÃO FUTURA

```bash
# backend
cd ~/sala-imprensa/backend
git pull
npm install
npx prisma migrate deploy   # só aplica o que for novo; nunca apaga dados
npm run build
# Node Selector → Restart na app do backend

# frontend
cd ~/sala-imprensa
git pull
npm install
npm run build                # já corre o postbuild automaticamente
# Node Selector → Restart na app do frontend
```

Se um `git pull` trouxer novos ficheiros em `backend/uploads/<pasta>/.gitkeep` (nova categoria de upload), nada a fazer — a pasta já é recriada automaticamente no arranque do backend.
