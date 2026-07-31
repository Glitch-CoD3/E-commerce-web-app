"use client";

import Categories from "./Categories";
import { getAllProducts } from "../services/product.service";
import { useState, useEffect } from 'react';
import ProductCard from "./ProductCard";
import { ProductsType, ProductType } from "@/src/type";
import Link from "next/link";
import Filter from "./Filter";
import React from "react";


const ProductList = ({
  category,
  params,
}: {
  category: string;
  params: "Homepage" | "products";
}) => {
  const [products, setProducts] = useState<ProductType[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getAllProducts();
        console.log(response.all_products)
        setProducts(response.all_products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts =
    category && category !== "all"
      ? products.filter(
        (product) =>
          product.category_slug.toLowerCase() === category.toLowerCase()
      )
      : products;

  return (
    <div className="w-full">
      <Categories />

      {params === "products" && <Filter />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {params === "Homepage" && (
        <Link
          href={category ? `/products?category=${category}` : "/products"}
          className="flex justify-end mt-4 underline text-sm text-gray-500"
        >
          View All Products
        </Link>
      )}
    </div>
  );
};

export default ProductList;