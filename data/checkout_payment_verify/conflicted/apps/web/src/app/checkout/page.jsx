"use client";

import { useState, useMemo, memo } from "react";
import useCartStore from "@/utils/cartStore";
import SharedNavigation from "@/components/SharedNavigation";
import SharedFooter from "@/components/SharedFooter";
import {
  ShoppingBag,
  Truck,
  Shield,
  CreditCard,
  ArrowLeft,
} from "lucide-react";

const CartItem = memo(function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div className="border-b pb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm text-gray-500">{item.size}</div>
        </div>
        <button
          onClick={() => onRemove(item.id, item.size)}
          className="text-red-500 hover:text-red-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, item.size, -1)}
            className="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200"
          >
            -
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.size, 1)}
            className="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200"
          >
            +
          </button>
        </div>
        <div className="font-semibold">
          ${(item.price * item.quantity).toFixed(2)}
        </div>
      </div>
    </div>
  );
});

export default function Checkout() {
  // Get cart from store instead of local state
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    notes: "",
  });

  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [discountRate, setDiscountRate] = useState(0);

  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoize expensive calculations
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const shippingThreshold = 60;
  const shippingCost = useMemo(
    () => (subtotal >= shippingThreshold ? 0 : 5.0),
    [subtotal],
  );

  const discount = useMemo(
    () => (discountApplied ? subtotal * discountRate : 0),
    [discountApplied, subtotal, discountRate],
  );

  const total = useMemo(
    () => subtotal + shippingCost - discount,
    [subtotal, shippingCost, discount],
  );

  const applyDiscount = () => {
    const code = discountCode.toUpperCase();
    if (code === "GG") {
      setDiscountApplied(true);
      setDiscountRate(0.1);
      setDiscountError("");
    } else if (code === "TREATS20") {
      setDiscountApplied(true);
      setDiscountRate(0.2);
      setDiscountError("");
    } else {
      setDiscountError("Invalid discount code");
      setDiscountApplied(false);
      setDiscountRate(0);
    }
  };

  const removeDiscount = () => {
    setDiscountApplied(false);
    setDiscountCode("");
    setDiscountError("");
    setDiscountRate(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (
      !formData.customerName ||
      !formData.customerEmail ||
      !formData.shippingAddress ||
      !formData.shippingCity ||
      !formData.shippingState ||
      !formData.shippingZip
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order data
      const orderData = {
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        shipping_address: formData.shippingAddress,
        shipping_city: formData.shippingCity,
        shipping_state: formData.shippingState,
        shipping_zip: formData.shippingZip,
        notes: formData.notes,
        items: items,
        subtotal,
        shipping_cost: shippingCost,
        discount: discount,
        discount_code: discountApplied ? discountCode.toUpperCase() : "",
        total,
      };

      // Store order info in session storage for retrieval after payment
      sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));

      // Create Stripe Checkout Session
      // (Per Anything docs, /api routes are expected to be served by Anything. If you're serving this page
      // behind another host like Squarespace, you need an Anything subdomain for checkout/api.)
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderData,
          redirectURL: window.location.origin,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        const snippet = text?.slice?.(0, 200);
        throw new Error(
          `Checkout failed: server returned non-JSON response (${response.status}). ${snippet || ""}`,
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Checkout failed: ${data.details || data.error || "Unknown error"}`,
        );
      }

      if (!data.url) {
        throw new Error("Checkout failed: no Stripe URL returned");
      }

<<<<<<< ours
      console.log("Opening Stripe checkout:", data.url);

      // In Anything, the site often runs inside an iframe during building.
      // Open Stripe Checkout in a new window when possible.
      const popup = window.open(data.url, "_blank", "popup");
      if (!popup) {
        // Fallback if popups are blocked
        window.location.href = data.url;
      }
=======
      // In Anything builder the app runs inside an iframe; open in a popup.
      const popup = window.open(data.url, "_blank", "popup");
      if (!popup) {
        window.location.href = data.url;
      }
>>>>>>> theirs
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to process checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleUpdateQuantity = (id, size, delta) => {
    const item = items.find((i) => i.id === id && i.size === size);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      updateQuantity(id, size, newQuantity);
    }
  };

  const handleRemoveItem = (id, size) => {
    removeItem(id, size);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-cormorant">
      <SharedNavigation theme="dark" />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A1128] to-[#1E3A5F] text-white pt-28 md:pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Shop</span>
          </a>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Secure Checkout
          </h1>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-[#D4AF37]" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-[#D4AF37]" />
              <span>Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-[#D4AF37]" />
              <span>Powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-[#0A1128] mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Add some treats to get started!
            </p>
            <a
              href="/"
              className="inline-block bg-[#D4AF37] text-[#0A1128] px-8 py-3 rounded-full font-bold hover:bg-[#0A1128] hover:text-[#D4AF37] border-2 border-[#D4AF37] transition-all"
            >
              Shop Treats
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Order Form */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#D4AF37]/10">
                <h2 className="text-3xl font-bold text-[#0A1128] mb-6">
                  Shipping Information
                </h2>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="font-semibold mb-1">Payment Error</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerEmail: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerPhone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingCity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shippingCity: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingState}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shippingState: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingZip}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shippingZip: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      rows="3"
                      placeholder="Any special instructions or requests?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || items.length === 0}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4E4C1] text-[#0A1128] py-4 rounded-full font-bold text-xl hover:from-[#0A1128] hover:to-[#1E3A5F] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#0A1128] border-t-transparent rounded-full animate-spin"></div>
                        <span>Redirecting to Secure Payment...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={24} />
                        <span>Proceed to Secure Payment</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    🔒 Your payment information is secured by Stripe
                  </p>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 border border-[#D4AF37]/10">
                <h2 className="text-2xl font-bold text-[#0A1128] mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <CartItem
                      key={`${item.id}-${item.size}`}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>

                {/* Discount Code Section */}
                <div className="mb-6 pb-6 border-b">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Discount Code
                  </label>
                  {discountApplied ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="font-semibold text-green-700">
                          {discountCode.toUpperCase()} Applied
                        </span>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value);
                            setDiscountError("");
                          }}
                          placeholder="Enter code"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                        <button
                          onClick={applyDiscount}
                          className="bg-[#0A1128] text-white px-6 py-2 rounded-lg hover:bg-[#D4AF37] hover:text-[#0A1128] transition-all font-semibold"
                        >
                          Apply
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-red-600 text-sm mt-2">
                          {discountError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0
                        ? "FREE"
                        : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount ({discountRate === 0.2 ? "20%" : "10%"})
                      </span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  {subtotal > 0 && subtotal < shippingThreshold && (
                    <div className="text-sm text-green-600">
                      Add ${(shippingThreshold - subtotal).toFixed(2)} more for
                      free shipping!
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total</span>
                    <span className="text-[#D4AF37]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SharedFooter />
    </div>
  );
}
