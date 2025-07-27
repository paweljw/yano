import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { api } from "~/trpc/server";
import { auth } from "~/server/auth";

export async function GET(_request: Request) {
  try {
    // In production, you should verify this is called by your cron service
    // For example, check for a secret header:
    const headersList = await headers();
    const _cronSecret = headersList.get("x-cron-secret");
    
    // Uncomment in production:
    // if (cronSecret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // For development/testing, we'll create a temporary session
    // In production, you'd have a system user or service account
    const session = await auth();
    
    if (!session) {
      // For now, just return success even without auth
      // In production, implement proper service-to-service auth
      return NextResponse.json({ 
        success: true, 
        message: "Daily reset skipped - no auth available" 
      });
    }

    // Perform the reset for all users
    const result = await api.task.resetAllUsers();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Daily reset cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for some cron services
export async function POST(request: Request) {
  return GET(request);
}