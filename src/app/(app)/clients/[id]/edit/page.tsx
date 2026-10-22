import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/forms";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { ClientFields } from "../../client-fields";
import { updateClientRecord } from "../../actions";

export const metadata = { title: "Edit client" };

export default async function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={<span dir="auto">Edit {client.full_name}</span>} />
      <Card>
        <ActionForm action={updateClientRecord}>
          <input type="hidden" name="id" value={client.id} />
          <ClientFields client={client} />
          <div className="mt-6 flex gap-2">
            <SubmitButton>Save changes</SubmitButton>
            <LinkButton href={`/clients/${client.id}`} variant="secondary">
              Cancel
            </LinkButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
