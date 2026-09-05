"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createOrder, getShippingAddressByAddressId, getOrderByQueryId } from "../services/order.service";

const PaymentForm = () => {
  const searchParams = useSearchParams();
  const addressId = searchParams.get("addressId");

  const [addressDetails, setAddressDetails] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
  const [addressError, setAddressError] = useState<string>("");

  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createOrderResponse, setCreateOrderResponse] = useState<any>(null);

  // 1. Fetch Shipping Address on load
  useEffect(() => {
    if (!addressId) return;

    const fetchAddress = async () => {
      try {
        setLoadingAddress(true);
        setAddressError("");
        const res = await getShippingAddressByAddressId(Number(addressId));

        if (res?.success && res?.address) {
          setAddressDetails(res.address);
        } else if (res?.data) {
          setAddressDetails(res.data);
        } else {
          setAddressDetails(res);
        }
      } catch (err: any) {
        console.error("Failed to load shipping address:", err);
        setAddressError("Could not load address details.");
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddress();
  }, [addressId]);

  // 2. Handle Order Creation
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressId || !addressDetails) {
      alert("No shipping address selected. Please go back to step 2.");
      return;
    }

    if (!senderNumber || !transactionId) {
      alert("Please provide both sender number and transaction ID.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      address_id: Number(addressId),
      full_address: addressDetails.full_address || "",
      state: addressDetails.state || "",
      city: addressDetails.city || "",
      zip: addressDetails.zip_code || "",
      payment_method: paymentMethod,
      sender_number: senderNumber,
      transaction_id: transactionId,
    };

    try {
      const res = await createOrder(payload);
      console.log("Order Creation Response:", res);

      // Extract order ID safely across multiple response structures
      const fetchedOrderId = res?.data?.orderId;

      if ((res?.success || fetchedOrderId) && fetchedOrderId) {
        const createdOrder = await getOrderByQueryId(fetchedOrderId);
        setCreateOrderResponse(createdOrder);
        console.log("Fetched Created Order Details:", createdOrder);
      } else {
        alert(res?.message || "Failed to create order. Please try again.");
      }
    } catch (error: any) {
      console.error("Payment Submission Error:", error);
      alert(
        error?.response?.data?.message || "An error occurred while creating the order."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log("address", addressDetails)

  return (
    <div className="space-y-4">
      {/* Display Shipping Address Preview */}
      <div className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1">
        <p className="font-semibold text-gray-700">Shipping Address Details:</p>

        {!addressId && (
          <p className="text-red-500">No address selected. Please go back to Step 2.</p>
        )}

        {loadingAddress && <p className="text-gray-500">Loading address details...</p>}

        {addressError && <p className="text-red-500">{addressError}</p>}

        {addressDetails && (
          <div>
            <p className="font-medium text-gray-800">{addressDetails.full_address}</p>
            <p className="text-gray-600">
              {addressDetails.city}, {addressDetails.state} - {addressDetails.zip_code}
            </p>
            {addressDetails.phone_number && (
              <p className="text-gray-500">Phone: {addressDetails.phone_number}</p>
            )}
          </div>
        )}
      </div>

      {/* Payment Form */}
      <form onSubmit={handleOrderSubmit} className="space-y-4">
        <div className="flex gap-4 text-xs font-medium">
          {["bkash", "nagad", "rocket"].map((method) => (
            <label key={method} className="flex items-center gap-1 cursor-pointer capitalize">
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              {method}
            </label>
          ))}
        </div>

        <input
          type="text"
          placeholder="Sender Number (017...)"
          value={senderNumber}
          onChange={(e) => setSenderNumber(e.target.value)}
          className="border p-2 rounded w-full text-sm"
          required
        />

        <input
          type="text"
          placeholder="Transaction ID (e.g. 9J78A2KL)"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="border p-2 rounded w-full text-sm"
          required
        />

        <button
          type="submit"
          disabled={isSubmitting || !addressId || !addressDetails}
          className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white p-2 rounded-lg text-sm font-medium transition"
        >
          {isSubmitting ? "Processing Order..." : "Confirm Order"}
        </button>
      </form>

      {/* Optional: Render Success Confirmation Card when Order Created */}
      {createOrderResponse && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1 text-green-800">
          <p className="font-semibold">Order Placed Successfully!</p>
          <p>Order ID: #{createOrderResponse?.data?.id || createOrderResponse?.order_result?.order_details?.id}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;