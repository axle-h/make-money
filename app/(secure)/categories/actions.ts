import { categoriesApi, mutateCategories } from "@/api-client";
import { NewCategory } from "@/app/api/schema";
import { ApiError } from "@/api-client/error";
import { toaster } from "@/components/ui/toaster";

export async function createCategory(newCategory: NewCategory) {
  try {
    await categoriesApi.create(newCategory);
    await mutateCategories();
    toaster.create({
      title: "Success",
      description: "Created new category.",
      type: "success",
      duration: 2000,
      closable: true,
    });
    return true;
  } catch (e) {
    let description: string;
    if (e instanceof ApiError && e.status === 400 && e.body.includes("P2002")) {
      description = "category already exists";
    } else if (e instanceof Error) {
      description = e.message;
    } else {
      description = e?.toString() || "an unknown error";
    }
    console.error(description);
    toaster.create({
      title: "Failed to create new category",
      description,
      type: "error",
      duration: 5000,
      closable: true,
    });
    return false;
  }
}

export async function updateCategory(
  id: number,
  values: NewCategory,
): Promise<boolean> {
  try {
    await categoriesApi.update(id, values);
    await mutateCategories();
    toaster.create({
      title: "Success",
      description: "Updated category.",
      type: "success",
      duration: 2000,
      closable: true,
    });
    return true;
  } catch (e) {
    let description: string;
    if (e instanceof ApiError && e.status === 400 && e.body.includes("P2002")) {
      description = "category already exists";
    } else if (e instanceof Error) {
      description = e.message;
    } else {
      description = e?.toString() || "an unknown error";
    }
    console.error(description);
    toaster.create({
      title: "Failed to update category",
      description,
      type: "error",
      duration: 5000,
      closable: true,
    });
    return false;
  }
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    await categoriesApi.delete(id);
    await mutateCategories();
    toaster.create({
      title: "Success",
      description: "Deleted category.",
      type: "success",
      duration: 2000,
      closable: true,
    });
    return true;
  } catch (e) {
    let description: string;
    if (e instanceof Error) {
      description = e.message;
    } else {
      description = e?.toString() || "an unknown error";
    }
    console.error(description);
    toaster.create({
      title: "Failed to delete category",
      description,
      type: "error",
      duration: 5000,
      closable: true,
    });
    return false;
  }
}
