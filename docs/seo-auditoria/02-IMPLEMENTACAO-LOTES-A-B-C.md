# Sala de Imprensa ENDIAMA E.P. — Implementação dos Lotes A, B e C

**Data:** 2026-11-17 · **Ramo:** `claude/practical-dijkstra-v5sl7o`
**Decisões aprovadas:** domínio canónico `https://www.novo.endiamaimprensa.com` (actualizado em 2026-11-18; inicialmente sem www) · inglês mantido por cookie (só PT indexável, sem hreflang) · Lotes A+B+C · GA4 preparado e desligado.

> Etapa 5 (Homologação): **nada foi publicado em produção.** As alterações estão no ramo acima, para revisão e aprovação.
> Matriz completa por requisito: [`Technical_Checklist_ENDIAMA_avaliado.xlsx`](./Technical_Checklist_ENDIAMA_avaliado.xlsx) (colunas *QA* e *Comments* preenchidas).

---

## 1. Resumo

| Estado após os Lotes A+B+C (117 requisitos da checklist) | N.º |
|---|---|
| Conforme | **63** |
| Parcial | 19 |
| Não Conforme | **6** |
| Não Verificado (depende da produção / do GSC) | 18 |
| Não Aplicável | 11 |

O diagnóstico inicial (`01-DIAGNOSTICO-E-PLANO.md`) agrupava alguns requisitos, por isso não é comparável número a número. Dos problemas críticos desse diagnóstico, C1 a C7 estão resolvidos; o C8 está resolvido em parte (a Content-Security-Policy fica pendente, ver §6).

Os 6 "Não Conforme" restantes (sitemap HTML, SearchAction, paginação/filtros rastreáveis ×3, legendas de vídeo) estão todos previstos no Lote D, ou são evoluções editoriais.

---

## 2. Melhorias implementadas

### Lote A — Fundações SEO
| # | Melhoria | Problema resolvido |
|---|---|---|
| A1 | Configuração central `src/lib/site.ts` (`NEXT_PUBLIC_SITE_URL`, por omissão `https://www.novo.endiamaimprensa.com`) | C1 — canonicals, OG, robots e sitemap apontavam para `imprensa.endiama.co.ao` |
| A2 | Helper `buildPageMetadata()` aplicado a **todas** as páginas públicas: canonical absoluto, Open Graph completo (`og:url`, `site_name`, `locale`, imagem), Twitter Card | C7 |
| A3 | Notícias usam os campos SEO **já existentes** na BD (`seoTitle`, `seoDescription`, `ogTitle`, `ogDescription`, `ogImage`, `canonicalUrl`, `robotsIndex`, `robotsFollow`), com fallback para título/resumo/capa | Campos gravados pelo admin mas ignorados pelo site |
| A4 | Removido o hreflang inválido (PT e EN no mesmo URL) | C2 |
| A5 | `noindex, nofollow` em toda a Área Administrativa (metadata + cabeçalho `X-Robots-Tag`) e `Disallow: /admin` | C3 |
| A6 | H1 animado (`AnimatedTitle`) com espaço real entre palavras — o visual é idêntico | C4 — o H1 de todas as notícias e do banner era lido como "ENDIAMAanunciaresultados…" |
| A7 | `/videos` passa a ter um único H1 (o título do leitor passou a H2, mesmo estilo) | 2 H1 na página |
| A8 | Títulos que excederiam 60 caracteres com o sufixo "— ENDIAMA Notícias" são apresentados sem o sufixo; descrições truncadas a 155 caracteres sem cortar palavras | Limites de apresentação em mobile |
| A9 | Cabeçalhos de segurança: HSTS (1 ano, sem `includeSubDomains`), `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`; remove `X-Powered-By` | C8 |
| A10 | Cache de 7 dias para `/images/*` | Cache de estáticos |
| A11 | Meta tags de verificação do Google Search Console e do Bing por variável de ambiente (vazias = nada é emitido) | Preparação GSC/Bing |
| A12 | GA4 **desligado por omissão**; só carrega com `NEXT_PUBLIC_GA_MEASUREMENT_ID` definido **e** aceitação no aviso de consentimento (PT/EN) | Analytics com privacidade |

