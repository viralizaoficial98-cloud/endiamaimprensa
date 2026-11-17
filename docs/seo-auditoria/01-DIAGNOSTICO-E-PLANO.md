# Sala de Imprensa ENDIAMA E.P. — Diagnóstico Técnico e Plano de Implementação

**Data:** 2026-11-17 · **Ramo:** `claude/practical-dijkstra-v5sl7o` · **Base:** commit `891c529`
**Referência:** `Technical_Checklist.xlsx` (folha *Tech Checklist*, 9 áreas)

> Etapas 1 (Diagnóstico) e 2 (Planeamento). **Nenhuma alteração de código foi feita ainda.**
> A implementação (Etapa 3) começa só depois de aprovação.

---

## 1. Limitações desta análise (ler primeiro)

| Limitação | Impacto |
|---|---|
| O ambiente de análise **não tem acesso de rede** a `novo.endiamaimprensa.com` (bloqueado pela política de rede do contentor). | Todos os requisitos que dependem do servidor real (HTTPS, certificado, redireccionamentos www/HTTP, Gzip no Apache, tempos de resposta, CDN, GSC/Bing) ficam **Não Verificado**, não "Não Conforme". |
| Sem acesso à base de dados de produção nem a uma cópia. | Não foi possível medir quantas notícias têm ALT, autor, tradução EN, etc. |
| `npm ci` falha: `package-lock.json` **não está sincronizado** com `package.json` (falta `@swc/helpers@0.5.24`). | Instalei com `--no-package-lock` para não alterar o lockfile. Ver risco R4. |
| `next build` precisa da API em execução (`generateStaticParams` consulta o backend). | Build completo será testado com backend local na Etapa 4. |

**Linha de base do código actual:** `tsc --noEmit` (frontend) → 0 erros · `eslint src` → 0 avisos.

---

## 2. Arquitectura encontrada

| Camada | Tecnologia | Observações |
|---|---|---|
| Frontend | Next.js **15.5** (App Router), React 19, `output: "standalone"`, Tailwind 4, framer-motion, Lenis, Swiper, three.js (lazy) | Arquitectura limpa: `domain/` → `application/use-cases` → `infrastructure/api` → `presentation/`. |
| i18n | `next-intl` **por cookie** (`NEXT_LOCALE`), **sem segmento de idioma no URL** | Consequência SEO importante — ver Fase 8. |
| Backend | Express 4 + Prisma 6 + MySQL, Helmet, CORS restrito, compression, rate-limit, JWT + refresh token, Zod, `xss` | Rotas separadas `/api/public/*` e `/api/admin/*`. |
| Imagens | Upload → `sharp` converte para **WebP** (máx. 1920px) + miniatura 400px; frontend usa `next/image` com AVIF/WebP | Bom. |
| Cache | `fetch` com `revalidate: 60` + **tags por recurso**; `/api/revalidate` (POST, mesma origem ou segredo) chamado pelo admin após cada mutação | Bom — reaproveitável para o sitemap. |
| Alojamento | cPanel, 2 apps Node (frontend + backend) atrás de Apache | Ver `DEPLOY_CPANEL.md`. |

### Funcionalidades editoriais que **já existem** (não serão recriadas)
- Modelo `News` já tem campos SEO: `seoTitle`, `seoDescription`, `seoKeywords`, `canonicalUrl`, `ogTitle`, `ogDescription`, `ogImage`, `robotsIndex`, `robotsFollow` — e o backend já os grava e devolve na API pública. **O frontend ignora-os** (o mapper descarta-os).
- `coverImageAlt` (PT/EN) obrigatório antes do upload da capa; `altText` nas imagens de galeria; ALT próprio em blocos de imagem.
- Slug único gerado automaticamente (`ensureUniqueSlug`).
- Autor real (`User`) ligado a cada notícia; `publishedAt`, `updatedAt`, agendamento (`scheduledAt`), versões (`NewsVersion`), auditoria.
- Notícias relacionadas e anterior/seguinte; contagem de leituras.
- Optimização automática das imagens carregadas (sharp → WebP).

---

## 3. Problemas críticos encontrados

