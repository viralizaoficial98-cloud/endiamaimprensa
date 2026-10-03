import type { Metadata } from "next";
import { Container } from "@/presentation/components/ui/container";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade do Portal de Notícias da ENDIAMA E.P.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">Política de Privacidade</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/70">
          <p>
            A ENDIAMA E.P. — Empresa Nacional de Diamantes de Angola respeita a privacidade dos visitantes do
            Portal de Notícias e compromete-se a proteger os dados pessoais recolhidos através deste site.
          </p>
          <p>
            Os dados recolhidos através de formulários (subscrição de newsletter, comentários) são utilizados
            exclusivamente para os fins a que se destinam — envio de comunicações informativas e moderação de
            comentários — e não são partilhados com terceiros para fins comerciais.
          </p>
          <p>
            O utilizador pode, a qualquer momento, solicitar a remoção dos seus dados pessoais contactando
            <a href="mailto:imprensa@endiama.co.ao" className="mx-1 text-brand-600 hover:underline">imprensa@endiama.co.ao</a>.
          </p>
          <p>
            Este portal utiliza cookies estritamente necessários ao seu funcionamento (preferência de tema e
            sessão administrativa). Não são utilizados cookies de rastreio publicitário.
          </p>
        </div>
      </Container>
    </div>
  );
}
