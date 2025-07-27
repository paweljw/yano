import { PageWrapper } from "~/components/PageWrapper";
import { TaskList } from "~/components/TaskList";

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
