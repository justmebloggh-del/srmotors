import { listAdminMedia } from "@/lib/data/admin-media";
import { MediaLibraryGrid } from "@/components/admin/media-library-grid";

export default async function AdminMediaPage() {
  const items = await listAdminMedia();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Media Library</h1>
      <p className="mb-6 text-sm text-muted-foreground">{items.length} file(s)</p>
      <MediaLibraryGrid items={items} />
    </div>
  );
}
