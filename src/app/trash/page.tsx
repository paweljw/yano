import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { TrashClient } from "./trash-client";

export default async function TrashPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <TrashClient />;
}
