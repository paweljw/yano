import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { StoreProvider } from "~/lib/store/store-provider";

interface PageWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export async function PageWrapper({ children, requireAuth = true }: PageWrapperProps) {
  if (requireAuth) {
    const session = await auth();
    if (!session?.user) {
      redirect("/");
    }
  }

  return <StoreProvider>{children}</StoreProvider>;
}