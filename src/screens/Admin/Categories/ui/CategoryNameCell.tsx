import { Input } from "@/components/ui/input";
import { ICategory } from "@/src/share/api/model/categories";
import { categoryEditStore } from "@/src/screens/Admin/Categories/model/editStore";

interface CategoryNameCellProps {
  category: ICategory;
}

export const CategoryNameCell = ({ category }: CategoryNameCellProps) => {
  const { editingId, draftName, setDraftName } = categoryEditStore();

  if (editingId !== category.id) {
    return <span className="font-medium">{category.name}</span>;
  }

  return (
    <Input
      autoFocus
      value={draftName}
      onChange={(event) => setDraftName(event.target.value)}
      className="h-8 max-w-60"
      aria-label="Category name"
    />
  );
};
