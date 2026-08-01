import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useCart } from "../hooks/useCart";

const CartDrawer = ({ isOpen, onClose, directBuyProduct = null }) => {
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart?.items || []);
  const user = useSelector((state) => state.auth?.user);
  const { handleGetCart, handleUpdateQuantity, handleRemoveItem, handleClearCart, handleCheckoutCart } = useCart();
  const [currentTab, setCurrentTab] = useState("cart"); // 'cart' | 'checkout' | 'success'

  // Fetch user cart when drawer opens
  useEffect(() => {
    if (isOpen && user) {
      handleGetCart();
    }
  }, [isOpen, user]);

  // Checkout Form State
  const [shippingInfo, setShippingInfo] = useState({
    fullname: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    paymentMethod: "cod",
  });

  if (!isOpen) return null;

  const itemsToDisplay = directBuyProduct
    ? [{ product: directBuyProduct.product, quantity: directBuyProduct.quantity || 1 }]
    : cartItems;

  const totalAmount = itemsToDisplay.reduce((acc, item) => {
    const p = item.product || {};
    const amt = Number(item.price?.amount || p.price?.amount || p.price || 0);
    return acc + amt * item.quantity;
  }, 0);

  const totalCount = itemsToDisplay.reduce((acc, item) => acc + item.quantity, 0);

  const formatCurrency = (amount, currency = "USD") => {
    const num = Number(amount || 0);
    if (currency === "USD" || currency === "$" || !currency) {
      return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingInfo.fullname || !shippingInfo.address || !shippingInfo.phone) {
      alert("Please fill in your name, address, and phone number.");
      return;
    }
    const itemsToProcess = directBuyProduct
      ? [{ productId: directBuyProduct.product._id, variantId: directBuyProduct.product.variantId, quantity: directBuyProduct.quantity || 1 }]
      : null;

    try {
      await handleCheckoutCart(itemsToProcess);
      setCurrentTab("success");
    } catch (err) {
      console.error("Order processing failed:", err);
    }
  };

  const goToFullCartPage = () => {
    onClose();
    navigate("/cart");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Main Drawer */}
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between p-6 shadow-2xl relative z-10 overflow-y-auto text-slate-900 font-sans">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <span
              onClick={goToFullCartPage}
              className="font-extrabold tracking-widest text-[#111827] text-base cursor-pointer hover:opacity-80 font-['Montserrat']"
            >
              LUXE MARKET
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • {currentTab === "cart" ? `Shopping Bag (${totalCount})` : currentTab === "checkout" ? "Checkout" : "Confirmed"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToFullCartPage}
              className="text-xs font-semibold text-[#904400] hover:underline px-2 py-1 bg-amber-50 rounded-md"
              title="Open full cart page"
            >
              Full Bag Page →
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors text-base font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab 1: Shopping Bag Items */}
        {currentTab === "cart" && (
          <div className="flex-1 flex flex-col justify-between my-4 space-y-4 overflow-hidden">
            {itemsToDisplay.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#111827] text-2xl">
                  🛍️
                </div>
                <h3 className="text-base font-bold text-[#111827] font-['Montserrat']">Your Bag is Empty</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Explore our curated collection of fine garments and modern luxury essentials.
                </p>
                <button
                  onClick={goToFullCartPage}
                  className="bg-[#904400] hover:bg-[#753100] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  View Full Cart Page
                </button>
              </div>
            ) : (
              <>
                {/* Item List */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {itemsToDisplay.map((item, idx) => {
                    const product = item.product;
                    if (!product) return null;
                    const img =
                      Array.isArray(product.images) && product.images.length > 0
                        ? typeof product.images[0] === "string"
                          ? product.images[0]
                          : product.images[0]?.url || ""
                        : "";

                    return (
                      <div
                        key={product._id || idx}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-3.5 items-center justify-between shadow-sm"
                      >
                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                          {img ? (
                            <img src={img} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-xs font-bold text-[#111827] truncate font-['Montserrat']">{product.title}</h4>
                          <p className="text-xs font-bold text-[#904400]">
                            {formatCurrency(product.price?.amount || product.price, product.price?.currency)}
                          </p>

                          {!directBuyProduct && (
                            <div className="flex items-center gap-3 pt-1">
                              <div className="flex items-center border border-slate-200 bg-white rounded-md">
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity({
                                      productId: product._id,
                                      variantId: item.variant?._id || item.variant || null,
                                      quantity: Math.max(1, item.quantity - 1),
                                    })
                                  }
                                  className="px-2 py-0.5 text-slate-700 font-bold text-xs hover:bg-slate-100"
                                >
                                  -
                                </button>
                                <span className="px-2.5 py-0.5 text-xs font-semibold text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity({
                                      productId: product._id,
                                      variantId: item.variant?._id || item.variant || null,
                                      quantity: item.quantity + 1,
                                    })
                                  }
                                  className="px-2 py-0.5 text-slate-700 font-bold text-xs hover:bg-slate-100"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() =>
                                  handleRemoveItem({
                                    productId: product._id,
                                    variantId: item.variant?._id || item.variant || null,
                                  })
                                }
                                className="text-[11px] text-red-600 font-medium hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bag Summary */}
                <div className="border-t border-slate-200 pt-4 space-y-3 shrink-0">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-wider">Subtotal</span>
                    <span className="text-base font-bold text-[#111827] font-['Montserrat']">{formatCurrency(totalAmount)}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={goToFullCartPage}
                      className="w-full bg-[#904400] hover:bg-[#753100] text-white font-bold text-xs py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      CHECKOUT (VIEW BAG PAGE) →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Checkout Form */}
        {currentTab === "checkout" && (
          <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between my-4 space-y-4">
            <div className="space-y-3 overflow-y-auto pr-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#904400]">Shipping Address</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Full Name *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.fullname}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, fullname: e.target.value })}
                  placeholder="Alex Morgan"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#904400]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                  placeholder="+1 555 123 4567"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#904400]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Street Address *</label>
                <textarea
                  required
                  rows={2}
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  placeholder="Street Address, Apt/Suite"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#904400]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">City</label>
                  <input
                    type="text"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    placeholder="New York"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#904400]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Zipcode</label>
                  <input
                    type="text"
                    value={shippingInfo.pincode}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, pincode: e.target.value })}
                    placeholder="10001"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#904400]"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold uppercase text-slate-500 block">Payment Method</label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800">
                  <input type="radio" checked readOnly className="accent-[#904400]" />
                  <span>Card / Cash on Delivery</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2 shrink-0">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase">Total Payable</span>
                <span className="text-base font-bold text-[#111827] font-['Montserrat']">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentTab("cart")}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold text-xs py-3.5 rounded-lg"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#904400] hover:bg-[#753100] text-white font-bold text-xs py-3.5 rounded-lg shadow-sm transition-all uppercase tracking-wider"
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: Success Confirmation */}
        {currentTab === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 text-2xl font-bold">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#111827] font-['Montserrat']">Order Placed Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Thank you for your order with Luxe Market. Your package will be prepared and delivered shortly.
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                setCurrentTab("cart");
              }}
              className="bg-[#111827] text-white font-bold text-xs px-6 py-3 rounded-lg shadow-sm"
            >
              Continue Shopping
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CartDrawer;
