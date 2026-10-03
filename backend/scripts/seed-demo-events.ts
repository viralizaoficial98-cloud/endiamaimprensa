/**
 * Fills the Events section with visually-realistic demonstration content while
 * the real editorial calendar only has two (already-past) events in the DB —
 * see the "Eventos" section of the portal improvement brief. Purely additive
 * and idempotent (matched by slug), so it's safe to re-run.
 *
 * These are clearly temporary and easy to remove:
 *   - every row is tagged with organizer "ENDIAMA E.P. (dados de demonstração)"
 *   - remove them with: npx tsx scripts/remove-demo-events.ts
 *   - or delete individually from the Admin → Eventos panel
 */
import { PrismaClient } from "@prisma/client";
import { toSlug } from "../src/utils/slug";

const prisma = new PrismaClient();

const DEMO_ORGANIZER = "ENDIAMA E.P. (dados de demonstração)";

function daysFromNow(days: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

const DEMO_EVENTS = [
  {
    title: "Conferência Nacional do Sector Diamantífero 2026",
    description:
      "Encontro anual que reúne operadores, reguladores e parceiros internacionais para discutir o futuro da indústria diamantífera angolana, investimento e sustentabilidade.",
    coverImage: "/images/photos/meeting-01.jpg",
    location: "Centro de Convenções de Talatona, Luanda",
    address: "Talatona, Luanda, Angola",
    startDate: daysFromNow(9, 9, 0),
    endDate: daysFromNow(10, 18, 0),
    startTime: "09:00",
    endTime: "18:00",
    organizer: DEMO_ORGANIZER,
    registrationUrl: "https://imprensa.endiama.co.ao/eventos",
    contactEmail: "eventos@endiama.co.ao",
    capacity: 400,
    status: "UPCOMING" as const,
    isFeatured: true,
  },
  {
    title: "Visita Institucional à Mina de Catoca",
    description: "Visita guiada de jornalistas e parceiros institucionais às operações da Sociedade Mineira de Catoca.",
    coverImage: "/images/photos/catoca-02.jpg",
    location: "Mina de Catoca, Lunda Sul",
    address: "Catoca, Lunda Sul, Angola",
    startDate: daysFromNow(3, 8, 30),
    endDate: daysFromNow(3, 17, 0),
    startTime: "08:30",
    endTime: "17:00",
    organizer: DEMO_ORGANIZER,
    contactEmail: "imprensa@endiama.co.ao",
    capacity: 60,
    status: "UPCOMING" as const,
    isFeatured: false,
  },
  {
    title: "Leilão Público de Diamantes Brutos",
    description: "Sessão de comercialização de diamantes brutos, aberta a compradores licenciados nacionais e internacionais.",
    coverImage: "/images/photos/auction-01.jpg",
    location: "Sede da SODIAM, Luanda",
    address: "Ingombota, Luanda, Angola",
    startDate: daysFromNow(0, 10, 0),
    endDate: daysFromNow(1, 16, 0),
    startTime: "10:00",
    endTime: "16:00",
    organizer: DEMO_ORGANIZER,
    contactEmail: "sodiam@sodiam.co.ao",
    status: "ONGOING" as const,
    isFeatured: false,
  },
  {
    title: "Fórum de Responsabilidade Social e Comunidades Mineiras",
    description: "Diálogo entre a ENDIAMA, autarquias locais e comunidades sobre programas sociais nas Lundas.",
    coverImage: "/images/photos/community-01.jpg",
    location: "Auditório Municipal do Saurimo",
    address: "Saurimo, Lunda Sul, Angola",
    startDate: daysFromNow(21, 9, 0),
    startTime: "09:00",
    endTime: "13:00",
    organizer: DEMO_ORGANIZER,
    contactEmail: "responsabilidadesocial@endiama.co.ao",
    capacity: 200,
    status: "UPCOMING" as const,
    isFeatured: false,
  },
  {
    title: "Workshop de Capacitação em Gemologia",
    description: "Formação técnica para jovens angolanos em avaliação e classificação de gemas, em parceria com a Clínica Sagrada Esperança e universidades locais.",
    coverImage: "/images/photos/classroom-01.jpg",
    location: "Academia ENDIAMA, Luanda",
    address: "Viana, Luanda, Angola",
    startDate: daysFromNow(35, 8, 0),
    endDate: daysFromNow(37, 17, 0),
    startTime: "08:00",
    endTime: "17:00",
    organizer: DEMO_ORGANIZER,
    registrationUrl: "https://imprensa.endiama.co.ao/eventos",
    capacity: 40,
    status: "UPCOMING" as const,
    isFeatured: false,
  },
];

async function main() {
  for (const event of DEMO_EVENTS) {
    const slug = toSlug(event.title);
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (existing) {
      console.log(`Já existe, a ignorar: ${event.title}`);
      continue;
    }
    await prisma.event.create({ data: { ...event, slug } });
    console.log(`Criado: ${event.title} (${slug})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
