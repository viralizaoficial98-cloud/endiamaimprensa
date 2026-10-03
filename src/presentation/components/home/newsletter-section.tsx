import Image from "next/image";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";
import { NewsletterForm } from "./newsletter-form";

export function NewsletterSection() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-3xl bg-brand-700"
        >
          <div className="absolute inset-0">
            <Image
              src="/images/photos/diamond-01.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-800 via-brand-700/90 to-brand-700/60" />
          </div>

          <div className="relative grid grid-cols-1 items-center gap-10 px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Newsletter</span>
              <h2 className="mt-4 font-heading text-3xl font-medium leading-tight text-white sm:text-4xl">
                Receba as notícias da ENDIAMA em primeira mão
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
                Subscreva a nossa newsletter e receba semanalmente as principais notícias do sector mineiro e
                diamantífero angolano directamente no seu email.
              </p>
            </div>
            <div className="lg:pl-8">
              <NewsletterForm />
              <p className="mt-3 text-xs text-white/40">Sem spam. Pode cancelar a subscrição a qualquer momento.</p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