| # | Problema | Evidência | Gravidade |
|---|---|---|---|
| **C1** | **Domínio canónico errado.** `metadataBase`, `robots.txt` e `sitemap.xml` usam `https://imprensa.endiama.co.ao`, mas o portal está publicado em `novo.endiamaimprensa.com`. Todos os canonicals, URLs do sitemap e de OG apontam para um domínio diferente. | `src/app/layout.tsx:24`, `src/app/robots.ts:3`, `src/app/sitemap.ts:5` | **Crítica** |
| **C2** | **Hreflang inválido.** A notícia declara `pt` e `en` para **o mesmo URL**; como o idioma depende de cookie, o Google só vê PT. | `src/app/(public)/noticia/[slug]/page.tsx:42-44` | Alta |
| **C3** | **Área administrativa indexável.** Sem `noindex` nem `Disallow` para `/admin`. | `src/app/robots.ts`, `src/app/admin/**` | Alta |
| **C4** | **H1 sem espaços entre palavras para crawlers.** `AnimatedTitle` separa palavras só com margem CSS; o texto no HTML fica "ENDIAMAanunciaresultados…". Afecta o H1 de todas as notícias e do banner. | `src/presentation/components/ui/animated-title.tsx` | Alta |
| **C5** | Sitemap incompleto: só home, galeria, vídeos, categorias e notícias. Faltam entrevistas, eventos, áudios, galerias individuais, páginas de listagem e institucionais; sem sitemap de notícias/imagens/vídeos. | `src/app/sitemap.ts` | Alta |
| **C6** | JSON-LD só nas notícias, com `logo` relativo (inválido), autor sempre "Organization" mesmo havendo autor real, sem `mainEntityOfPage`. Sem `Organization`/`WebSite`/`BreadcrumbList`/`VideoObject`. | `noticia/[slug]/page.tsx:73-87` | Alta |
| **C7** | Nenhuma página tem `canonical` excepto notícias; listagens e categorias sem OG/Twitter próprios. | todos os `page.tsx` públicos | Alta |
| **C8** | Sem cabeçalhos de segurança no frontend Next (HSTS, X-Frame-Options, Referrer-Policy, etc.). O backend tem Helmet. | `next.config.ts` (sem `headers()`) | Média |

---

## 4. Matriz de conformidade — Technical Checklist

Estados: **Conforme · Parcial · Não Conforme · Não Aplicável · Não Verificado**
Prioridade = a da checklist (High/Moderate/Low) ajustada ao impacto real encontrado.

### 4.1 Crawling & Indexing

