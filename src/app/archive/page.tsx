import { PageWrapper } from "~/components/page-wrapper";
import { TaskList } from "~/components/task-list";

export default async function ArchivePage() {
  return (
    <PageWrapper>
      <TaskList
        view="archive"
        title="Archive"
        description="Your completed tasks"
        emptyState={{
          icon: "📦",
          title: "No completed tasks yet",
          message: "Complete your first task to see it here",
        }}
      />
    </PageWrapper>
  );
}
