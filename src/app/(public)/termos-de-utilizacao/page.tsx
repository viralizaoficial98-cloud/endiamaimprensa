import type { Metadata } from "next";
import { Container } from "@/presentation/components/ui/container";

export const metadata: Metadata = {
  title: "Termos de Utilização",
  description: "Termos de utilização do Portal de Notícias da ENDIAMA E.P.",
};

export default function TermsOfUsePage() {
  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">Termos de Utilização</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/70">
          <p>
            O acesso e utilização do Portal de Notícias da ENDIAMA E.P. implicam a aceitação integral dos
            presentes termos de utilização.
          </p>
          <p>
            Todo o conteúdo editorial, fotográfico e institucional publicado neste portal é propriedade da
            ENDIAMA E.P., salvo indicação em contrário, e não pode ser reproduzido sem autorização prévia.
          </p>
          <p>
            Os comentários publicados por visitantes reflectem exclusivamente a opinião dos seus autores e
            estão sujeitos a moderação prévia pela equipa editorial. A ENDIAMA E.P. reserva-se o direito de
            remover conteúdos que violem a lei, direitos de terceiros ou as normas de conduta deste portal.
          </p>
          <p>
            A ENDIAMA E.P. envida esforços para assegurar a exactidão da informação publicada, mas não garante
            a ausência total de erros ou omissões.
          </p>
        </div>
      </Container>
    </div>
  );
}
