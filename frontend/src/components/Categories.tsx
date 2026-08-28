"use client";

import {
  Footprints,
  Glasses,
  Shirt,
  Venus,
  Watch,
  BellElectric,
  ChevronDown,
} from "lucide-react";
import { CategoryType } from "../services/product.service";
import { useEffect, useState } from "react";
import { getCategories } from "../services/product.service";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

const iconMap: Record<string, React.ReactNode> = {
  "t-shirts": <Shirt className="w-4 h-4" />,
  "Shoes": <Footprints className="w-4 h-4" />,
  "Accessories": <Glasses className="w-4 h-4" />,
  "Dresses": <Venus className="w-4 h-4" />,
  "Watches": <Watch className="w-4 h-4" />,
  "Watch": <Watch className="w-4 h-4" />,
  "Face Cream": <BellElectric className="w-4 h-4" />,
};

const Categories = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);

  const searchParam = useSearchParams();
  const pathName = usePathname();
  const router = useRouter();

  const selectedCategory = searchParam.get("category") || "all";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();

        // Map backend objects safely so category_name and slug always exist
        const fetchedCats = (response?.All_categories || []).map((cat: any) => ({
          ...cat,
          category_name: cat.category_name || cat.name || "Unnamed",
          slug: cat.slug || cat.url_slug || cat.category_name?.toLowerCase() || "all",
          // Keep subcategories/children array intact
          children: cat.children || cat.subcategories || [],
        }));

        setCategories([
          {
            id: 0,
            category_name: "All",
            slug: "all",
          },
          ...fetchedCats,
        ]);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParam.toString());

    if (value.toLowerCase() === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }

    router.push(`${pathName}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-wrap justify-around items-center gap-2 bg-gray-100 p-2 rounded-lg mb-4 text-sm relative">
      {categories.map((category: any) => {
        const catName = category.category_name || category.name || "";
        const catSlug = category.slug || catName.toLowerCase();
        const children = category.children || category.subcategories || [];
        const hasChildren = children.length > 0;

        // Matches by either exact category_name or slug
        const isSelected = selectedCategory === catSlug || selectedCategory === catName;

        return (
          <div key={category.id ?? `cat-${catName}`} className="relative group">
            {/* Parent Category Pill */}
            <div
              onClick={() => handleChange(catSlug)}
              className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-1.5 rounded-md transition ${
                isSelected ? "bg-white shadow font-semibold text-gray-900" : "text-gray-500 hover:bg-white"
              }`}
            >
              {iconMap?.[catName]}
              <span>{catName}</span>

              {/* Indicator arrow if subcategories exist */}
              {hasChildren && (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:rotate-180 transition-transform duration-200" />
              )}
            </div>

            {/* Subcategory Dropdown on Hover */}
            {hasChildren && (
              <div className="absolute left-0 top-full pt-1.5 hidden group-hover:flex flex-col min-w-42.5 z-50">
                <div className="bg-white border border-gray-100 rounded-lg shadow-xl p-1.5 flex flex-col gap-1">
                  {children.map((child: any) => {
                    const childName = child.category_name || child.name || "";
                    const childSlug = child.slug || childName.toLowerCase();
                    const isChildSelected = selectedCategory === childSlug || selectedCategory === childName;

                    return (
                      <div
                        key={child.id ?? `sub-${childName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChange(childSlug);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs cursor-pointer transition flex items-center gap-2 ${
                          isChildSelected
                            ? "bg-indigo-50 text-indigo-600 font-semibold"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {iconMap?.[childName]}
                        <span>{childName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Categories;