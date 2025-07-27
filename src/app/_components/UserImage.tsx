/* eslint-disable @next/next/no-img-element */
import type { User } from "next-auth";

export function UserImage({ user }: { user: User }) {
  if (!user.image) return null;
  return <img
    src={user.image}
    alt={user.name ?? "User avatar"}
    className="h-8 w-8 rounded-full border border-zinc-700"
    width={32}
    height={32}
  />;
}