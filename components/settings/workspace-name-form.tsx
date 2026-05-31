"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import {
  updateWorkspaceName,
  type WorkspaceNameFormState,
} from "@/actions/workspace";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkspaceNameFormProps {
  workspaceId: string;
  initialName: string;
  canEdit: boolean;
}

export function WorkspaceNameForm({
  workspaceId,
  initialName,
  canEdit,
}: WorkspaceNameFormProps) {
  const [state, formAction, pending] = useActionState<
    WorkspaceNameFormState,
    FormData
  >(updateWorkspaceName, {});

  if (!canEdit) {
    return (
      <Card className="dark:border-white/20">
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>
            Only workspace owners, admins, and members can change the team name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{initialName}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:border-white/20">
      <CardHeader>
        <CardTitle>Workspace name</CardTitle>
        <CardDescription>
          This name appears in the header and across Ceptly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />

          {state.errors?._form ? (
            <Alert variant="destructive">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          {state.success ? (
            <Alert>
              <AlertDescription>Workspace name updated.</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              name="name"
              defaultValue={initialName}
              placeholder="Acme Inc."
              required
              maxLength={200}
            />
            {state.errors?.name ? (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            ) : null}
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
