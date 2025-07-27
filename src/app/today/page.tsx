import { PageWrapper } from "~/components/page-wrapper";
import { TaskList } from "~/components/task-list";

export default async function TodayPage() {
  return (
    <PageWrapper>
      <TaskList
        view="today"
        title="Today"
        description="Your tasks for today • Press ? for keyboard shortcuts"
        emptyState={{
          icon: "📅",
          title: "No tasks for today",
          message: "Visit your inbox to plan your day",
        }}
      />
    </PageWrapper>
  );
}