### Lote B — Sitemaps
| Ficheiro | Conteúdo |
|---|---|
| `/sitemap.xml` | **Índice** (mantém o URL antigo, para não quebrar submissões existentes) |
| `/sitemaps/paginas.xml` | Home, listagens, páginas institucionais, categorias |
| `/sitemaps/noticias.xml` | Todas as notícias indexáveis + `image:image` (capa, imagem OG, imagens dos blocos) |
| `/sitemaps/entrevistas.xml`, `eventos.xml`, `audios.xml` | Com `lastmod` real e imagens |
| `/sitemaps/galerias.xml` | Álbuns + **todas as fotografias** |
| `/news-sitemap.xml` | Google News: últimas 48 h, máx. 1 000, `news:publication`/`publication_date`/`title` |
| `/video-sitemap.xml` | Vídeos de `/videos` e vídeos incorporados em notícias (`player_loc` YouTube/Vimeo, `content_loc` ficheiros próprios) |

Regras: exclui notícias com `robotsIndex = false` ou com `canonicalUrl` para outro URL, eventos em rascunho e imagens genéricas de *fallback*. `lastmod` só com datas reais. Limite de 50 000 URLs por ficheiro. Se a API falhar, a resposta é **503 + Retry-After**, nunca um sitemap vazio (que levaria os motores a retirar URLs).

**Actualização automática:** os sitemaps são gerados no momento do pedido com a mesma cache etiquetada (`news`, `galleries`, `videos`, `events`, `audios`) que o admin **já invalida** em `/api/revalidate` após publicar, editar ou remover conteúdos. Não há ficheiro para regenerar.

### Lote C — Dados estruturados (JSON-LD no HTML do servidor)
| Página | Tipos |
|---|---|
| Todas as páginas públicas | `Organization` (nome, designação legal, logótipo, redes sociais registadas no admin; WhatsApp excluído) + `WebSite` |
| Notícia | `NewsArticle` (autor = utilizador real que a criou; se não houver nome, a própria organização) + `BreadcrumbList` + `VideoObject` dos vídeos incorporados |
| Entrevista | `Article` com `about` = pessoa entrevistada + `BreadcrumbList` |
| Evento | `Event` (data/hora de Luanda, local, estado; organizador só se registado) + `BreadcrumbList` |
| Áudio | `AudioObject` + `BreadcrumbList` |
| Galeria | `ImageGallery` com `ImageObject` (até 60 fotografias) + `BreadcrumbList` |
| Categoria | `BreadcrumbList` |
| Vídeos | `VideoObject` por vídeo (os que não têm data real de publicação são omitidos) |

Não se inventa nada: propriedades sem dado real são omitidas. `SearchAction`, `FAQPage`, `HowTo` e `Product` **não** foram usados (ver matriz).

---

## 3. Ficheiros alterados

**Novos**
- `src/lib/site.ts` — identidade e domínio canónico
- `src/lib/seo/metadata.ts` — metadados por página
- `src/lib/seo/json-ld.ts`, `src/presentation/components/seo/json-ld.tsx` — dados estruturados
- `src/lib/seo/sitemap.ts`, `src/lib/seo/sitemap-paths.ts` — dados e XML dos sitemaps
- `src/app/sitemap.xml/route.ts`, `src/app/sitemaps/[file]/route.ts`, `src/app/news-sitemap.xml/route.ts`, `src/app/video-sitemap.xml/route.ts`
- `src/app/admin/layout.tsx` — só metadados `noindex` (não altera autenticação nem layout do admin)
- `src/presentation/components/analytics/analytics-consent.tsx`

**Alterados**
- `src/app/layout.tsx`, `src/app/robots.ts`, `next.config.ts`, `.env.example`
- `src/app/(public)/layout.tsx` e as 19 páginas públicas (`page.tsx`) — metadados e JSON-LD; nenhum markup visual alterado
- `src/presentation/components/ui/animated-title.tsx` (espaços no H1), `src/presentation/components/video/video-player-premium.tsx` (H1 → H2, mesmas classes)
- `src/domain/entities/*`, `src/infrastructure/api/dto.ts`, `src/infrastructure/api/mappers.ts` — campos SEO e datas reais (opcionais)
- `src/infrastructure/api/repositories/api-interview-repository.ts` — envia `limit` à API (antes recebia no máximo 20)
- `messages/pt.json`, `messages/en.json` — textos do aviso de consentimento (só adições)
- `backend/src/modules/audios/audios.routes.ts`, `backend/src/modules/events/events.routes.ts` — `updatedAt` nas listagens públicas (só leitura, sem alteração de esquema)

**Removido:** `src/app/sitemap.ts` (substituído pelo índice).
**Base de dados:** nenhuma migração, nenhuma alteração de esquema ou dados.

---

## 4. Resultados dos testes

Ambiente: build de produção (`next build` + `next start`) contra uma **API simulada** com dados de teste (a produção e a base de dados não estão acessíveis a partir do ambiente de desenvolvimento).