| Requisito | Estado Actual | Evidência | Acção Necessária | Prioridade | Resultado Esperado |
|---|---|---|---|---|---|
| robots.txt em `/robots.txt` | Conforme | `src/app/robots.ts` (rota de metadados Next) | — | Baixa | — |
| Formato correcto, sem BOM | Conforme | Gerado pelo Next (UTF-8 sem BOM) | Validar em produção | Baixa | — |
| Sintaxe correcta | Parcial | Sintaxe válida, mas aponta para domínio errado (C1) | Domínio configurável por env | Alta | robots válido no domínio real |
| JS/CSS não bloqueados | Conforme | `allow: /` | Manter `/_next/` permitido | Baixa | — |
| Nenhuma página relevante bloqueada | Conforme | Nada bloqueado | — | Baixa | — |
| Sitemap referenciado no robots | Parcial | Referência existe mas com domínio errado | Listar todos os sitemaps do domínio real | Alta | — |
| Domínios no robots tester | Não Verificado | Acção externa (GSC) | Procedimento em doc | Alta | — |
| Sitemap de páginas | Parcial | Só parte das rotas (C5) | Sitemap completo | Alta | Todas as páginas públicas indexáveis |
| Sitemap de imagens | Não Conforme | Inexistente | `image:image` por notícia/galeria | Alta | — |
| Sitemap de vídeos | Não Conforme | Inexistente; vídeos não têm página própria (só `/videos`) | Sitemap de vídeo para vídeos com URL de página; avaliar viabilidade | Alta | — |
| Sitemap de notícias (Google News) | Não Conforme | Inexistente | `news-sitemap.xml` com notícias das últimas 48h (máx. 1000) | Alta | — |
| Formato correcto | Conforme | Gerado pelo Next | — | Baixa | — |
| Sitemaps submetidos GSC/Bing | Não Verificado | Acção externa | Procedimento + meta de verificação por env | Alta | — |
| `lastmod` em cada URL | Parcial | Só notícias | `lastmod` real em todos os conteúdos | Baixa | — |
| Actualizado com páginas novas/removidas | Parcial | Gerado dinamicamente, mas sem revalidação por tag | Ligar ao `/api/revalidate` existente | Baixa | Actualização imediata após publicação |
| Sem 3xx / 4xx / noindex / canonicalizadas no sitemap | Parcial | Domínio errado ⇒ todos os URLs do sitemap são de outro host; `robotsIndex=false` não é filtrado | Filtrar `robotsIndex=false` e `canonicalUrl` externo | Alta | — |
| < 50 000 URLs / sitemap index | Conforme | Volume actual muito abaixo | Usar índice de sitemaps para os novos tipos | Baixa | — |
| Conteúdo/links sem depender de JS | Parcial | Páginas renderizadas no servidor ✔; **paginação de `/noticias` e do arquivo é só por botão "Carregar mais" em JS** | Links de paginação rastreáveis (`?pagina=N`) sem mudar o layout | Alta | — |
| Cache Google / render no GSC | Não Verificado | Requer GSC | — | Baixa | — |
| Sem redireccionamentos por IP/cookie | Conforme | Idioma por cookie **não redirecciona**; PT por omissão | — | Alta | — |
| Vídeos incorporados vs alojados | Parcial | Suporta UPLOAD/YouTube/Vimeo | Documentar; VideoObject para ambos | Alta | — |
| Tecnologia responsiva / mobile-friendly / viewport | Conforme | Tailwind responsivo; viewport por omissão do Next | Auditoria visual em 4 larguras (Etapa 4) | Alta | — |
| Mobile-first | Conforme | Classes base + `sm:`/`lg:` | — | Alta | — |
| Navegação mobile/desktop sem quebras | Não Verificado | Requer teste visual | Playwright em 375/768/1280 | Alta | — |
| Imagens servidas por dispositivo | Conforme | `next/image` com `sizes` + AVIF/WebP | Rever `sizes` nos cartões | Alta | — |
| HTTPS / certificado / links internos HTTPS | Não Verificado | Sem acesso à produção | Checklist pós-deploy | Baixa | — |
| Indexação (GSC estável, excluídas) | Não Verificado | Requer GSC | — | Alta | — |
| Páginas importantes sem `noindex` indevido | Conforme | Nenhum `noindex` no código | Adicionar `noindex` **só** ao admin | Baixa | — |

### 4.2 Information Architecture

| Requisito | Estado Actual | Evidência | Acção Necessária | Prioridade | Resultado Esperado |
|---|---|---|---|---|---|
| URLs amigáveis e hierárquicas | Conforme | `/noticia/<slug>`, `/categoria/<slug>`, `/entrevistas/<slug>`… | Preservar | Baixa | — |
| Parâmetros com canonical | Parcial | Sem canonical nas listagens | Canonical em todas as páginas | Alta | — |
| Hífens, sem espaços, caracteres especiais | Conforme | `slugify` no backend | Validar slug no admin | Alta | — |
| Links no HTML fonte | Parcial | Header/footer/cartões em `<Link>` SSR ✔; paginação só JS ✘ | Ver paginação | Alta | — |
| Links relativos vs absolutos consistentes | Conforme | Internos relativos | — | Alta | — |
| Sem cadeias de redirect / 3xx internos | Conforme (código) | `/admin` → `/admin/dashboard` apenas | Validar em produção | Alta | — |
| Sem links quebrados | Não Verificado | Requer crawl | Verificador de links no admin (Fase 5 editorial) | Alta | — |
| Página 404 personalizada | Parcial | Existe, mas só com "Voltar ao início", sem layout público | 404 com header/footer, pesquisa e atalhos para secções | Alta | Retém o utilizador |
| Sitemap HTML | Não Conforme | Inexistente | Página `/mapa-do-site` | Alta | — |

### 4.3 On-page

