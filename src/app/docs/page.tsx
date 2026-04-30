import { readDocs } from "@/lib/data/workspace";
import { DocsClient } from "./docs-client";

export const dynamic = "force-dynamic";

export default function DocsPage() {
  const docs = readDocs().map((d) => ({
    ...d,
    modifiedAt: d.modifiedAt.toISOString(),
  }));

  return <DocsClient docs={docs} />;
}
