import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Clapperboard,
  History,
  Home,
  Settings,
} from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type AppSection = "discover" | "history" | "watched" | "settings";

interface AppSidebarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
}

const NAV_ITEMS: {
  id: AppSection;
  label: string;
  icon: typeof Home;
}[] = [
  { id: "discover", label: "Descobrir", icon: Home },
  { id: "history", label: "Histórico", icon: History },
  { id: "watched", label: "Assistidos", icon: CheckCircle2 },
  { id: "settings", label: "Configurações", icon: Settings },
];

export function AppSidebar({ activeSection, onNavigate }: AppSidebarProps) {
  const reduceMotion = useReducedMotion();

  return (
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-border/70 bg-card/40 px-3 py-6 backdrop-blur-md">
      <div className="mb-8 flex items-center gap-2.5 px-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Clapperboard className="size-5" aria-hidden />
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-tight text-foreground">
            MovieChooser
          </p>
          <p className="text-[11px] text-muted-foreground">Biblioteca local</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col items-stretch gap-1" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
              }}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && !reduceMotion ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/15"
                  transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                />
              ) : null}
              {active && reduceMotion ? (
                <span className="absolute inset-0 rounded-lg bg-primary/15" />
              ) : null}
              <Icon className="relative size-4 shrink-0" aria-hidden />
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
