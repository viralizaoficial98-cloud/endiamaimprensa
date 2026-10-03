import type { EventStatus } from "@/domain/entities";

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Rascunho",
  UPCOMING: "Próximo",
  ONGOING: "Em Curso",
  FINISHED: "Concluído",
  CANCELLED: "Cancelado",
};

export const EVENT_STATUS_STYLE: Record<EventStatus, string> = {
  DRAFT: "bg-foreground/10 text-foreground/60",
  UPCOMING: "bg-brand-600 text-white",
  ONGOING: "bg-gold-500 text-brand-950",
  FINISHED: "bg-foreground/10 text-foreground/50",
  CANCELLED: "bg-red-600/90 text-white",
};