| Requisito | Estado Actual | Evidência | Acção Necessária | Prioridade | Resultado Esperado |
|---|---|---|---|---|---|
| Um `<title>` por página | Conforme | Metadata API | — | Alta | — |
| Uma meta description por página | Parcial | Home e institucionais OK; algumas listagens genéricas; `seoDescription` ignorado | Usar `seoTitle/seoDescription` com fallback | Alta | — |
| Um H1 por página, não vazio | Parcial | Presente em todas; **C4** (palavras coladas) | Corrigir `AnimatedTitle` | Alta | — |
| Hierarquia H1→H2→H3 | Parcial | Home salta H1→H3 em algumas secções | Ajustar níveis sem mudar estilos | Alta | — |
| GA / GTM | Não Conforme | Inexistente | Componente opcional por env + consentimento | Baixa | Desligado até autorização |
| Google Search Console | Não Verificado | — | Meta de verificação por env (GSC + Bing) | Baixa | — |
| ALT nas imagens | Parcial | ALT obrigatório na capa; categoria usa nome; fallbacks OK | Rever imagens decorativas / galerias | Alta | — |

### 4.4 Structured Data

| Requisito | Estado Actual | Evidência | Acção Necessária | Prioridade | Resultado Esperado |
|---|---|---|---|---|---|
| Templates com JSON-LD | Parcial | Só notícias (C6) | JSON-LD por tipo de página | Alta | — |
| Validação correcta | Não Conforme | `logo` relativo ⇒ inválido | URLs absolutos | Alta | Rich Results Test sem erros |
| Servido no HTML (não diferido) | Conforme | `<script>` em Server Component | Manter | Alta | — |
| Organization / WebSite | Não Conforme | Inexistente | No layout público | Alta | — |
| SearchAction | Não Conforme | A pesquisa é modal JS, sem URL | Criar `/pesquisa?q=` SSR e `SearchAction` | Alta | — |
| Product schema | Não Aplicável | Não é e-commerce | — | — | — |
| HowTo | Não Aplicável | Sem conteúdo do tipo; Google descontinuou o rich result | — | — | — |
| FAQPage | Não Aplicável | Sem FAQ editorial real; não inventar | — | — | — |
| VideoObject | Não Conforme | Inexistente | Em `/videos` e blocos de vídeo de notícias | Alta | — |
| Open Graph | Parcial | Global + notícia/entrevista/evento/áudio; sem `og:url`, listagens herdam o da home | OG por página | Baixa | — |
| Twitter Cards | Parcial | Global + notícias | Por página, com imagem | Alta | — |
| Breadcrumbs | Não Conforme | Inexistentes | Breadcrumb visível + `BreadcrumbList` | Baixa | — |

### 4.5 Content Duplication

| Requisito | Estado Actual | Evidência | Acção Necessária | Prioridade | Resultado Esperado |
|---|---|---|---|---|---|
| www ↔ não-www 301 | Não Verificado | Configuração Apache | Procedimento `.htaccess` em doc | Alta | — |
| HTTP → HTTPS 301 | Não Verificado | Configuração Apache | Idem | Alta | — |
| Trailing slash consistente | Conforme | Next redirecciona `/x/` → `/x` (308) por omissão | — | Alta | — |
| Titles/descriptions únicos | Parcial | Listagens OK; categorias com fallback genérico | Fallbacks únicos por página | Alta | — |
| Limites mobile (≈60 / ≈155 caracteres) | Parcial | Sem controlo | Truncagem segura + contador no admin | Alta | — |
| Páginas filtradas/paginadas únicas | Não Conforme | Filtros só em estado JS | `?pagina=N` com title/H1 "— Página N" | Alta | — |
| rel prev/next | Não Conforme | Inexistente | Adicionar (Google ignora, Bing usa) | Baixa | — |
| Canonical em todas as páginas | Não Conforme | Só notícias | Canonical absoluto em todas | Alta | — |
| Canonical sem 3xx/4xx/noindex | Parcial | Domínio errado (C1) | Domínio correcto | Alta | — |

### 4.6 Speed / Performance

