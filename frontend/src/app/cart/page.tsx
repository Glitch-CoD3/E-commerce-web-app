"use client"

import PaymentForm from "@/src/components/PaymentForm";
import ShippingForm from "@/src/components/ShippingFrom";
import { CartItemsType } from "@/src/type";
import { ArrowRight, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";


const steps = [
  {
    id: 1,
    title: "Shopping Cart",
  },
  {
    id: 2,
    title: "Shipping Address",
  },
  {
    id: 3,
    title: "Payment Method",
  },
];

// TEMPORARY
const cartItems: CartItemsType = [
  {
    id: 1,
    name: "Adidas CoreFit T-Shirt",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 39.9,
    sizes: ["s", "m", "l", "xl", "xxl"],
    colors: ["gray", "purple", "green"],
    images: {
      gray: "/products/1g.png",
      purple: "/products/1p.png",
      green: "/products/1gr.png",
    },
    quantity: 1,
    selectedSize: "m",
    selectedColor: "gray",
  },
  {
    id: 2,
    name: "Puma Ultra Warm Zip",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 59.9,
    sizes: ["s", "m", "l", "xl"],
    colors: ["gray", "green"],
    images: { gray: "/products/2g.png", green: "/products/2gr.png" },
    quantity: 1,
    selectedSize: "l",
    selectedColor: "gray",
  },
  {
    id: 3,
    name: "Nike Air Essentials Pullover",
    shortDescription:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    description:
      "Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.",
    price: 69.9,
    sizes: ["s", "m", "l"],
    colors: ["green", "blue", "black"],
    images: {
      green: "/products/3gr.png",
      blue: "/products/3b.png",
      black: "/products/3bl.png",
    },
    quantity: 1,
    selectedSize: "l",
    selectedColor: "black",
  },
];

const CartPage = () => {
  const [shippingForm, setShippingForm] = useState(null);
  const searchParams = useSearchParams()
  const router = useRouter();

  const activeStep = parseInt(searchParams.get("step") || "1")


  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-8">
      {/* TITLE */}
      <h1 className="text-2xl font-medium">Your Shopping Cart</h1>

      {/* STEPS */}
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        {
          steps.map(step => (
            <div className={`flex items-center gap-2 pb-4 border-b-2 ${step.id === activeStep ? "border-gray-800" : "border-gray-200"}`} key={step.id}>

              <div className={`w-6 h-6 rounded-full text-white p-4 flex items-center justify-center bg-black ${step.id === activeStep ? "bg-gray-800" : "bg-gray-400"}`}> {step.id}</div>
              <p className={`text-sm ${step.id === activeStep ? "text-gray-800" : "text-gray-400"}`}>{step.title}</p>
            </div>
          ))
        }
      </div>

      {/* STEPS & DETAILS */}
      <div className="w-full flex flex-col lg:flex-row gap-16">
        {/* STEPS */}
        <div className="w-full lg:w-7/12 shadow-lg border border-gray-100 p-8 rounded-lg flex flex-col gap-8">
          {activeStep === 1 && cartItems.map((item) => (
            //SINGLE CART ITEMS
            <div className="flex items-center justify-between" key={item.id}>

              {/* IMAGE && DETAILS */}
              <div className="flex gap-8">

                {/* IMAGE BOX */}
                <div className="relative w-32 h-32 bg-gray-50 rounded-lg overflow-hidden">
                  <Image src={item.images[item.selectedColor]} alt={item.name} fill className="object-contain" />
                </div>

                {/* ITEM DETAILS BOX */}
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                    <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                    <p className="text-xs text-gray-500">Color: {item.selectedColor}</p>
                  </div>
                  <p className="font-medium">TK {item.price.toFixed(2)}</p>
                </div>
              </div>
              {/* DELETE BUTTON */}
              <button className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-all duration-300 text-red-400 flex items-center justify-center cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>

            </div>
          ))}

          {activeStep === 2 && (
            <ShippingForm />
          )}

          {activeStep === 3 && (
            shippingForm ? (
              <PaymentForm />
            ) : (
              <p>Please fill in the shipping form to continue.</p>
            )
          )}
        </div>

        {/* DETAILS */}
        <div className="w-full lg:w-5/12 shadow-lg border-2 border-gray-100 p-8 rounded-lg flex flex-col gap-8 h-max">
          <h2 className="font-semibold">Cart Details</h2>

          {/* subtotal */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Subtoal</p>
              <p className="font-medium">TK.{cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Discount */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Discount(10%)</p>
              <p className="font-medium">TK.50</p>
            </div>
          </div>

          {/* Shipping Fee */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Shipping Fee</p>
              <p className="font-medium">TK.120</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Total Amount */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between">
              <p className="text-gray-800">Total Amount</p>
              <p className="font-semibold">TK.{cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</p>
            </div>
          </div>
          {activeStep === 1 && (<button onClick={() => router.push("/cart?step=2", { scroll: false })}
            className="w-full bg-gray-800 hover:bg-gray-900 transitaion-all duration-300 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center">
            Continue
            <ArrowRight />
          </button>)
          }
        </div>
      </div>
    </div>
  );
};

export default CartPage;