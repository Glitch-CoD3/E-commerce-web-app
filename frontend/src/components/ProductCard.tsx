"use client";

import { ProductType } from "../type";
import { LucideShoppingCart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

const ProductCard = ({ product }: { product: ProductType }) => {
  const [productTypes, setProductTypes] = useState(
    {
      size: product.sizes[0],
      color: product.colors[0]
    }
  )

  const handleProductTypes = ({ type, value }: { type: "size" | "color", value: string }) => {
    setProductTypes((prev) => (
      {
        ...prev,
        [type]: value
      }
    ))
  }

  return (
    <div className="shadow-lg rounded-lg overflow-hidden">
      <Link href={`/product/${product.id}`}>

        <div className="relative aspect-2/3">
          <Image src={product.images[productTypes.color]} alt={product.name} fill className="object-cover hover:scale-105 transition-all duration-300" />
        </div>

      </Link>

      {/* Product Details */}
      <div className="flex flex-col gap-4 p-4">
        <h1 className="font-medium"> {product.name} </h1>
        <p className="text-sm text-gray-500"> {product.shortDescription} </p>

        {/* PRODUCT TYPES */}
        <div className="flex items-center gap-4 text-xs">

          {/* PRODUCT SIZES */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-500"> Size </span>

            <select name="size" id="size" className="ring ring-gray-300 px-2 py-1 rounded-md"
              onChange={(e) => handleProductTypes({ type: "size", value: e.target.value })}
            >
              {
                product.sizes.map(size => (
                  <option key={size} value={size}>{size.toUpperCase()}</option>
                ))
              }
            </select>

          </div>
          {/* PRODUCT COLORS */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-500">Colors</span>

            <div className="flex items-center gap-1">
              {
                product.colors.map(color => (
                  <div className={`cursor-pointer border-1 ${productTypes.color === color ? "border-gray-500" : "border-gray-300"} rounded-full p-[1.2px] `} key={color} onClick={() => handleProductTypes({ type: "color", value: color })}>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                ))
              }
            </div>

          </div>

        </div>

        {/* PRICE & ADD TO CARDS BUTTON */}
        <div className="flex items-center justify-between">
          <p className="font-medium"> TK.{product.price.toFixed(2)} </p>
          <button className="flex gap-2 items-center ring-1 ring-gray-200 shadow-lg rounded-md px-2 py-1 text-sm cursor-pointer hover:text-white hover:bg-black transition-all duration-300">
            <LucideShoppingCart className="w-5 h-5" />
            Add To Cart
          </button>

        </div>

      </div>

    </div>
  )
}



export default ProductCard;