import type { Metadata } from "next";
import { HiOutlineEnvelope, HiOutlineMapPin, HiOutlinePhone } from "react-icons/hi2";
import { getSocialLinks } from "@/application/use-cases/social-link-use-cases";
import { SocialIcons } from "@/presentation/components/layout/social-icons";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacte a Sala de Imprensa da ENDIAMA E.P. — morada, telefone e email institucionais.",
};

const CONTACT_CARDS = [
  {
    icon: HiOutlineMapPin,
    label: "Morada",
    value: "Rua Rainha Ginga, Luanda, Angola",
    href: undefined,
  },
  {
    icon: HiOutlinePhone,
    label: "Telefone",
    value: "+244 222 000 000",
    href: "tel:+244222000000",
  },
  {
    icon: HiOutlineEnvelope,
    label: "Email",
    value: "imprensa@endiama.co.ao",
    href: "mailto:imprensa@endiama.co.ao",
  },
];

export default async function ContactoPage() {
  const socialLinks = await getSocialLinks().catch(() => []);

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Contacto</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            Fale com a Sala de Imprensa
          </h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Para pedidos de imprensa, credenciações e parcerias institucionais, utilize os contactos abaixo. A nossa equipa
            responde o mais brevemente possível.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {CONTACT_CARDS.map((card) => {
            const Icon = card.icon;
            const content = (
              <>
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-brand-600/10 text-brand-600 dark:text-brand-400">
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">{card.label}</p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground">{card.value}</p>
              </>
            );
            return card.href ? (
              <a
                key={card.label}
                href={card.href}
                className="rounded-2xl border border-border-subtle bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-lg"
              >
                {content}
              </a>
            ) : (
              <div key={card.label} className="rounded-2xl border border-border-subtle bg-surface p-6">
                {content}
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex flex-col items-start gap-6 rounded-3xl border border-border-subtle bg-surface-muted p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-medium text-foreground">Siga a ENDIAMA nas redes sociais</h2>
            <p className="mt-1.5 text-sm text-foreground/60">Acompanhe as últimas notícias e actualizações institucionais.</p>
          </div>
          <SocialIcons links={socialLinks} tone="dark" className="[&>a]:border-border-subtle [&>a]:text-foreground/60" />
        </div>
      </Container>
    </div>
  );
}