| Teste | Resultado |
|---|---|
| `tsc --noEmit` frontend e backend | ✅ 0 erros |
| `eslint src` | ✅ 0 erros, 0 avisos |
| `next build` | ✅ concluído |
| `/robots.txt` | ✅ Disallow `/admin`, `/api/`; 3 sitemaps no domínio correcto |
| Cabeçalhos de segurança em `/` | ✅ os 5 presentes; sem `X-Powered-By` |
| `/admin/login` | ✅ `X-Robots-Tag: noindex, nofollow` + `<meta name="robots" content="noindex, nofollow, nocache">` |
| 9 sitemaps | ✅ XML bem formado (parser), `Content-Type: application/xml` |
| Exclusões nos sitemaps | ✅ notícia com noindex, notícia com canonical externo, evento em rascunho e imagem de fallback excluídos |
| Actualização automática | ✅ notícia publicada na API → ainda em cache → `POST /api/revalidate {"tags":["news"]}` (como o admin) → aparece de imediato em `noticias.xml` e `news-sitemap.xml` |
| `/api/revalidate` vindo de outra origem | ✅ 401 |
| 13 páginas de 11 modelos (home, listagens, 4 notícias, entrevista, evento, áudio, galeria, categoria, vídeos, arquivo, contacto) | ✅ 1 `<title>`, 1 meta description, 1 H1, canonical absoluto, OG + Twitter, 0 imagens sem `alt`, JSON-LD válido |
| SEO editorial | ✅ `seoTitle`/`seoDescription` usados; `robotsIndex=false` ⇒ `noindex, follow`; `canonicalUrl` respeitado |
| H1 | ✅ texto com espaços ("Notícia de teste número 1 …"); captura a 1280 px e 390 px sem diferença visual e sem erros de JavaScript |
| GA4 sem ID | ✅ nenhum script e nenhum aviso |

**Não testado aqui (depende da produção):** Rich Results Test e Schema Markup Validator com URLs reais, HTTPS/certificado, redireccionamentos Apache, `Content-Encoding`, tempos de resposta, Core Web Vitals reais.

---

## 5. Pendências e riscos

| # | Item | Notas |
|---|---|---|
| P1 | **Soft 404:** URLs inexistentes (`/noticia/xyz`) mostram a página 404 com `noindex`, mas com estado HTTP **200** | Comportamento já existente: o `src/app/loading.tsx` da raiz inicia o *streaming* antes do `notFound()`. Não é indexado (tem noindex), mas o estado correcto é 404. Corrigir no Lote D, mexendo no ecrã de carregamento — requer a sua validação visual. |
| P2 | **API pública expõe eventos em rascunho:** `GET /api/public/events?includePast=true` e `/api/public/events/<slug>` não filtram `status = DRAFT` | Achado de segurança no backend. Não alterado (o admin pode depender disso para pré-visualizar). Os sitemaps já os excluem. Recomenda-se filtrar no backend. |
| P3 | `package-lock.json` dessincronizado (`npm ci` falha) | `npm install` em produção altera o lockfile. Recomenda-se regenerá-lo num commit próprio e testado. |
| P4 | O sitemap de eventos inclui no máximo os 60 eventos mais recentes | Limite da API pública (`take ≤ 60`). |
| P5 | Entrevistas não têm invalidação de cache no admin | Aparecem nos sitemaps em ≤ 60 s (janela normal da cache). |
| P6 | `NEXT_PUBLIC_*` são lidas no **build** | Alterar o domínio, a verificação GSC/Bing ou o GA4 exige `npm run build` + Restart. |
| P7 | Fotografias de galeria servidas pelo domínio do backend | Válido para sitemaps de imagens; convém verificar a propriedade desse domínio no GSC. |

---

## 6. Recomendações adicionais

1. **Lote D** (próximo): breadcrumbs visíveis, 404 com estado correcto e atalhos, `/mapa-do-site`, paginação rastreável (`?pagina=N`), página `/pesquisa?q=` + `SearchAction`.
2. **Lote F:** painel SEO no formulário de notícia (os campos já existem na BD): contadores 60/155, pré-visualização Google/partilha, `robotsIndex`, indicadores de ALT/descrição em falta.
3. **CSP:** testar uma `Content-Security-Policy-Report-Only` na produção antes de a impor (YouTube/Vimeo, backend de media, JSON-LD inline).
4. **CDN** (ex.: Cloudflare à frente do cPanel) para `/_next/static`, `/images` e `/uploads`.
5. Filtrar `DRAFT` nos endpoints públicos de eventos (P2).
6. Antes de activar o GA4: actualizar a Política de Privacidade (hoje declara que não há cookies de rastreio).

---

## 7. Procedimento seguro de publicação em produção

