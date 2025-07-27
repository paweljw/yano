import { PageWrapper } from "~/components/page-wrapper";
import { TaskList } from "~/components/task-list";

export default async function TrashPage() {
  return (
    <PageWrapper>
      <TaskList
        view="trash"
        title="Trash"
        description="Rejected tasks"
        emptyState={{
          icon: "🗑️",
          title: "Trash is empty",
          message: "Tasks you reject will appear here",
        }}
      />
    </PageWrapper>
  );
}
