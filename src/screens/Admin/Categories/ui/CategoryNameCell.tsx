import { Input } from "@/components/ui/input";
import { ICategory } from "@/src/share/api/model/categories";
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";
import { ColorPicker, PRESET_COLORS } from "@/src/share/ui/ColorPicker";
import { categoryEditStore } from "@/src/screens/Admin/Categories/model/editStore";

interface CategoryNameCellProps {
  category: ICategory;
}

export const CategoryNameCell = ({ category }: CategoryNameCellProps) => {
  const { editingId, draftName, setDraftName, draftColor, setDraftColor } =
    categoryEditStore();

  if (editingId !== category.id) {
    return <CategoryBadge name={category.name} color={category.color} />;
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        value={draftName}
        onChange={(event) => setDraftName(event.target.value)}
        className="h-8 max-w-60"
        aria-label="Category name"
      />
      <ColorPicker
        value={draftColor}
        onValueChange={setDraftColor}
        swatches={PRESET_COLORS}
        label="Category color"
      />
    </div>
  );
};