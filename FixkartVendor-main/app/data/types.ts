// src/data/types.ts
export interface ProductItem {
  quantity: undefined;
  name: string;
  imagePath?: string; // Optional: specific path to image in /public
  categoryId?: string;
}

export interface Category {
  title: string;
  slug: string; // url-safe ID (e.g., 'hand-tools')
  items: ProductItem[];
}
