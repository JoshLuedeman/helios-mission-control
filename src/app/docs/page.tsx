import { readDocs } from "@/lib/data/workspace";
import { DocsClient } from "./docs-client";

export default function DocsPage() {
  const docs = readDocs().map((d) => ({
    ...d,
    modifiedAt: d.modifiedAt.toISOString(),
  }));

  return <DocsClient docs={docs} />;
}
