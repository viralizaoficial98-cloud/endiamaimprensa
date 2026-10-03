"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-AO">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "1.5rem", backgroundColor: "#0e1a14", color: "#ffffff" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#2fa968" }}>ENDIAMA Notícias</p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: 0 }}>Ocorreu um erro inesperado</h1>
        <p style={{ maxWidth: "28rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", margin: 0 }}>
          Não foi possível carregar o Portal de Notícias. Tente novamente dentro de instantes.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ marginTop: "0.5rem", borderRadius: "9999px", backgroundColor: "#c9a24b", padding: "0.625rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#0e1a14", border: "none", cursor: "pointer" }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
