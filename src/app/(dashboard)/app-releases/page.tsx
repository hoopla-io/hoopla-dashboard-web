import { Smartphone, Monitor } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ReleaseCard } from "@/app/(dashboard)/app-releases/components/ReleaseCard";

export default function AppReleasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Релизы приложения"
        description="Публикация новых сборок приложения кассы и управление обязательными обновлениями устройств."
      />

      <div className="max-w-2xl space-y-4">
        <ReleaseCard platform="android" label="Android" fileExt="apk" accept=".apk" icon={Smartphone} />
        <ReleaseCard platform="windows" label="Windows" fileExt="exe" accept=".exe" icon={Monitor} />
      </div>
    </div>
  );
}
