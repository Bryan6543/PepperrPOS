import { BusinessHeader } from "@/components/BusinessHeader";
import PosWorkspace from "@/components/pos/PosWorkspace";
import { getCatalogGrouped } from "@/actions/catalog";
import { getSettingsMap } from "@/lib/settings-read";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [catalog, settings] = await Promise.all([getCatalogGrouped(), getSettingsMap()]);
  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-pepperr-cream">
      <BusinessHeader title="POS" />
      <PosWorkspace catalog={catalog} settings={settings} />
    </div>
  );
}
