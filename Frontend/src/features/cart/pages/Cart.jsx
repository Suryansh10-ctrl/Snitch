import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../../auth/hooks/useAuth";
import { Link, useNavigate } from "react-router";
import { useRazorpay } from "react-razorpay";
import { getUserAddressesApi, addAddressApi } from "../service/address.api";
import toast from "react-hot-toast";

const RECENTLY_VIEWED_ITEMS = [
  {
    id: "rv1",
    title: "Geometric Silk Tie",
    price: 1450,
    currency: "INR",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "rv2",
    title: "Gold Frame Aviators",
    price: 3200,
    currency: "INR",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "rv3",
    title: "Midnight Suede Candle",
    price: 650,
    currency: "INR",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
    category: "Home",
  },
  {
    id: "rv4",
    title: "Cashmere Sleep Socks",
    price: 850,
    currency: "INR",
    image: "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=600&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
];

const Cart = () => {
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth?.user);
  const { handleGetCart, handleUpdateQuantity, handleRemoveItem, handleClearCart, handleCheckoutCart, handleCreateCartOrder, handleVerifyCartOrder } = useCart();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const { error, isLoading, Razorpay } = useRazorpay();

  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  const [newAddress, setNewAddress] = useState({
    fullName: user?.fullName || "",
    contact: user?.contact || "",
    streetAddress: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    addressType: "Home",
  });

  const fetchAddresses = async () => {
    try {
      setLoadingAddress(true);
      const res = await getUserAddressesApi();
      if (res?.addresses) {
        setAddresses(res.addresses);
        if (res.addresses.length > 0 && !selectedAddress) {
          const defaultAddr = res.addresses.find((a) => a.isDefault) || res.addresses[0];
          setSelectedAddress(defaultAddr);
        }
      }
    } catch (err) {
      console.error("Failed to load user addresses:", err);
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    handleGetCart();
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const handleCreateNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.contact || !newAddress.streetAddress || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error("Please fill in all required address fields (*)");
      return;
    }
    try {
      setSubmittingAddress(true);
      const res = await addAddressApi(newAddress);
      toast.success("Delivery address saved to MongoDB! 📍");
      if (res?.addresses) {
        setAddresses(res.addresses);
        const newlyAdded = res.address || res.addresses[0];
        setSelectedAddress(newlyAdded);
      }
      setShowNewAddressForm(false);
      setNewAddress({
        fullName: user?.fullName || "",
        contact: user?.contact || "",
        streetAddress: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        addressType: "Home",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save address to database.");
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleStartCheckout = async () => {
    await fetchAddresses();
    setShowAddressModal(true);
  };

  async function handleProceedToPayment(addrToUse = selectedAddress) {
    if (!addrToUse) {
      toast.error("Please select or add a shipping address first!");
      setShowNewAddressForm(true);
      return;
    }

    try {
      setShowAddressModal(false);
      const order = await handleCreateCartOrder(totalAmount, addrToUse);

      const options = {
        key: "rzp_test_TKFijdiyhxh4Y3",
        amount: order.amount,
        currency: order.currency,
        name: "Snitch",
        description: "Apparel Order Purchase",
        order_id: order.id,
        handler: async (response) => {
          const isValid = await handleVerifyCartOrder(response);

          if (isValid) {
            const purchasedItems = [...items];
            const finalSubtotal = subtotal;
            const finalShipping = shippingCost;
            const finalTotal = totalAmount;

            await handleCheckoutCart(items);

            navigate(`/order-success?order_id=${response?.razorpay_order_id}&payment_id=${response?.razorpay_payment_id}`, {
              state: {
                orderId: response?.razorpay_order_id,
                paymentId: response?.razorpay_payment_id,
                items: purchasedItems,
                subtotal: finalSubtotal,
                shippingCost: finalShipping,
                totalAmount: finalTotal,
                shippingAddress: addrToUse
              }
            });
          }
        },
        prefill: {
          name: addrToUse.fullName || user?.fullName,
          email: user?.email,
          contact: addrToUse.contact || user?.contact,
        },
        theme: {
          color: "#001f3f",
        },
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      toast.error("Failed to initiate payment. Please try again.");
    }
  }

  const changeQty = async (productId, variantId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await handleRemoveItem({ productId, variantId });
    } else {
      await handleUpdateQuantity({ productId, variantId, quantity: newQty });
    }
  };

  const getVariantDetails = (product, variantId) => {
    if (!product?.variants || !variantId) return null;
    return product.variants.find
      ? product.variants.find((v) => v._id?.toString() === variantId?.toString())
      : null;
  };

  const getDisplayImage = (product, variant) => {
    if (variant?.images?.length) return variant.images[0]?.url || variant.images[0];
    if (product?.images?.length) return product.images[0]?.url || product.images[0];
    return null;
  };

  const formatCurrency = (amount, currency = "INR") => {
    const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
    const symbol = symbols[currency] || "₹";
    return `${symbol}${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const items = cart?.items || [];
  const cartItemsCount = items.reduce((t, i) => t + (i.quantity || 1), 0);
  const subtotal = cart?.totalPrice || items.reduce((acc, i) => acc + (i.price?.amount || i.price || 0) * (i.quantity || 1), 0);
  const isFreeShipping = subtotal >= 2000;
  const shippingCost = isFreeShipping ? 0 : 150;
  const totalAmount = subtotal + shippingCost;
  

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] font-sans antialiased flex flex-col justify-between selection:bg-[#ff851b] selection:text-white">

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex-1">

        {/* Page Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#000613]">
            Your Shopping Bag
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {cartItemsCount > 0
              ? `${cartItemsCount} ${cartItemsCount === 1 ? "item" : "items"} in your cart. ${isFreeShipping ? "Eligible for Complimentary Express Shipping." : `Add ${formatCurrency(2000 - subtotal)} more for free shipping.`}`
              : "Your bag is empty. Explore our curated catalog of apparel and drops."}
          </p>
        </div>

        {items.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 my-8 shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-4xl text-[#000613]">
              🛍️
            </div>
            <h2 className="text-2xl font-extrabold text-[#000613]">Your Bag is Currently Empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Discover curated luxury apparel, limited edition drops, and modern wardrobe essentials.
            </p>
            <Link
              to="/"
              className="mt-2 inline-flex items-center gap-2 bg-[#ff851b] hover:bg-[#e07010] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md transition-all"
            >
              Explore Products →
            </Link>
          </div>
        ) : (
          /* CART ACTIVE GRID */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* CART ITEMS (8 columns) */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item, index) => {
                const product = item.product || {};
                const variantId = item.variant;
                const variantDetail = getVariantDetails(product, variantId);
                const imageUrl = getDisplayImage(product, variantDetail);
                const rawDisplayPrice = item.price || variantDetail?.price || product?.price || { amount: 0, currency: "INR" };
                const rawVariantPrice = product?.price || variantDetail?.price || rawDisplayPrice;
                const displayPrice = typeof rawDisplayPrice === "object" && rawDisplayPrice?.amount !== undefined
                  ? { amount: Number(rawDisplayPrice.amount) || 0, currency: rawDisplayPrice.currency || "INR" }
                  : { amount: Number(rawDisplayPrice) || 0, currency: "INR" };
                const variantPrice = typeof rawVariantPrice === "object" && rawVariantPrice?.amount !== undefined
                  ? { amount: Number(rawVariantPrice.amount) || 0, currency: rawVariantPrice.currency || "INR" }
                  : { amount: Number(rawVariantPrice) || 0, currency: "INR" };
                const qty = item.quantity || 1;
                const stock = variantDetail?.stock !== undefined ? variantDetail.stock : (product?.stock !== undefined ? product.stock : 10);
                const attributes = variantDetail?.attributes || {};
                const color = variantDetail?.color || product?.color || "Default";
                const size = attributes.size || attributes.Size || "Standard";

                return (
                  <div
                    key={item._id ? `${item._id}_${index}` : `${product._id || "prod"}_${variantId || "var"}_${index}`}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-stretch sm:items-center justify-between shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Item Image */}
                    <div className="w-full sm:w-28 h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 relative">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-extrabold text-base sm:text-lg text-[#000613] hover:text-[#964900] transition-colors cursor-pointer" onClick={() => navigate(`/product/${product._id}`)}>
                            {product.title || "Untitled Product"}
                          </h3>
                          <span className="font-extrabold text-base sm:text-lg text-[#000613] whitespace-nowrap">
                            {formatCurrency(displayPrice.amount || displayPrice, displayPrice.currency)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Size: <span className="text-slate-800 font-bold">{size}</span> | Color: <span className="text-slate-800 font-bold">{color}</span>
                        </p>

                        <div className="flex items-center gap-1.5 mt-2 text-xs font-bold">
                          {stock > 5 ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px]">
                              ✓ In Stock
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px]">
                              ⚠ Only {stock} left
                            </span>
                          )}
                        </div>
                        {displayPrice.amount !== variantPrice.amount && (
                          variantPrice.amount > displayPrice.amount
                            ? <p className="text-emerald-700 text-xs font-semibold mt-1"> you save {variantPrice.amount - displayPrice.amount} rupees. you will get the product at {displayPrice.amount} now. </p>
                            : <p className="text-red-600 text-xs font-semibold mt-1"> Price increased by {displayPrice.amount - variantPrice.amount} rupees. You will get the product at {displayPrice.amount} now. </p>
                        )}
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => changeQty(product._id, variantId, qty, -1)}
                            className="px-3 py-1 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-extrabold text-slate-900 bg-white">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQty(product._id, variantId, qty, 1)}
                            className="px-3 py-1 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem({ productId: product._id, variantId })}
                          className="text-xs text-red-600 font-bold hover:text-red-700 hover:underline flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Gift Message Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <button
                  onClick={() => setGiftOpen(!giftOpen)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-[#964900] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <i className="ri-gift-line text-[#ff851b] text-sm"></i> Add a gift message or delivery notes
                  </span>
                  <span className="text-slate-400 text-sm">{giftOpen ? "▲" : "▼"}</span>
                </button>
                {giftOpen && (
                  <textarea
                    rows={3}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Enter gift message or special instructions..."
                    className="w-full mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] text-slate-900"
                  />
                )}
              </div>
            </div>

            {/* ORDER SUMMARY SIDEBAR (4 columns) */}
            <div className="lg:col-span-4 space-y-4 sticky top-24">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-extrabold text-[#000613] border-b border-slate-100 pb-3">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs font-medium text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Subtotal ({cartItemsCount} items)</span>
                    <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Estimated Delivery</span>
                    <span className={`font-extrabold ${isFreeShipping ? "text-emerald-600" : "text-slate-900"}`}>
                      {isFreeShipping ? "FREE" : formatCurrency(shippingCost)}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span className="text-sm font-extrabold text-[#000613]">Total Amount</span>
                    <span className="text-xl font-black text-[#000613]">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleStartCheckout}
                  className="w-full bg-[#ff851b] hover:bg-[#e07010] text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  Proceed to Checkout →
                </button>

                <p className="text-[11px] text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                  <i className="ri-[#000613] ri-[#001f3f] ri-lock-2-line text-slate-400"></i> 256-Bit SSL Encrypted Checkout
                </p>

                {/* Promo Code Box */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Promo Code / Voucher
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f]"
                    />
                    <button
                      onClick={() => alert(promoCode ? `Promo code "${promoCode}" applied!` : "Please enter a code.")}
                      className="bg-[#000613] hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#001f3f] text-white rounded-2xl p-4 flex items-center gap-3 shadow-md">
                <i className="ri-truck-line text-2xl text-amber-400"></i>
                <div>
                  <h4 className="text-xs font-bold">Complimentary Express Shipping</h4>
                  <p className="text-[10px] text-slate-300 mt-0.5">Orders over ₹2,000 arrive within 4–6 business days.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* RECENTLY VIEWED / RECOMMENDED SECTION */}
        <section className="mt-16 pt-12 border-t border-slate-200">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#000613]">Recently Viewed</h2>
              <p className="text-xs text-slate-500 mt-1">Recommended luxury essentials for your style.</p>
            </div>
            <button onClick={() => navigate("/")} className="text-xs font-bold text-[#964900] hover:underline">
              Browse All Drops →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {RECENTLY_VIEWED_ITEMS.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate("/")}
                className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/90 text-slate-900 shadow-sm">
                    {item.category}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#000613] group-hover:text-[#964900] transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs font-extrabold text-[#000613] mt-0.5">
                    {formatCurrency(item.price, item.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ADDRESS SELECTION & CREATION MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#000613] flex items-center gap-2">
                  <span>📍</span> Select Delivery Address
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select or add a shipping destination stored in MongoDB.
                </p>
              </div>
              <button
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Saved Addresses List */}
            {!showNewAddressForm ? (
              <div className="space-y-4">
                {addresses.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddress?._id === addr._id;
                      return (
                        <div
                          key={addr._id}
                          onClick={() => setSelectedAddress(addr)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#ff851b] bg-amber-50/50 shadow-sm"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="deliveryAddress"
                                checked={isSelected}
                                onChange={() => setSelectedAddress(addr)}
                                className="accent-[#ff851b] w-4 h-4 cursor-pointer"
                              />
                              <span className="font-extrabold text-xs text-[#000613]">
                                {addr.fullName}
                              </span>
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                {addr.addressType || "Home"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 font-medium mt-2 pl-6 leading-relaxed">
                            {addr.streetAddress}
                            {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - <span className="font-bold text-slate-800">{addr.pincode}</span>
                          </p>

                          <p className="text-[11px] text-slate-500 font-bold mt-1.5 pl-6">
                            Contact: {addr.contact}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <p className="text-xs text-slate-500 font-medium">
                      No saved delivery addresses found in database.
                    </p>
                  </div>
                )}

                {/* Add New Address Button */}
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#000613] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <span>+</span> Add New Shipping Address
                </button>

                {/* Confirm & Pay Button */}
                <button
                  onClick={() => handleProceedToPayment(selectedAddress)}
                  disabled={!selectedAddress}
                  className="w-full py-3.5 bg-[#ff851b] hover:bg-[#e07010] disabled:bg-slate-300 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Confirm Address & Pay via Razorpay →
                </button>
              </div>
            ) : (
              /* Add New Address Form */
              <form onSubmit={handleCreateNewAddress} className="space-y-3">
                <div className="flex justify-between items-center pb-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Add New Address (Saved to MongoDB)
                  </h4>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="text-xs text-[#964900] font-bold hover:underline"
                    >
                      ← Back to Saved Addresses
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Contact *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.contact}
                      onChange={(e) => setNewAddress({ ...newAddress, contact: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Street Address / House No / Area *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.streetAddress}
                    onChange={(e) => setNewAddress({ ...newAddress, streetAddress: e.target.value })}
                    placeholder="Flat / House No., Colony, Street"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">City *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">State *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      placeholder="400001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={newAddress.landmark}
                      onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                      placeholder="Near Landmark / Mall"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Address Type</label>
                    <select
                      value={newAddress.addressType}
                      onChange={(e) => setNewAddress({ ...newAddress, addressType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#001f3f] mt-1 font-bold text-slate-800"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingAddress}
                    className="flex-1 py-3 bg-[#000613] hover:bg-[#001f3f] disabled:bg-slate-400 text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
                  >
                    {submittingAddress ? "Saving Address..." : "Save Address to Database 💾"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* COMPACT MINIMAL FOOTER (Identical to Home page footer) */}
      <footer className="bg-[#000613] text-white py-5 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-tight text-white text-sm">SNITCH.</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest border-l border-slate-800 pl-3">
              Curated Apparel Market
            </span>
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            <button onClick={() => navigate("/")} className="hover:text-white transition-colors">
              Shop
            </button>
            <button onClick={() => navigate("/cart")} className="hover:text-white transition-colors">
              Shopping Bag
            </button>
            <button onClick={() => navigate("/seller/dashboard")} className="hover:text-white transition-colors">
              Merchant Center
            </button>
          </div>

          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            © 2026 SNITCH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Cart;
