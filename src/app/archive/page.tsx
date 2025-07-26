import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { ArchiveClient } from "./archive-client";

export default async function ArchivePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/");
  }

  return <ArchiveClient />;
}