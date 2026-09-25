import { redirect } from "next/navigation";

export default function IssuesPage() {
  redirect("/activity?type=issues");
}
