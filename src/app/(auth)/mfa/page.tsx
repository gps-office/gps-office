import { MfaVerify } from "./verify";

export const metadata = { title: "Two-factor code" };

export default async function MfaPage({ searchParams }: PageProps<"/mfa">) {
  const { next } = await searchParams;
  return <MfaVerify next={typeof next === "string" ? next : "/"} />;
}
