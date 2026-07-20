import { ShippingFormInputs, shippingFormSchema } from "../type";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";


const ShippingForm = ({
    setShippingForm,
}: {
    setShippingForm: (data: ShippingFormInputs) => void;
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ShippingFormInputs>({
        resolver: zodResolver(shippingFormSchema),
    });

    const router = useRouter();

    const handleShippingForm: SubmitHandler<ShippingFormInputs> = (data) => {
        setShippingForm(data);
        router.push("/cart?step=3", { scroll: false });
    };

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(handleShippingForm)}
        >
            {/* Name */}
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="name"
                    className="text-xs text-gray-500 font-medium"
                >
                    Name
                </label>
                <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="border-b border-gray-200 py-2 outline-none text-sm"
                    {...register("name")}
                />
                {errors.name && (
                    <p className="text-xs text-red-500">
                        {errors.name.message}
                    </p>
                )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="email"
                    className="text-xs text-gray-500 font-medium"
                >
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    placeholder="johndoe@gmail.com"
                    className="border-b border-gray-200 py-2 outline-none text-sm"
                    {...register("email")}
                />
                {errors.email && (
                    <p className="text-xs text-red-500">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="phone"
                    className="text-xs text-gray-500 font-medium"
                >
                    Phone
                </label>
                <input
                    id="phone_number"
                    type="text"
                    placeholder="+880 1868236825"
                    className="border-b border-gray-200 py-2 outline-none text-sm"
                    {...register("phone")}
                />
                {errors.phone && (
                    <p className="text-xs text-red-500">
                        {errors.phone.message}
                    </p>
                )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="address"
                    className="text-xs text-gray-500 font-medium"
                >
                    Full Address
                </label>
                <input
                    id="full_address"
                    type="text"
                    placeholder="123 Main St, Baluchor"
                    className="border-b border-gray-200 py-2 outline-none text-sm"
                    {...register("address")}
                />
                {errors.address && (
                    <p className="text-xs text-red-500">
                        {errors.address.message}
                    </p>
                )}
            </div>

            {/* State */}
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="state"
                    className="text-xs text-gray-500 font-medium"
                >
                    State
                </label>
                <input
                    id="state"
                    type="text"
                    placeholder="Sylhet"
                    className="border-b border-gray-200 py-2 outline-none text-sm"
                    {...register("state")}
                />
                {errors.state && (
                    <p className="text-xs text-red-500">
                        {errors.state.message}
                    </p>
                )}
            </div>

            {/* City */}
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="city"
                    className="text-xs text-gray-500 font-medium"
                >
                    City
                </label>
                <input
                    id="city"
                    type="text"
                    placeholder="Zindabazar"
                    className="border-b border-gray-200 py-2 outline-none text-sm"
                    {...register("city")}
                />
                {errors.city && (
                    <p className="text-xs text-red-500">
                        {errors.city.message}
                    </p>
                )}
            </div>


            <button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
            >
                Continue
                <ArrowRight className="w-3 h-3" />
            </button>
        </form>
    );
};

export default ShippingForm;