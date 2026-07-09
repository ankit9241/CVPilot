import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
  primaryAction?: string;
}

export function PlaceholderPage({
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  icon,
  primaryAction = "Create new",
}: PlaceholderPageProps) {
  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {primaryAction}
          </Button>
        }
      />
      <div className="mt-8">
        <EmptyState
          icon={icon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button variant="outline" size="sm">
              Learn more
            </Button>
          }
        />
      </div>
    </div>
  );
}
