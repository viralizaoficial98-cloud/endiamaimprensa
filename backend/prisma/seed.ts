import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FRONTEND_PHOTOS_DIR = path.join(__dirname, "..", "..", "public", "images", "photos");
const FRONTEND_LOGO = path.join(__dirname, "..", "..", "public", "images", "logotipo_endiama.png");
const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000";

/** No default/hardcoded passwords — each environment must supply its own via
 * env vars, or seeding fails loudly instead of silently creating accounts
 * with a known, guessable password. */
function requiredSeedPassword(envVar: string, accountLabel: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${envVar} em falta. Defina-a antes de executar o seed (ex.: ${envVar}="UmaPasswordForteUnica!") para a conta de ${accountLabel}. Por segurança, o seed não tem passwords por omissão.`
    );
  }
  return value;
}

/** Copies a real photo already present in the frontend's public folder into the
 * backend's own uploads directory, so seed data never relies on broken/external URLs. */
function seedImage(filename: string, folder: string, sourceOverride?: string): string {
  const destDir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, filename);
  const source = sourceOverride ?? path.join(FRONTEND_PHOTOS_DIR, filename);
  if (!fs.existsSync(dest) && fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
  }
  return `${API_BASE_URL}/uploads/${folder}/${filename}`;
}

const PERMISSIONS: Array<{ code: string; name: string; module: string; description: string }> = [
  { code: "users.create", name: "Criar utilizadores", module: "users", description: "Permite criar novos utilizadores." },
  { code: "users.read", name: "Consultar utilizadores", module: "users", description: "Permite consultar utilizadores." },
  { code: "users.update", name: "Editar utilizadores", module: "users", description: "Permite editar utilizadores e perfis." },
  { code: "users.delete", name: "Remover utilizadores", module: "users", description: "Permite remover utilizadores." },
  { code: "news.create", name: "Criar notícias", module: "news", description: "Permite criar notícias em rascunho." },
  { code: "news.read", name: "Consultar notícias", module: "news", description: "Permite consultar notícias no painel." },
  { code: "news.update", name: "Editar notícias", module: "news", description: "Permite editar notícias existentes." },
  { code: "news.delete", name: "Remover notícias", module: "news", description: "Permite remover notícias (soft delete)." },
  { code: "news.publish", name: "Publicar notícias", module: "news", description: "Permite publicar, despublicar e arquivar notícias." },
  { code: "news.approve", name: "Aprovar notícias", module: "news", description: "Permite aprovar ou rejeitar notícias em revisão." },
  { code: "news.schedule", name: "Agendar notícias", module: "news", description: "Permite agendar a publicação de notícias." },
  { code: "categories.manage", name: "Gerir categorias", module: "categories", description: "CRUD completo de categorias." },
  { code: "banners.manage", name: "Gerir banners", module: "banners", description: "CRUD completo do banner principal/slideshow." },
  { code: "latestnews.manage", name: "Gerir Últimas Notícias", module: "latestnews", description: "Gerir a notícia principal, secundárias e Última Hora da homepage." },
  { code: "videos.manage", name: "Gerir vídeos", module: "videos", description: "CRUD completo de vídeos." },
  { code: "audios.manage", name: "Gerir áudios", module: "audios", description: "CRUD completo de áudios institucionais." },
  { code: "podcasts.manage", name: "Gerir podcasts", module: "podcasts", description: "CRUD completo de podcasts e episódios." },
  { code: "galleries.manage", name: "Gerir galerias", module: "galleries", description: "CRUD completo de galerias de imagens." },
  { code: "events.manage", name: "Gerir eventos", module: "events", description: "CRUD completo de eventos." },
  { code: "documents.manage", name: "Gerir documentos", module: "documents", description: "CRUD completo de documentos." },
  { code: "clipping.manage", name: "Gerir clipping", module: "clipping", description: "CRUD completo de clipping/monitorização de media." },
  { code: "interviews.manage", name: "Gerir entrevistas", module: "interviews", description: "CRUD completo de entrevistas." },
  { code: "comments.moderate", name: "Moderar comentários", module: "comments", description: "Aprovar, rejeitar e remover comentários." },
  { code: "settings.manage", name: "Gerir configurações", module: "settings", description: "Gerir configurações, menus, parceiros, publicidade e redes sociais." },
  { code: "reports.view", name: "Ver relatórios", module: "reports", description: "Consultar estatísticas e dashboard." },
  { code: "audit.view", name: "Ver auditoria", module: "audit", description: "Consultar logs de auditoria." },
  { code: "uploads.create", name: "Carregar ficheiros", module: "uploads", description: "Carregar imagens, vídeos, áudios e documentos." },
  { code: "uploads.delete", name: "Remover ficheiros", module: "uploads", description: "Remover ficheiros carregados." },
];

const ALL_CODES = PERMISSIONS.map((p) => p.code);

const ROLES: Array<{ name: string; description: string; isSystem: boolean; permissions: string[] }> = [
  { name: "Super Administrador", description: "Acesso total e irrestrito ao sistema.", isSystem: true, permissions: ALL_CODES },
  { name: "Administrador", description: "Gestão administrativa completa do portal.", isSystem: true, permissions: ALL_CODES },
  {
    name: "Editor-Chefe",
    description: "Aprova, publica e agenda conteúdos editoriais.",
    isSystem: true,
    permissions: [
      "news.read",
      "news.update",
      "news.approve",
      "news.publish",
      "news.schedule",
      "categories.manage",
      "banners.manage",
      "latestnews.manage",
      "comments.moderate",
      "reports.view",
      "videos.manage",
      "podcasts.manage",
      "audios.manage",
      "galleries.manage",
      "interviews.manage",
      "events.manage",
      "documents.manage",
      "clipping.manage",
      "uploads.create",
    ],
  },
  {
    name: "Jornalista",
    description: "Cria e edita rascunhos de notícias.",
    isSystem: true,
    permissions: ["news.create", "news.read", "news.update", "uploads.create"],
  },
  {
    name: "Revisor",
    description: "Analisa e aprova notícias submetidas para revisão.",
    isSystem: true,
    permissions: ["news.read", "news.approve"],
  },
  {
    name: "Operador Multimédia",
    description: "Gere vídeos, podcasts e galerias.",
    isSystem: true,
    permissions: ["news.read", "videos.manage", "podcasts.manage", "audios.manage", "galleries.manage", "uploads.create", "uploads.delete"],
  },
  {
    name: "Gestor de Eventos",
    description: "Gere eventos e documentos institucionais.",
    isSystem: true,
    permissions: ["news.read", "events.manage", "documents.manage", "uploads.create"],
  },
  {
    name: "Utilizador de Consulta",
    description: "Acesso apenas de leitura ao painel.",
    isSystem: true,
    permissions: ["news.read", "reports.view"],
  },
];

// Lista oficial de categorias do Portal de Notícias (revisão funcional 2026).
const CATEGORIES: Array<{ name: string; slug: string; description: string; color: string }> = [
  { name: "Institucional", slug: "institucional", description: "Comunicados e vida institucional da ENDIAMA.", color: "#2FA968" },
  { name: "Operações Mineiras", slug: "operacoes-mineiras", description: "Operações e produção mineira do grupo ENDIAMA.", color: "#16874C" },
  { name: "Comercialização", slug: "comercializacao", description: "Comercialização e mercado de diamantes angolanos.", color: "#C9A24B" },
  { name: "Sustentabilidade", slug: "sustentabilidade", description: "Ambiente e mineração responsável.", color: "#1B8A4C" },
  { name: "Responsabilidade Social", slug: "responsabilidade-social", description: "Impacto social nas comunidades mineiras.", color: "#2FA968" },
  { name: "Grupo ENDIAMA", slug: "grupo-endiama", description: "Empresas e participadas do Grupo ENDIAMA.", color: "#0E6B3E" },
  { name: "Cultura", slug: "cultura", description: "Cultura e sociedade angolana.", color: "#2FA968" },
  { name: "Multimédia", slug: "multimedia", description: "Conteúdos multimédia da ENDIAMA E.P.", color: "#16874C" },
  { name: "Desporto", slug: "desporto", description: "Desporto e patrocínios da ENDIAMA.", color: "#0E6B3E" },
  { name: "Lapidação", slug: "lapidacao", description: "Lapidação e valorização do diamante angolano.", color: "#C9A24B" },
  { name: "Tecnologia", slug: "tecnologia", description: "Inovação aplicada à indústria extractiva.", color: "#16874C" },
  { name: "Internacional", slug: "internacional", description: "Notícias internacionais do sector diamantífero.", color: "#C9A24B" },
  { name: "Ouro", slug: "ouro", description: "Exploração e mercado do ouro.", color: "#C9A24B" },
  { name: "Diamante", slug: "diamante", description: "Notícias dedicadas ao diamante angolano.", color: "#0E6B3E" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedPermissionsAndRoles() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code: permission.code }, update: permission, create: permission });
  }

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isSystem: role.isSystem,
        permissions: { set: role.permissions.map((code) => ({ code })) },
      },
      create: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: { connect: role.permissions.map((code) => ({ code })) },
      },
    });
  }
  console.log(`✔ ${PERMISSIONS.length} permissões e ${ROLES.length} perfis criados/actualizados.`);
}

async function seedSuperAdmin() {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: "Super Administrador" } });
  const passwordHash = await bcrypt.hash(requiredSeedPassword("SEED_ADMIN_PASSWORD", "Administrador"), 12);

  await prisma.user.upsert({
    where: { email: "admin@endiama.co.ao" },
    update: {},
    create: {
      name: "Administrador ENDIAMA",
      email: "admin@endiama.co.ao",
      username: "admin",
      passwordHash,
      roleId: role.id,
      status: "ACTIVE",
      mustChangePassword: true,
      position: "Administrador de Sistema",
      department: "Tecnologias de Informação",
    },
  });

  // A couple of extra demo accounts covering the editorial workflow end to end.
  const journalistRole = await prisma.role.findUniqueOrThrow({ where: { name: "Jornalista" } });
  const editorRole = await prisma.role.findUniqueOrThrow({ where: { name: "Editor-Chefe" } });

  const journalist = await prisma.user.upsert({
    where: { email: "jornalista@endiama.co.ao" },
    update: {},
    create: {
      name: "Manuela Cardoso",
      email: "jornalista@endiama.co.ao",
      username: "mcardoso",
      passwordHash: await bcrypt.hash(requiredSeedPassword("SEED_JOURNALIST_PASSWORD", "Jornalista"), 12),
      roleId: journalistRole.id,
      status: "ACTIVE",
      mustChangePassword: true,
      position: "Jornalista",
      department: "Redacção",
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: "editor@endiama.co.ao" },
    update: {},
    create: {
      name: "João Baptista",
      email: "editor@endiama.co.ao",
      username: "jbaptista",
      passwordHash: await bcrypt.hash(requiredSeedPassword("SEED_EDITOR_PASSWORD", "Editor-Chefe"), 12),
      roleId: editorRole.id,
      status: "ACTIVE",
      mustChangePassword: true,
      position: "Editor-Chefe",
      department: "Redacção",
    },
  });

  console.log("✔ Super Administrador e utilizadores de demonstração criados.");
  return { journalist, editor };
}

async function seedCategories() {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const { slug, ...category } = CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug },
      update: category,
      create: { ...category, slug, order: i, status: "ACTIVE" },
    });
  }
  console.log(`✔ ${CATEGORIES.length} categorias criadas/actualizadas.`);
  return prisma.category.findMany();
}

async function seedSettings() {
  const settings: Array<{ key: string; value: string; group: "GENERAL" | "SEO" | "SOCIAL" | "PORTAL"; description: string }> = [
    { key: "site_name", value: "ENDIAMA Notícias", group: "GENERAL", description: "Nome do portal." },
    { key: "site_tagline", value: "Sala de Imprensa da ENDIAMA E.P.", group: "GENERAL", description: "Descrição curta do portal." },
    { key: "contact_email", value: "imprensa@endiama.co.ao", group: "GENERAL", description: "Email de contacto institucional." },
    { key: "contact_phone", value: "+244 222 000 000", group: "GENERAL", description: "Telefone de contacto." },
    { key: "address", value: "Rua Rainha Ginga, Luanda, Angola", group: "GENERAL", description: "Morada institucional." },
    { key: "seo_default_title", value: "ENDIAMA Notícias — Sala de Imprensa da ENDIAMA E.P.", group: "SEO", description: "Título SEO por omissão." },
    { key: "seo_default_description", value: "Portal de notícias oficial da ENDIAMA E.P.", group: "SEO", description: "Descrição SEO por omissão." },
  ];
  for (const setting of settings) {
    await prisma.setting.upsert({ where: { key: setting.key }, update: setting, create: { ...setting, type: "STRING" } });
  }
  console.log(`✔ ${settings.length} configurações criadas/actualizadas.`);
}

async function seedSocialLinks() {
  // Apenas as redes oficialmente aprovadas e efectivamente utilizadas pela ENDIAMA.
  const links: Array<{ platform: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "WHATSAPP"; url: string; order: number }> = [
    { platform: "FACEBOOK", url: "https://www.facebook.com/endiama.ep", order: 0 },
    { platform: "INSTAGRAM", url: "https://www.instagram.com/endiama_ep/", order: 1 },
    { platform: "LINKEDIN", url: "https://www.linkedin.com/company/endiama-e-p-/", order: 2 },
    { platform: "WHATSAPP", url: "https://whatsapp.com/channel/0029Vacd3e8JkK73x88maR3N", order: 3 },
  ];
  for (const link of links) {
    const existing = await prisma.socialLink.findFirst({ where: { platform: link.platform } });
    if (existing) {
      await prisma.socialLink.update({ where: { id: existing.id }, data: { url: link.url, order: link.order, isActive: true } });
    } else {
      await prisma.socialLink.create({ data: link });
    }
  }
  // Redes não aprovadas/usadas — desactivar em vez de apagar (preserva histórico).
  await prisma.socialLink.updateMany({ where: { platform: { in: ["YOUTUBE", "TWITTER", "TIKTOK"] } }, data: { isActive: false } });
  console.log(`✔ Redes sociais criadas/actualizadas.`);
}

async function seedMenu() {
  const menu = await prisma.menu.upsert({
    where: { slug: "menu-principal" },
    update: {},
    create: { name: "Menu Principal", slug: "menu-principal" },
  });
  const items = [
    { label: "Início", url: "/", order: 0 },
    { label: "Vídeos", url: "/videos", order: 1 },
    { label: "Galeria", url: "/galeria", order: 2 },
    { label: "Podcasts", url: "/#podcasts", order: 3 },
    { label: "Entrevistas", url: "/#entrevistas", order: 4 },
    { label: "Eventos", url: "/#eventos", order: 5 },
  ];
  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({ where: { menuId: menu.id, label: item.label } });
    if (!existing) await prisma.menuItem.create({ data: { ...item, menuId: menu.id } });
  }
  console.log("✔ Menu principal criado/actualizado.");
}

async function seedPartners() {
  const logoUrl = seedImage("logotipo_endiama.png", "partners", FRONTEND_LOGO);
  const partners = [
    { name: "SODIAM", logo: logoUrl, order: 0 },
    { name: "Sociedade Mineira de Catoca", logo: logoUrl, order: 1 },
    { name: "Ministério dos Recursos Minerais e Petróleos", logo: logoUrl, order: 2 },
  ];
  for (const partner of partners) {
    const existing = await prisma.partner.findFirst({ where: { name: partner.name } });
    if (!existing) await prisma.partner.create({ data: { ...partner, status: "ACTIVE" } });
  }
  console.log("✔ Parceiros de demonstração criados.");
}

interface SeedNewsInput {
  title: string;
  excerpt: string;
  categoryName: string;
  photo: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
  daysAgo: number;
}

async function seedNews(categories: Array<{ id: string; name: string }>, authorId: string, reviewerId: string) {
  const findCategory = (name: string) => categories.find((c) => c.name === name)!.id;

  const items: SeedNewsInput[] = [
    { title: "ENDIAMA regista produção recorde de 12 milhões de quilates em 2025", excerpt: "A produção anual da ENDIAMA atingiu um novo máximo histórico.", categoryName: "Operações Mineiras", photo: "mining-01.jpg", isFeatured: true, isBreaking: true, daysAgo: 1 },
    { title: "Catoca inicia exploração de novo corpo kimberlítico na Lunda Sul", excerpt: "A Sociedade Mineira de Catoca confirma o início da exploração de uma nova chaminé kimberlítica.", categoryName: "Operações Mineiras", photo: "catoca-01.jpg", isFeatured: true, daysAgo: 4 },
    { title: "SODIAM realiza leilão internacional com receita recorde de USD 85 milhões", excerpt: "O leilão contou com a participação de compradores de mais de 20 países.", categoryName: "Grupo ENDIAMA", photo: "auction-01.jpg", isFeatured: true, isBreaking: true, daysAgo: 2 },
    { title: "Preços de diamantes em bruto sobem 6% no mercado global", excerpt: "A procura internacional impulsiona a valorização dos diamantes brutos.", categoryName: "Comercialização", photo: "gemologist-01.jpg", isFeatured: true, daysAgo: 2 },
    { title: "ENDIAMA inaugura novo centro de saúde na comunidade do Cuango", excerpt: "A nova infra-estrutura vai beneficiar directamente mais de 15 mil habitantes.", categoryName: "Responsabilidade Social", photo: "hospital-01.jpg", isFeatured: true, daysAgo: 3 },
    { title: "ENDIAMA investe em reflorestação de áreas mineiras recuperadas", excerpt: "O projecto de reflorestação abrange já mais de 800 hectares de áreas anteriormente exploradas.", categoryName: "Sustentabilidade", photo: "solar-01.jpg", daysAgo: 5 },
    { title: "Sector diamantífero representa 8% do PIB angolano em 2025", excerpt: "Os dados económicos confirmam o peso crescente do sector mineiro na economia nacional.", categoryName: "Comercialização", photo: "chart-01.jpg", daysAgo: 4 },
    { title: "ENDIAMA implementa inteligência artificial na triagem de diamantes", excerpt: "O novo sistema de triagem automática promete aumentar a precisão e a eficiência do processo.", categoryName: "Tecnologia", photo: "drone-01.jpg", daysAgo: 3 },
    { title: "ENDIAMA celebra 45 anos de história ao serviço de Angola", excerpt: "A empresa assinala mais um aniversário reafirmando o seu papel central no desenvolvimento do país.", categoryName: "Institucional", photo: "meeting-01.jpg", isFeatured: true, isBreaking: true, daysAgo: 1 },
    { title: "Fórum Mundial do Diamante debate futuro do sector em Genebra", excerpt: "Líderes da indústria reuniram-se para discutir sustentabilidade, tecnologia e mercado global.", categoryName: "Internacional", photo: "globe-01.jpg", daysAgo: 6 },
  ];

  for (const [index, item] of items.entries()) {
    const slug = slugify(item.title);
    const exists = await prisma.news.findUnique({ where: { slug } });
    if (exists) continue;

    const coverImage = seedImage(item.photo, "news");
    const publishedAt = new Date(Date.now() - item.daysAgo * 86_400_000);

    await prisma.news.create({
      data: {
        title: item.title,
        slug,
        excerpt: item.excerpt,
        coverImage,
        coverImageAlt: item.title,
        content: [
          { type: "paragraph", content: item.excerpt },
          {
            type: "paragraph",
            content: `A informação foi avançada no âmbito das actividades da ENDIAMA E.P., que reforça o seu posicionamento estratégico no sector mineiro angolano.`,
          },
          { type: "quote", content: "Este é mais um passo importante para consolidar a nossa visão de futuro para o sector diamantífero angolano.", caption: "Fonte oficial" },
        ],
        categoryId: findCategory(item.categoryName),
        authorId,
        reviewerId,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isFeatured: item.isFeatured ?? false,
        isBreaking: item.isBreaking ?? false,
        readingTime: 4 + (index % 4),
        viewsCount: 500 + index * 731,
        likesCount: 20 + index * 13,
        publishedAt,
        seoTitle: item.title,
        seoDescription: item.excerpt,
      },
    });
  }
  console.log(`✔ ${items.length} notícias de demonstração criadas.`);
}

async function seedBanners(categories: Array<{ id: string; name: string }>) {
  const findCategory = (name: string) => categories.find((c) => c.name === name)!.id;
  const banners = [
    { title: "Produção de diamantes a céu aberto", subtitle: "Operações Mineiras", image: seedImage("mining-01.jpg", "banners"), categoryName: "Operações Mineiras", order: 0 },
    { title: "45 Anos ao Serviço de Angola", subtitle: "Institucional", image: seedImage("meeting-01.jpg", "banners"), categoryName: "Institucional", order: 1 },
    { title: "Leilão Internacional da SODIAM", subtitle: "SODIAM", image: seedImage("auction-01.jpg", "banners"), categoryName: "Grupo ENDIAMA", order: 2 },
  ];
  for (const banner of banners) {
    const existing = await prisma.banner.findFirst({ where: { title: banner.title } });
    if (!existing) {
      await prisma.banner.create({
        data: {
          title: banner.title,
          subtitle: banner.subtitle,
          image: banner.image,
          categoryId: findCategory(banner.categoryName),
          buttonText: "Ler Notícia",
          buttonUrl: "/",
          order: banner.order,
          status: "ACTIVE",
        },
      });
    }
  }
  console.log("✔ Banners de demonstração criados.");
}

async function seedVideos(categories: Array<{ id: string; name: string }>) {
  const findCategory = (name: string) => categories.find((c) => c.name === name)!.id;
  const videos = [
    { title: "Dentro da mina do Catoca: operações a céu aberto", description: "Uma viagem visual pelas operações da maior mina de diamantes de Angola.", thumbnail: seedImage("mining-02.jpg", "videos"), categoryName: "Operações Mineiras" },
    { title: "ENDIAMA 45 anos: a história do diamante angolano", description: "Documentário especial sobre as quatro décadas e meia da ENDIAMA.", thumbnail: seedImage("meeting-01.jpg", "videos"), categoryName: "Institucional" },
  ];
  for (const video of videos) {
    const slug = slugify(video.title);
    const existing = await prisma.video.findUnique({ where: { slug } });
    if (!existing) {
      const { categoryName, ...videoData } = video;
      await prisma.video.create({
        data: {
          ...videoData,
          slug,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          videoType: "UPLOAD",
          duration: 274,
          categoryId: findCategory(categoryName),
          status: "PUBLISHED",
          isFeatured: true,
          publishedAt: new Date(),
        },
      });
    }
  }
  console.log("✔ Vídeos de demonstração criados.");
}

const GALLERY_TAXONOMY: Array<{ name: string; slug: string; order: number; subcategories: Array<{ name: string; slug: string; order: number }> }> = [
  { name: "Conselho de Administração", slug: "conselho-de-administracao", order: 0, subcategories: [] },
  { name: "Directores e Delegados", slug: "directores-e-delegados", order: 1, subcategories: [] },
  {
    name: "Indústria Diamantífera",
    slug: "industria-diamantifera",
    order: 2,
    subcategories: [
      { name: "Diamantes", slug: "diamantes", order: 0 },
      { name: "Mineiros", slug: "mineiros", order: 1 },
      { name: "Maquinaria", slug: "maquinaria", order: 2 },
      { name: "Lavarias", slug: "lavarias", order: 3 },
      { name: "Instalações", slug: "instalacoes", order: 4 },
      { name: "Diversos", slug: "diversos", order: 5 },
      { name: "Eventos", slug: "eventos", order: 6 },
    ],
  },
];

async function seedGalleryTaxonomy() {
  for (const category of GALLERY_TAXONOMY) {
    const record = await prisma.galleryCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, order: category.order },
      create: { name: category.name, slug: category.slug, order: category.order },
    });
    for (const subcategory of category.subcategories) {
      await prisma.gallerySubcategory.upsert({
        where: { slug: subcategory.slug },
        update: { name: subcategory.name, order: subcategory.order, galleryCategoryId: record.id },
        create: { ...subcategory, galleryCategoryId: record.id },
      });
    }
  }
  console.log("✔ Taxonomia de galeria (categorias/subcategorias) criada/actualizada.");
}

async function seedGalleries() {
  const industriaDiamantifera = await prisma.galleryCategory.findUniqueOrThrow({ where: { slug: "industria-diamantifera" } });
  const findSubcategory = (slug: string) => prisma.gallerySubcategory.findUniqueOrThrow({ where: { slug } });

  const galleries = [
    {
      title: "Operações Mineiras 2026",
      slug: "operacoes-mineiras-2026",
      description: "Galeria fotográfica das operações mineiras da ENDIAMA e da Sociedade Mineira de Catoca.",
      cover: "mining-03.jpg",
      subcategorySlug: "mineiros",
      location: "Catoca, Lunda Sul",
      images: [
        { file: "mining-04.jpg", alt: "Operações mineiras da ENDIAMA" },
        { file: "mining-05.jpg", alt: "Equipamento pesado em operação na mina" },
        { file: "diamond-01.jpg", alt: "Diamantes em bruto extraídos na mina" },
        { file: "geology-01.jpg", alt: "Estudo geológico do terreno mineiro" },
        { file: "catoca-02.jpg", alt: "Vista aérea da mina de Catoca" },
        { file: "catoca-03.jpg", alt: "Trabalhadores na mina de Catoca" },
        { file: "mining-06.jpg", alt: "Processamento de minério na ENDIAMA Mining" },
      ],
    },
    {
      title: "Responsabilidade Social e Comunidades",
      slug: "responsabilidade-social-e-comunidades",
      description: "Projectos sociais, saúde e educação apoiados pela ENDIAMA nas comunidades mineiras.",
      cover: "hospital-02.jpg",
      subcategorySlug: "diversos",
      location: "Cuango, Lunda Norte",
      images: [
        { file: "children-01.jpg", alt: "Crianças beneficiárias de projectos sociais da ENDIAMA" },
        { file: "classroom-01.jpg", alt: "Sala de aula apoiada por projectos educativos da ENDIAMA" },
        { file: "community-01.jpg", alt: "Encontro comunitário em zona mineira" },
        { file: "handshake-01.jpg", alt: "Assinatura de protocolo de responsabilidade social" },
      ],
    },
  ];

  for (const gallery of galleries) {
    const subcategory = await findSubcategory(gallery.subcategorySlug);
    const record = await prisma.gallery.upsert({
      where: { slug: gallery.slug },
      update: {},
      create: {
        title: gallery.title,
        slug: gallery.slug,
        description: gallery.description,
        coverImage: seedImage(gallery.cover, "galleries"),
        galleryCategoryId: industriaDiamantifera.id,
        gallerySubcategoryId: subcategory.id,
        location: gallery.location,
        status: "PUBLISHED",
        isFeatured: true,
      },
    });

    const existingImages = await prisma.galleryImage.findMany({ where: { galleryId: record.id }, select: { imageUrl: true } });
    const existingFiles = new Set(existingImages.map((img) => img.imageUrl.split("/").pop()));
    let order = existingImages.length;
    for (const image of gallery.images) {
      if (existingFiles.has(image.file)) continue;
      await prisma.galleryImage.create({
        data: {
          galleryId: record.id,
          imageUrl: seedImage(image.file, "galleries"),
          altText: image.alt,
          order: order++,
        },
      });
    }
  }
  console.log(`✔ ${galleries.length} galerias de demonstração criadas/actualizadas.`);
}

async function seedInterviews(categories: Array<{ id: string; name: string }>) {
  const findCategory = (name: string) => categories.find((c) => c.name === name)!.id;
  const interviews = [
    {
      title: "Entrevista: os desafios da produção diamantífera em 2026",
      intervieweeName: "Carla Sassuco",
      intervieweePosition: "Directora de Operações Mineiras",
      excerpt: "Uma conversa sobre os desafios e oportunidades da produção diamantífera angolana.",
      photo: "portrait-woman-01.jpg",
      cover: "geology-01.jpg",
      categoryName: "Operações Mineiras",
      daysAgo: 0,
    },
    {
      title: "Entrevista: sustentabilidade como pilar estratégico da ENDIAMA",
      intervieweeName: "Fernando Kiala",
      intervieweePosition: "Director de Sustentabilidade",
      excerpt: "A ENDIAMA reforça o compromisso com práticas mineiras sustentáveis e responsáveis.",
      photo: "portrait-man-01.jpg",
      cover: "solar-01.jpg",
      categoryName: "Sustentabilidade",
      daysAgo: 2,
    },
    {
      title: "Entrevista: o papel da SODIAM na comercialização de diamantes angolanos",
      intervieweeName: "Pedro Muteka",
      intervieweePosition: "Director Comercial",
      intervieweeCompany: "SODIAM",
      excerpt: "A SODIAM detalha a estratégia de comercialização e valorização dos diamantes angolanos nos mercados internacionais.",
      photo: "portrait-man-02.jpg",
      cover: "diamond-02.jpg",
      categoryName: "Grupo ENDIAMA",
      daysAgo: 5,
    },
    {
      title: "Entrevista: tecnologia e inovação na triagem de diamantes",
      intervieweeName: "Ana Kiluanje",
      intervieweePosition: "Especialista em Tecnologia Mineira",
      intervieweeCompany: "ENDIAMA E.P.",
      excerpt: "A inteligência artificial e a automação estão a transformar a triagem e classificação de diamantes em Angola.",
      photo: "portrait-woman-02.jpg",
      cover: "drone-solar-01.jpg",
      categoryName: "Tecnologia",
      daysAgo: 7,
    },
    {
      title: "Entrevista: formação técnica ao serviço do sector mineiro angolano",
      intervieweeName: "Domingos Sapalo",
      intervieweePosition: "Coordenador de Formação Técnica",
      intervieweeCompany: "ENDIAMA E.P.",
      excerpt: "Investir na formação técnica de jovens angolanos é uma prioridade estratégica para o futuro do sector mineiro.",
      photo: "journalist-01.jpg",
      cover: "classroom-01.jpg",
      categoryName: "Responsabilidade Social",
      daysAgo: 9,
    },
  ];
  for (const interview of interviews) {
    const slug = slugify(interview.title);
    const existing = await prisma.interview.findUnique({ where: { slug } });
    if (!existing) {
      await prisma.interview.create({
        data: {
          title: interview.title,
          slug,
          excerpt: interview.excerpt,
          content: [{ type: "paragraph", content: interview.excerpt }],
          intervieweeName: interview.intervieweeName,
          intervieweePosition: interview.intervieweePosition,
          intervieweeCompany: interview.intervieweeCompany,
          intervieweePhoto: seedImage(interview.photo, "interviews"),
          coverImage: seedImage(interview.cover, "interviews"),
          categoryId: findCategory(interview.categoryName),
          status: "PUBLISHED",
          publishedAt: new Date(Date.now() - interview.daysAgo * 86_400_000),
        },
      });
    }
  }
  console.log(`✔ ${interviews.length} entrevistas de demonstração criadas/actualizadas.`);
}

async function seedEvents() {
  const events = [
    { title: "Fórum Nacional da Indústria Mineira 2026", location: "Centro de Convenções de Talatona, Luanda", startDate: new Date("2026-08-14T09:00:00Z") },
    { title: "Gala dos 45 Anos da ENDIAMA", location: "Cidadela Desportiva, Luanda", startDate: new Date("2026-07-25T18:00:00Z") },
  ];
  for (const event of events) {
    const slug = slugify(event.title);
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing) {
      await prisma.event.create({
        data: {
          title: event.title,
          slug,
          description: `Evento institucional da ENDIAMA E.P.: ${event.title}.`,
          coverImage: seedImage("office-building-01.jpg", "events"),
          location: event.location,
          startDate: event.startDate,
          status: "UPCOMING",
          isFeatured: true,
        },
      });
    }
  }
  console.log("✔ Eventos de demonstração criados.");
}

async function seedDocuments(categories: Array<{ id: string; name: string }>) {
  const findCategory = (name: string) => categories.find((c) => c.name === name)!.id;
  const documents = [
    { title: "Relatório Anual de Sustentabilidade 2025", fileName: "relatorio-sustentabilidade-2025.pdf" },
    { title: "Plano Estratégico ENDIAMA 2026-2030", fileName: "plano-estrategico-2026-2030.pdf" },
  ];
  for (const document of documents) {
    const slug = slugify(document.title);
    const existing = await prisma.document.findUnique({ where: { slug } });
    if (!existing) {
      await prisma.document.create({
        data: {
          title: document.title,
          slug,
          description: `${document.title} — documento oficial da ENDIAMA E.P.`,
          fileUrl: `${API_BASE_URL}/uploads/documents/${document.fileName}`,
          fileName: document.fileName,
          fileType: "PDF",
          fileSize: 2_500_000,
          categoryId: findCategory("Institucional"),
          status: "PUBLISHED",
        },
      });
    }
  }
  console.log("✔ Documentos de demonstração criados (metadados; ficheiros reais devem ser carregados pelo painel).");
}

async function main() {
  console.log("Iniciando seed do Portal de Notícias da ENDIAMA E.P. …");
  await seedPermissionsAndRoles();
  const { journalist, editor } = await seedSuperAdmin();
  const categories = await seedCategories();
  await seedSettings();
  await seedSocialLinks();
  await seedMenu();
  await seedPartners();
  await seedNews(categories, journalist.id, editor.id);
  await seedBanners(categories);
  await seedVideos(categories);
  await seedGalleryTaxonomy();
  await seedGalleries();
  await seedInterviews(categories);
  await seedEvents();
  await seedDocuments(categories);
  console.log("✔ Seed concluído com sucesso.");
}

main()
  .catch((err) => {
    console.error("Falha ao executar o seed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
