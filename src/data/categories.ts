export interface StoreCategory {
  name: string;
  image: string;
  path: string;
}

export const storeCategories: readonly StoreCategory[] = [
  {
    name: "Men's Clothing",
    image:
      "https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=800",
    path: "/products",
  },
  {
    name: "Women's Clothing",
    image:
      "https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800",
    path: "/products",
  },
  {
    name: "Jewelery",
    image:
      "https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=800",
    path: "/products",
  },
  {
    name: "Electronics",
    image:
      "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800",
    path: "/products",
  },
];
