"use client";

import { useEffect, useState, useCallback } from "react";
import { ShippingFormInputs, shippingFormSchema } from "../type";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, PlusCircle, Edit2, MapPin, CheckCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  getShippingAddressById,
  updateShippingAddress,
  createShippingAddress,
  deleteShippingAddress,
} from "../services/order.service";

import { getme } from "../services/user.service";

type SavedAddress = {
  id: number;
  full_address: string;
  phone_number: string;
  state: string;
  city: string;
  zip_code: string;
  is_default?: number;
};

type UserData = {
  id: number;
  full_name?: string;
  email?: string;
  phone_number?: string;
};

const ShippingForm = ({
  setShippingForm,
}: {
  setShippingForm: (data: ShippingFormInputs) => void;
}) => {
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Zip is managed OUTSIDE react-hook-form/Zod on purpose — the resolver
  // strips any key not declared in shippingFormSchema, which was silently
  // dropping this value before it ever reached the submit handler.
  const [zipCode, setZipCode] = useState<string>("");
  const [zipError, setZipError] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShippingFormInputs>({
    resolver: zodResolver(shippingFormSchema),
  });

  const router = useRouter();

  // Active address derived from list
  const currentAddress = Array.isArray(savedAddresses)
    ? savedAddresses.find((addr) => addr.id === selectedAddressId)
    : undefined;

  // Populates form fields, including zip (now via local state)
  const populateFormWithAddress = useCallback(
    (addr: SavedAddress, userData?: UserData | null) => {
      if (!addr || !addr.id) return;

      setSelectedAddressId(addr.id);
      setEditingAddressId(addr.id);
      setZipCode(addr.zip_code || "");
      setZipError("");

      reset({
        name: userData?.full_name || "",
        email: userData?.email || "",
        phone: addr.phone_number || userData?.phone_number || "",
        address: addr.full_address || "",
        state: addr.state || "",
        city: addr.city || "",
      } as unknown as ShippingFormInputs);
    },
    [reset]
  );

  // Initial data load on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const userRes = await getme();
        const currentUser: UserData | null = userRes?.user || null;

        if (!isMounted) return;
        setUser(currentUser);

        if (currentUser?.id) {
          const res = await getShippingAddressById(currentUser.id);

          if (!isMounted) return;

          // Direct array extraction from res.addresses
          const addresses: SavedAddress[] = res?.addresses || [];

          setSavedAddresses(addresses);

          if (addresses.length > 0) {
            const defaultAddr = addresses.find((a) => a.is_default === 1) || addresses[0];
            populateFormWithAddress(defaultAddr, currentUser);
          } else {
            setZipCode("");
            setZipError("");
            reset({
              name: currentUser.full_name || "",
              email: currentUser.email || "",
              phone: currentUser.phone_number || "",
              address: "",
              state: "",
              city: "",
            } as unknown as ShippingFormInputs);
          }
        }
      } catch (err) {
        console.error("Failed to load shipping or user data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [populateFormWithAddress, reset]);

  // Reset form state for new address creation
  const handleAddNew = () => {
    setSelectedAddressId(null);
    setEditingAddressId(null);
    setZipCode("");
    setZipError("");
    reset({
      name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone_number || "",
      address: "",
      state: "",
      city: "",
    } as unknown as ShippingFormInputs);
  };

  // Delete address action
  const handleDeleteAddress = async (e: React.MouseEvent, addressId: number) => {
    e.stopPropagation(); // Prevents triggering form population on parent div click

    if (!confirm("Are you sure you want to delete this shipping address?")) return;

    try {
      setDeletingId(addressId);
      await deleteShippingAddress(addressId);

      // Remove deleted item from local state list
      const updatedList = savedAddresses.filter((addr) => addr.id !== addressId);
      setSavedAddresses(updatedList);

      // If the currently selected/edited address was deleted, reset selection
      if (selectedAddressId === addressId || editingAddressId === addressId) {
        if (updatedList.length > 0) {
          populateFormWithAddress(updatedList[0], user);
        } else {
          handleAddNew();
        }
      }
    } catch (err) {
      console.error("Failed to delete shipping address:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Form submission handler — zip pulled from local state, never from RHF/Zod
  const handleShippingForm: SubmitHandler<ShippingFormInputs> = async (data) => {
    // Manual guard since zip is no longer covered by the Zod schema
    if (!zipCode.trim()) {
      setZipError("Zip code is required.");
      return;
    }
    setZipError("");

    try {
      const payload = {
        full_address: data.address || "",
        state: data.state || "",
        city: data.city || "",
        zip_code: zipCode.trim(),
      };

      // console.log("Sending payload to backend:", payload); // Verify payload matches Postman before request

      if (editingAddressId !== null && editingAddressId !== undefined) {
        await updateShippingAddress(editingAddressId, payload);
      } else {
        await createShippingAddress(payload);
      }

      setShippingForm({ ...data, zip_code: zipCode.trim() } as unknown as ShippingFormInputs);
      router.push("/cart?step=3", { scroll: false });
    } catch (err: any) {
      console.error("Error saving address:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Active Address Details */}
      {!loading && currentAddress && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-gray-700" /> Active Shipping Address
            </span>
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Selected
            </span>
          </div>
          <div className="text-sm text-gray-800 font-medium leading-tight">
            {currentAddress.full_address}
          </div>
          <div className="text-xs text-gray-500">
            {currentAddress.city}, {currentAddress.state} - {currentAddress.zip_code || "N/A"}
          </div>
          {currentAddress.phone_number && (
            <div className="text-xs text-gray-500">Phone: {currentAddress.phone_number}</div>
          )}
        </div>
      )}

      {/* Saved Addresses List */}
      {!loading && Array.isArray(savedAddresses) && savedAddresses.length > 0 && (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Saved Addresses
          </label>
          <div className="grid grid-cols-1 gap-2">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => populateFormWithAddress(addr, user)}
                className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center transition-all ${
                  selectedAddressId === addr.id
                    ? "border-gray-800 bg-gray-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="text-xs space-y-0.5">
                  <p className="font-medium text-gray-800">{addr.full_address}</p>
                  <p className="text-gray-500">
                    {addr.city}, {addr.state} - {addr.zip_code || "N/A"}
                  </p>
                  {addr.phone_number && <p className="text-gray-500">{addr.phone_number}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <Edit2 className="w-4 h-4 text-gray-400 hover:text-gray-700 transition-colors" />
                  <button
                    type="button"
                    disabled={deletingId === addr.id}
                    onClick={(e) => handleDeleteAddress(e, addr.id)}
                    className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600 transition-colors" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-1.5 text-xs text-gray-700 font-medium hover:underline mt-1 w-fit"
          >
            <PlusCircle className="w-4 h-4" /> Add New Address
          </button>
        </div>
      )}

      {/* Shipping Address Inputs */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleShippingForm)}>
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs text-gray-500 font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            className="border-b border-gray-200 py-2 outline-none text-sm"
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs text-gray-500 font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="johndoe@gmail.com"
            className="border-b border-gray-200 py-2 outline-none text-sm"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-xs text-gray-500 font-medium">
            Phone
          </label>
          <input
            id="phone"
            type="text"
            placeholder="+880 1868236825"
            className="border-b border-gray-200 py-2 outline-none text-sm"
            {...register("phone")}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Full Address */}
        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-xs text-gray-500 font-medium">
            Full Address
          </label>
          <input
            id="address"
            type="text"
            placeholder="123 Main St, Baluchor"
            className="border-b border-gray-200 py-2 outline-none text-sm"
            {...register("address")}
          />
          {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
        </div>

        {/* State */}
        <div className="flex flex-col gap-1">
          <label htmlFor="state" className="text-xs text-gray-500 font-medium">
            State
          </label>
          <input
            id="state"
            type="text"
            placeholder="Sylhet"
            className="border-b border-gray-200 py-2 outline-none text-sm"
            {...register("state")}
          />
          {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
        </div>

        {/* City */}
        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="text-xs text-gray-500 font-medium">
            City
          </label>
          <input
            id="city"
            type="text"
            placeholder="Zindabazar"
            className="border-b border-gray-200 py-2 outline-none text-sm"
            {...register("city")}
          />
          {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
        </div>

        {/* ZIP Code Input — plain controlled input, bypasses RHF/Zod entirely */}
        <div className="flex flex-col gap-1">
          <label htmlFor="zip_code" className="text-xs text-gray-500 font-medium">
            ZIP Code
          </label>
          <input
            id="zip_code"
            type="text"
            placeholder="3100"
            className="border-b border-gray-200 py-2 outline-none text-sm"
            value={zipCode}
            onChange={(e) => {
              setZipCode(e.target.value);
              if (zipError) setZipError("");
            }}
          />
          {zipError && <p className="text-xs text-red-500">{zipError}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : editingAddressId
            ? "Update & Continue"
            : "Save & Continue"}
          <ArrowRight className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};

export default ShippingForm;