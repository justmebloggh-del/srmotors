import { getAllContentBlocks, getAllFaqs } from "@/lib/data/admin-content";
import { ContentBlockEditor } from "@/components/admin/content-block-editor";
import { FaqManager } from "@/components/admin/faq-manager";

const BLOCK_LABELS: Record<string, string> = {
  home_hero: "Homepage Hero",
  about: "About Us",
  import_process: "Import Process Intro",
  privacy_policy: "Privacy Policy",
  terms: "Terms & Conditions",
};

export default async function AdminContentPage() {
  const [blocks, faqs] = await Promise.all([getAllContentBlocks(), getAllFaqs()]);
  const byKey = new Map(blocks.map((b) => [b.key, b]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Site Content</h1>
      <div className="grid gap-6">
        {Object.entries(BLOCK_LABELS).map(([key, label]) => {
          const block = byKey.get(key);
          return (
            <ContentBlockEditor
              key={key}
              contentKey={key}
              label={label}
              defaultTitle={block?.title ?? ""}
              defaultBody={block?.body ?? ""}
              defaultPublished={block?.published ?? false}
            />
          );
        })}
        <ContentBlockEditor
          contentKey="duty_checker"
          label="Duty Estimator Link"
          help="Third-party Ghana duty calculator shown on vehicle pages, the import calculator and the estimate form. It must be labelled as independent — never as an official GRA/Customs tool."
          titleLabel="Service name (e.g. AutoDutyChecker)"
          bodyLabel="Link (https://…)"
          publishedLabel="Show on the website"
          bodyRows={1}
          defaultTitle={byKey.get("duty_checker")?.title ?? ""}
          defaultBody={byKey.get("duty_checker")?.body ?? ""}
          defaultPublished={byKey.get("duty_checker")?.published ?? false}
        />
        <FaqManager faqs={faqs} />
      </div>
    </div>
  );
}
