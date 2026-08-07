import { Badge } from "@/components/ui/badge";
import { MobileMenuButton } from "@/components/layout/app-sidebar";

type AppHeaderProps = {
  title: string;
  description: string;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "success" | "warning" | "info" | "outline";
  };
  onMenuClick: () => void;
};

export function AppHeader({
  title,
  description,
  badge,
  onMenuClick,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <MobileMenuButton onClick={onMenuClick} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {title}
            </h1>
            {badge ? (
              <Badge variant={badge.variant ?? "secondary"}>{badge.label}</Badge>
            ) : null}
          </div>
          <p className="truncate text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </header>
  );
}
