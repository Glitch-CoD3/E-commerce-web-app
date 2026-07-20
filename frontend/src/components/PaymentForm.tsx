import { PaymentFormInputs, paymentFormSchema } from "../type";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";

const PaymentForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormInputs>({
    resolver: zodResolver(paymentFormSchema),
  });

  const router = useRouter();

  const handlePaymentForm: SubmitHandler<PaymentFormInputs> = (data) => {
    // Handle payment submission here
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(handlePaymentForm)}
    >
      {/* Name on Card */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="cardHolder"
          className="text-xs text-gray-500 font-medium"
        >
          Name on Card
        </label>
        <input
          id="cardHolder"
          type="text"
          placeholder="John Doe"
          className="border-b border-gray-200 py-2 outline-none text-sm"
          {...register("cardHolder")}
        />
        {errors.cardHolder && (
          <p className="text-xs text-red-500">
            {errors.cardHolder.message}
          </p>
        )}
      </div>

      {/* Card Number */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="cardNumber"
          className="text-xs text-gray-500 font-medium"
        >
          Card Number
        </label>
        <input
          id="cardNumber"
          type="text"
          placeholder="123456789123"
          className="border-b border-gray-200 py-2 outline-none text-sm"
          {...register("cardNumber")}
        />
        {errors.cardNumber && (
          <p className="text-xs text-red-500">
            {errors.cardNumber.message}
          </p>
        )}
      </div>

      {/* Expiration Date */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="expirationDate"
          className="text-xs text-gray-500 font-medium"
        >
          Expiration Date
        </label>
        <input
          id="expirationDate"
          type="text"
          placeholder="01/32"
          className="border-b border-gray-200 py-2 outline-none text-sm"
          {...register("expirationDate")}
        />
        {errors.expirationDate && (
          <p className="text-xs text-red-500">
            {errors.expirationDate.message}
          </p>
        )}
      </div>

      {/* CVV */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="cvv"
          className="text-xs text-gray-500 font-medium"
        >
          CVV
        </label>
        <input
          id="cvv"
          type="text"
          placeholder="123"
          className="border-b border-gray-200 py-2 outline-none text-sm"
          {...register("cvv")}
        />
        {errors.cvv && (
          <p className="text-xs text-red-500">
            {errors.cvv.message}
          </p>
        )}
      </div>

      {/* Payment Methods */}
      <div className="flex items-center gap-2 mt-4">
        <Image
          src="/klarna.png"
          alt="Klarna"
          width={50}
          height={25}
          className="rounded-md"
        />
        <Image
          src="/cards.png"
          alt="Cards"
          width={50}
          height={25}
          className="rounded-md"
        />
        <Image
          src="/stripe.png"
          alt="Stripe"
          width={50}
          height={25}
          className="rounded-md"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
      >
        Checkout
        <ShoppingCart className="w-3 h-3" />
      </button>
    </form>
  );
};

export default PaymentForm;