| Requisito | Estado Actual | Evidência | Acção Necessária | Prioridade | Resultado Esperado |
|---|---|---|---|---|---|
| Sem problemas de resposta do servidor | Não Verificado | Sem acesso | Medir após deploy | Alta | — |
| Sem long tasks | Parcial | three.js lazy ✔; framer-motion por letra no H1 gera muitos nós | Reduzir custo do `AnimatedTitle` | Alta | — |
| Compressão textual | Parcial | Backend `compression()` ✔; Next standalone comprime por omissão ✔; Apache não verificado | Verificar `Content-Encoding` | Baixa | — |
| Cache de estáticos no browser | Conforme | `/_next/static` imutável; `/uploads` 30d | Cache para `/images/*` | Alta | — |
| Cache server-side | Conforme | ISR 60s + tags | — | Alta | — |
| Minificação | Conforme | Build de produção Next | — | Baixa | — |
| CDN / servidor regional | Não Verificado | Decisão de infraestrutura | Recomendação | Baixa | — |
| Terceiros limitados | Conforme | Fontes via `next/font` (self-hosted); sem scripts de terceiros | — | Alta | — |
| JS/CSS não críticos diferidos | Parcial | three.js `dynamic` ✔ | Rever imports pesados | Alta | — |
| Imagens optimizadas / formato / lazy / tamanho | Conforme | sharp WebP + `next/image` lazy por omissão + `priority` no 1.º slide | Pequenos ajustes de `sizes` | Alta | — |
| Ícones SVG | Conforme | react-icons/lucide (SVG) | — | Alta | — |

### 4.7 Video

| Requisito | Estado Actual | Evidência | Acção Necessária | Prioridade | Resultado Esperado |
|---|---|---|---|---|---|
| Video schema | Não Conforme | Inexistente | VideoObject | Alta | — |
| Legendas/transcrição em HTML | Não Conforme | Só `description` | Mostrar descrição em HTML; campo de transcrição = evolução futura | Baixa | — |

### 4.8 International

| Requisito | Estado Actual | Evidência | Acção Necessária | Prioridade | Resultado Esperado |
|---|---|---|---|---|---|
| Sem canibalização entre países | Conforme (por agora) | Só um URL por conteúdo | — | Alta | — |
| TLD/subpasta por idioma | Não Conforme | Idioma por cookie, sem URL próprio | **Decisão necessária** (ver §6, D2) | Alta | — |
| Nomes de pastas localizados | Não Aplicável | Só PT é indexável | — | — | — |
| `lang` no HTML | Parcial | `pt-AO` / `en` conforme cookie ✔ | Manter | Alta | — |
| Conteúdo localizado | Parcial | Fallback para PT quando falta tradução (correcto, sem tradução automática) | — | Alta | — |
| Hreflang em todas as páginas / sitemap / recíproco | Não Conforme | Hreflang **incorrecto** (C2) | Remover já; implementar só com URLs EN reais | Baixa | — |

---

## 5. Plano de implementação proposto

Incremental, um commit por módulo, sem migrações de base de dados destrutivas, sem mexer em credenciais nem na configuração Apache.

