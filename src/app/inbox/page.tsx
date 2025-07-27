import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { InboxClient } from "./inbox-client";

export default async function InboxPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <InboxClient />;
}
