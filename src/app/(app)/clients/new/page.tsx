import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { ClientFields } from "../client-fields";
import { createClientRecord } from "../actions";

export const metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New client" />
      <Card>
        <ActionForm action={createClientRecord}>
          <ClientFields />
          <div className="mt-6 flex gap-2">
            <SubmitButton>Create client</SubmitButton>
            <LinkButton href="/clients" variant="secondary">
              Cancel
            </LinkButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
