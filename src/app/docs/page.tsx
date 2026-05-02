import { readDocs, readBrainFiles, isBrainMounted } from "@/lib/data/workspace";
import { DocsClient } from "./docs-client";

export const dynamic = "force-dynamic";

export default function DocsPage() {
  const docs = readDocs().map((d) => ({
    ...d,
    modifiedAt: d.modifiedAt.toISOString(),
  }));

  const brainFiles = readBrainFiles().map((b) => ({
    ...b,
    modifiedAt: b.modifiedAt.toISOString(),
  }));

  const brainMounted = isBrainMounted();

  return <DocsClient docs={docs} brainFiles={brainFiles} brainMounted={brainMounted} />;
}
