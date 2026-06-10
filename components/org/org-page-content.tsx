import { OrgCommMap } from "@/components/org/org-comm-map";
import { OrgEditor } from "@/components/org/org-editor";
import { getOrgCommunications, getOrgStructure } from "@/lib/api/org";
import { getAccessToken } from "@/lib/auth/server";

interface OrgPageContentProps {
  workspaceId: string;
  canEdit: boolean;
}

export async function OrgPageContent({
  workspaceId,
  canEdit,
}: OrgPageContentProps) {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const [result, comms] = await Promise.all([
    getOrgStructure(token, workspaceId),
    getOrgCommunications(token, workspaceId),
  ]);
  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-muted-foreground">
        {result.error ?? "Could not load the org chart."}
      </p>
    );
  }

  return (
    <>
      <OrgCommMap communications={comms.data} />
      <OrgEditor
        workspaceId={workspaceId}
        canEdit={canEdit}
        initial={result.data}
        communications={comms.data}
      />
    </>
  );
}
