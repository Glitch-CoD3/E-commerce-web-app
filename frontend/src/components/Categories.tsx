"use client";

import {
    Footprints,
    Glasses,
    Shirt,
    Venus,
    Watch,
    BellElectric,
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

    const selectedCategory =
        searchParam.get("category") || "all";

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategories();

                setCategories([
                    {
                        id: 0,
                        name: "All",
                        slug: "all",
                    },
                    ...response.All_categories,
                ]);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };

        fetchCategories();
    }, []);

    const handleChange = (value: string) => {
        const params = new URLSearchParams(
            searchParam.toString()
        );

        params.set("category", value);

        router.push(`${pathName}?${params.toString()}`, {
            scroll: false,
        });
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 bg-gray-100 p-2 rounded-lg mb-4 text-sm">
            {categories.map((category) => (
                <div
                    key={category.id}
                    onClick={() => handleChange(category.category_name)}
                    className={`flex items-center justify-center gap-2 cursor-pointer px-2 py-1 rounded-md transition ${category.category_name === selectedCategory
                        ? "bg-white shadow"
                        : "text-gray-500 hover:bg-white"
                        }`}
                >
                    {iconMap[category.category_name]}
                    <span>{category.category_name}</span>
                </div>
            ))}
        </div>

    );
};

export default Categories;