### Lote A — Fundações SEO (só frontend, risco baixo) — *proponho começar por aqui*
1. **`src/lib/site.ts`**: `SITE_URL` vindo de `NEXT_PUBLIC_SITE_URL` (com valor por omissão a decidir — D1), nome, logótipo, helpers `absoluteUrl()`, truncagem de title/description.
2. Corrigir `metadataBase`, `robots.txt` (Disallow `/admin` e `/api`, lista de sitemaps) — C1, C3.
3. `noindex, nofollow` em todo o `/admin` via `metadata.robots` no layout admin — C3.
4. Corrigir `AnimatedTitle`: espaço real entre palavras (visual inalterado) — C4.
5. Helper `buildPageMetadata()` → canonical absoluto, OG (`og:url`, imagem), Twitter Card em **todas** as páginas públicas; notícias passam a usar `seoTitle`/`seoDescription`/`ogImage`/`robotsIndex`/`canonicalUrl` já existentes na BD, com fallback para título/resumo — C7.
6. Remover o hreflang inválido — C2.
7. Cabeçalhos de segurança no Next (`headers()`): HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`. CSP **apenas em modo Report-Only** primeiro — C8.
8. Meta de verificação GSC/Bing por variáveis de ambiente (vazias = nada é emitido).

### Lote B — Sitemaps
1. `sitemap.xml` como **índice** + sitemaps por tipo: páginas, notícias (com `image:image`), entrevistas, eventos, galerias (com imagens), áudios, categorias.
2. `news-sitemap.xml` (Google News: últimas 48h, máx. 1000, `news:publication` / `news:publication_date` / `news:title`, idioma `pt`).
3. `video-sitemap.xml` para vídeos com página própria (ver Lote D).
4. Excluir `robotsIndex=false` e notícias com `canonicalUrl` externo; `lastmod` real.
5. Revalidação automática: os sitemaps usam as mesmas tags de cache (`news`, `videos`…) que o admin já invalida em `/api/revalidate` ⇒ actualização imediata após publicar/editar/remover.

### Lote C — Dados estruturados
`Organization` + `WebSite` (+ `SearchAction` quando existir `/pesquisa`) no layout público; `NewsArticle` corrigido (autor real `Person` quando existir, `mainEntityOfPage`, `articleSection`, logo absoluto, imagens absolutas); `BreadcrumbList`; `Event`; `VideoObject`; `ImageGallery`/`ImageObject` nas galerias; `CollectionPage` nas listagens. Validação automática por script (parse + campos obrigatórios) e manual no Rich Results Test após deploy.

### Lote D — Navegação e arquitectura de informação
Breadcrumbs visíveis (estilo discreto, mesma identidade); 404 com layout público e atalhos; `/mapa-do-site` (sitemap HTML); paginação rastreável `?pagina=N` em `/noticias` e `/arquivo-historico` mantendo o botão "Carregar mais" (progressive enhancement) + `rel=prev/next`; página `/pesquisa?q=` renderizada no servidor (o modal actual mantém-se e passa a ter "ver todos os resultados"); avaliar página `/videos/<slug>`.

### Lote E — Performance, UX e acessibilidade
Cache-Control para `/images/*`; revisão de `sizes`; reduzir trabalho do `AnimatedTitle` com `prefers-reduced-motion`; hierarquia de headings da home; foco visível e áreas de toque ≥ 44px; teste Playwright em 375/768/1024/1440 (retrato e paisagem) com capturas.

### Lote F — Área Administrativa (sem a reconstruir)
Painel "SEO" no formulário de notícia existente: `seoTitle`/`seoDescription` com contadores, slug editável com validação, pré-visualização Google + cartão de partilha, `robotsIndex`; validação dos campos essenciais; indicadores simples no dashboard (notícias sem ALT, sem descrição SEO, sem tradução EN). **Redireccionamentos 301 quando o slug muda** exige uma tabela nova (`SlugRedirect`) — migração **aditiva** (só `CREATE TABLE`), proposta separadamente para aprovação. Verificador de links quebrados e GA4 (com consentimento) ficam para depois da aprovação.

### Fora do código (procedimentos que deixarei documentados)
Redireccionamentos HTTP→HTTPS e www no Apache, submissão de sitemaps no GSC/Bing, GA4.

---

## 6. Decisões necessárias antes de implementar

| # | Decisão | Opções |
|---|---|---|
| **D1** | Qual é o **domínio canónico oficial** do portal? | `https://novo.endiamaimprensa.com` (actual) · `https://endiamaimprensa.com` (quando o novo portal substituir o WordPress) · `https://imprensa.endiama.co.ao` (o que está no código) · outro. Será sempre configurável por `NEXT_PUBLIC_SITE_URL`; a decisão define o valor por omissão. |
| **D2** | Versão inglesa indexável? | (a) **Manter cookie** — só PT é indexado, sem hreflang (sem risco, recomendado agora); (b) criar URLs `/en/...` com hreflang — mudança estrutural maior, para fase posterior. |
| **D3** | Migração aditiva `SlugRedirect` para 301 em mudanças de slug? | Sim / Não por agora. |
| **D4** | GA4 | Preparar desligado (só activa com ID em env + banner de consentimento) / não preparar. |

## 7. Riscos identificados

| # | Risco | Mitigação |
|---|---|---|
| R1 | Mudar o domínio canónico sem redireccionar o antigo divide sinais | Só um canónico, definido por env; 301 do domínio antigo no Apache |
| R2 | Sitemaps dinâmicos aumentam carga na API | Cache ISR + tags; limites de 50 000 |
| R3 | CSP estrita pode partir YouTube/Vimeo/three.js | Começar em Report-Only |
| R4 | `package-lock.json` dessincronizado — `npm install` em produção altera o lockfile e pode instalar versões diferentes | Regenerar o lockfile num commit próprio, testado |
| R5 | `next build` depende da API (`generateStaticParams`) — se a API falhar no build, o build falha | Tornar `generateStaticParams` tolerante a falhas |
