"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminGet } from "@/infrastructure/api/admin-http-client";

interface DashboardSummary {
  totalNews: number;
  published: number;
  drafts: number;
  underReview: number;
  scheduled: number;
  totalViews: number;
  activeUsers: number;
  pendingComments: number;
  newsletterSubscribers: number;
  upcomingEvents: number;
}

interface TopNewsItem {
  id: string;
  title: string;
  slug: string;
  viewsCount: number;
  likesCount: number;
  publishedAt: string | null;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topNews, setTopNews] = useState<TopNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminGet<DashboardSummary>("/admin/dashboard/summary"), adminGet<TopNewsItem[]>("/admin/dashboard/top-news?limit=5")])
      .then(([s, t]) => {
        setSummary(s);
        setTopNews(t);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return <p className="text-sm text-foreground/50">A carregar estatísticas...</p>;
  }

  const cards = [
    { label: "Total de Notícias", value: summary.totalNews },
    { label: "Publicadas", value: summary.published },
    { label: "Rascunhos", value: summary.drafts },
    { label: "Em Revisão", value: summary.underReview },
    { label: "Agendadas", value: summary.scheduled },
    { label: "Visualizações Totais", value: summary.totalViews },
    { label: "Utilizadores Activos", value: summary.activeUsers },
    { label: "Comentários Pendentes", value: summary.pendingComments },
    { label: "Subscritores Newsletter", value: summary.newsletterSubscribers },
    { label: "Eventos Próximos", value: summary.upcomingEvents },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-foreground/50">Visão geral do Portal de Notícias ENDIAMA.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border-subtle bg-surface p-4">
            <p className="text-2xl font-semibold text-foreground">{card.value.toLocaleString("pt-AO")}</p>
            <p className="mt-1 text-xs text-foreground/50">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-medium text-foreground">Notícias Mais Lidas</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Visualizações</th>
                <th className="px-4 py-3">Gostos</th>
              </tr>
            </thead>
            <tbody>
              {topNews.map((news) => (
                <tr key={news.id} className="border-t border-border-subtle">
                  <td className="px-4 py-3">
                    <Link href={`/admin/news/${news.id}`} className="text-foreground hover:text-brand-600">
                      {news.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{news.viewsCount.toLocaleString("pt-AO")}</td>
                  <td className="px-4 py-3 text-foreground/70">{news.likesCount.toLocaleString("pt-AO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
