import { signOut } from "../actions";
import { Button } from "@/components/ui";

export const metadata = { title: "Account not active" };

export default function InactivePage() {
  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-slate-900">Account not active</h1>
      <p className="mb-4 text-sm text-slate-600">
        Your account is not set up for GPS Office, or has been switched off. Please contact the office manager.
      </p>
      <form action={signOut}>
        <Button variant="secondary" className="w-full">
          Sign out
        </Button>
      </form>
    </>
  );
}
