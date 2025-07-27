import { PageWrapper } from "~/components/PageWrapper";
import { TaskList } from "~/components/TaskList";

export default async function InboxPage() {
  return (
    <PageWrapper>
      <TaskList
        view="inbox"
        title="Inbox"
        description="Review and plan your tasks • Press ? for keyboard shortcuts"
        emptyState={{
          icon: "📥",
          title: "Your inbox is empty",
          message: "Create a new task to get started",
        }}
      />
    </PageWrapper>
  );
}
