import { PageHeader } from "@/components/ui";
import { SearchBox } from "./search-box";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Search" subtitle="Clients, Hebrew names, case references, Home Office / HMPO / USCIS / consulate references, passport numbers and documents." />
      <SearchBox />
    </div>
  );
}