> Pré-requisito: aprovação desta homologação. Fazer numa janela de baixa actividade editorial.

1. **Backup** (só leitura, sem tocar nos dados):
   ```bash
   cd ~/sala-imprensa && git rev-parse HEAD > ~/deploy-anterior.txt
   cp -a .next/standalone ~/standalone-backup-$(date +%F)
   ```
2. **Variáveis do frontend** (Node Selector → app do frontend), *antes* do build:
   - `NEXT_PUBLIC_SITE_URL=https://www.novo.endiamaimprensa.com`
   - (opcional) `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`
   - **não** definir `NEXT_PUBLIC_GA_MEASUREMENT_ID` até haver autorização e a Política de Privacidade estar actualizada.
3. **Actualizar o código** (após *merge* do ramo para `main`):
   ```bash
   cd ~/sala-imprensa && git pull
   ```
4. **Backend** (pequena alteração de leitura — sem migração):
   ```bash
   cd ~/sala-imprensa/backend && npm install && npm run build
   ```
   Node Selector → Restart da app do backend. **Não** correr `prisma migrate dev`, `db push`, `reset` nem `seed`.
5. **Frontend**:
   ```bash
   cd ~/sala-imprensa && npm install && npm run build
   ```
   Node Selector → Restart da app do frontend.
6. **Verificação pós-deploy** (5 minutos):
   ```bash
   curl -sI https://www.novo.endiamaimprensa.com/ | grep -iE "strict-transport|x-frame|x-content"
   curl -s https://www.novo.endiamaimprensa.com/robots.txt
   curl -s https://www.novo.endiamaimprensa.com/sitemap.xml
   curl -s https://www.novo.endiamaimprensa.com/news-sitemap.xml | head -c 600
   curl -sI https://www.novo.endiamaimprensa.com/admin/login | grep -i x-robots-tag
   ```
   Abrir uma notícia real → ver código-fonte → confirmar `<link rel="canonical" href="https://www.novo.endiamaimprensa.com/noticia/...">` e o bloco `application/ld+json`.
   Publicar ou editar uma notícia no admin → confirmar que aparece em `/sitemaps/noticias.xml`.
7. **Validação externa:** testar 1 notícia, 1 evento e a página `/videos` no [Rich Results Test](https://search.google.com/test/rich-results) e no [Schema Markup Validator](https://validator.schema.org/).
8. **Rollback** (se necessário): `git checkout $(cat ~/deploy-anterior.txt)`, `npm run build` no frontend e no backend, e Restart. Não há alterações de base de dados a reverter.

---

## 8. Configurações externas (fora do código)

**Google Search Console / Bing Webmaster Tools**
1. Criar a propriedade `https://www.novo.endiamaimprensa.com` (prefixo de URL) e, se possível, a propriedade de domínio via DNS.
2. Método "Meta tag": copiar só o valor `content` para `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (no Bing, `NEXT_PUBLIC_BING_SITE_VERIFICATION`), fazer build + Restart e clicar em "Verificar".
3. Submeter **apenas** `https://www.novo.endiamaimprensa.com/sitemap.xml` (o índice inclui os restantes). No Bing é possível importar a partir do GSC.
4. Acompanhar: Páginas → Indexação, Sitemaps, Melhorias (Breadcrumbs, Vídeos), Core Web Vitals, Desempenho (consultas e dispositivos).

**Apache (cPanel) — HTTPS e host único.** Verificar primeiro se já existe (cPanel → Domínios → "Forçar redireccionamento HTTPS"). Só se não existir, acrescentar no **início** do `.htaccess` do domínio, mantendo as regras de proxy existentes:
```apache
RewriteEngine On
# Qualquer pedido sem HTTPS ou sem www → https://www.novo.endiamaimprensa.com (301, um só salto)
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} ^novo\.endiamaimprensa\.com$ [NC]
RewriteRule ^ https://www.novo.endiamaimprensa.com%{REQUEST_URI} [L,R=301]
```
Testar com `curl -sI http://novo.endiamaimprensa.com/` e `curl -sI https://novo.endiamaimprensa.com/` (ambos devem devolver 301 para `https://www.novo.endiamaimprensa.com/`). **Pré-requisito:** o subdomínio `www.novo.endiamaimprensa.com` tem de resolver no DNS e ter certificado SSL válido (cPanel → SSL/TLS Status → AutoSSL).

**Mudança futura de domínio** (por exemplo, quando o portal passar para `endiamaimprensa.com`): alterar `NEXT_PUBLIC_SITE_URL`, fazer build e configurar redireccionamentos 301 do domínio antigo para o novo, URL a URL.
