import { deleteSpendingCategory } from "@/lib/spending/actions";

export interface CategoryRow {
  id: string;
  name: string;
}

export function CategoryList({ categories }: { categories: CategoryRow[] }) {
  if (categories.length === 0) {
    return <p className="text-sm text-foreground-muted">No categories yet — add one below.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-foreground"
        >
          {category.name}
          <form action={deleteSpendingCategory.bind(null, category.id)}>
            <button
              type="submit"
              aria-label={`Delete category ${category.name}`}
              className="text-foreground-muted transition-colors hover:text-negative"
            >
              ×
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
