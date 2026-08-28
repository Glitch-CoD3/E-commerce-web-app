"use client";

import { ProductType } from "../type";
import { LucideShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const ProductCard = ({ product }: { product: ProductType }) => {
  // Ensure sizes and colors are always valid arrays
  const availableSizes = useMemo(() => product.sizes ?? [], [product.sizes]);
  const availableColors = useMemo(() => product.colors ?? [], [product.colors]);

  const [productTypes, setProductTypes] = useState({
    size: availableSizes[0] ?? "",
    color: availableColors[0] ?? "",
  });

  // Keep compatibility with API variant fields
  const variantProduct = product as ProductType & {
    variant_prices?: number[] | string;
    variant_stocks?: number[] | string;
  };

  // Parse variant JSON strings safely
  const prices: number[] = useMemo(() => {
    try {
      return typeof variantProduct.variant_prices === "string"
        ? JSON.parse(variantProduct.variant_prices).map(Number)
        : variantProduct.variant_prices || [];
    } catch {
      return [];
    }
  }, [variantProduct.variant_prices]);

  const stocks: number[] = useMemo(() => {
    try {
      return typeof variantProduct.variant_stocks === "string"
        ? JSON.parse(variantProduct.variant_stocks).map(Number)
        : variantProduct.variant_stocks || [];
    } catch {
      return [];
    }
  }, [variantProduct.variant_stocks]);

  // Index mapped directly to color position
  const getVariantIndex = (_size: string, color: string) => {
    const colorIndex = availableColors.indexOf(color);
    return colorIndex !== -1 ? colorIndex : 0;
  };

  const currentVariantIndex = getVariantIndex(
    productTypes.size,
    productTypes.color
  );

  const currentPrice =
    prices[currentVariantIndex] ?? Number(product.price || 0);
  const currentStock = stocks[currentVariantIndex] ?? 0;
  const isSelectedVariantOutOfStock = currentStock <= 0;

  const handleProductTypes = ({
    type,
    value,
  }: {
    type: "size" | "color";
    value: string;
  }) => {
    setProductTypes((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  return (
    <div className="shadow-lg rounded-lg overflow-hidden flex flex-col bg-white">
      <Link
        href={`/product/${product.id}`}
        className="relative h-72 w-full overflow-hidden block bg-gray-100"
      >
        <Image
          src={product.images?.[productTypes.color] || "/placeholder.png"}
          alt={product.name || "Product image"}
          fill
          sizes="(max-width: 640px) 100vw, 100vw"
          quality={100}
          priority
          className="object-cover hover:scale-105 transition-transform duration-300"
        />

        {isSelectedVariantOutOfStock ? (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
            Out of Stock
          </span>
        ) : currentStock <= 5 ? (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Only {currentStock} left
          </span>
        ) : null}
      </Link>

      <div className="flex flex-col gap-4 p-4">
        <div>
          <h1 className="font-medium">{product.name}</h1>
          <p className="text-sm text-gray-500 line-clamp-2">
            {product.shortDescription}
          </p>
        </div>

        {/* DYNAMIC PRODUCT TYPES */}
        <div className="flex items-center gap-4 text-xs">
          {/* DYNAMIC SIZES - Only renders if the product has sizes */}
          {availableSizes.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">Size</span>

              <select
                name="size"
                id="size"
                value={productTypes.size}
                className="ring ring-gray-300 px-2 py-1 rounded-md cursor-pointer"
                onChange={(e) =>
                  handleProductTypes({ type: "size", value: e.target.value })
                }
              >
                {availableSizes.map((size) => (
                  <option key={size} value={size}>
                    {size.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DYNAMIC COLORS - Only renders if the product has colors */}
          {availableColors.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">Colors</span>

              <div className="flex items-center gap-1">
                {availableColors.map((color) => {
                  const colorIdx = getVariantIndex(productTypes.size, color);
                  const colorStock = stocks[colorIdx] ?? 0;
                  const isColorOutOfStock = colorStock <= 0;

                  return (
                    <button
                      type="button"
                      key={color}
                      onClick={() =>
                        handleProductTypes({ type: "color", value: color })
                      }
                      title={`${color.toUpperCase()} (${colorStock} in stock)`}
                      className={`relative border-2 ${
                        productTypes.color === color
                          ? "border-gray-500"
                          : "border-gray-300"
                      } rounded-full p-[1.2px] cursor-pointer`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${
                          isColorOutOfStock ? "opacity-30" : "opacity-100"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                      {isColorOutOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-full h-[1.5px] bg-red-500 rotate-45 transform" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stock Label */}
        <div className="text-xs">
          {isSelectedVariantOutOfStock ? (
            <span className="text-red-500 font-medium">
              Variant Out of Stock
            </span>
          ) : (
            <span className="text-emerald-600 font-medium">
              In Stock ({currentStock} available)
            </span>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <p className="font-medium text-base">
            TK.{currentPrice.toFixed(2)}
          </p>
          <button
            disabled={isSelectedVariantOutOfStock}
            className={`flex gap-2 items-center ring-1 ring-gray-200 shadow-lg rounded-md px-2 py-1 text-sm transition-all duration-300 ${
              isSelectedVariantOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed ring-0 shadow-none"
                : "cursor-pointer hover:text-white hover:bg-black"
            }`}
          >
            <LucideShoppingCart className="w-5 h-5" />
            {isSelectedVariantOutOfStock ? "Out of Stock" : "Add To Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;



// index 0 color always pairs with index 0 size, index 1 color pairs with index 1 size
  //  const handleProductTypes = ({
  //   type,
  //   value,
  // }: {
  //   type: "size" | "color";
  //   value: string;
  // }) => {
  //   if (type === "color") {
  //     // Find the position/index of the selected color
  //     const colorIdx = product.colors.indexOf(value);

  //     // Get the size at the exact same position (fall back to first size or empty string)
  //     const matchingSize = product.sizes[colorIdx] ?? product.sizes[0] ?? "";

  //     setProductTypes({
  //       color: value,
  //       size: matchingSize,
  //     });
  //   } else {
  //     // If size changes directly, update size and optionally pair it with the color at the same index
  //     const sizeIdx = product.sizes.indexOf(value);
  //     const matchingColor = product.colors[sizeIdx] ?? product.colors[0] ?? "";

  //     setProductTypes({
  //       size: value,
  //       color: matchingColor,
  //     });
  //   }
  // };