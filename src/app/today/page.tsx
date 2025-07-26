import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { TodayClient } from "./today-client";

export default async function TodayPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/");
  }

  return <TodayClient />;
}