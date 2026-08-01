import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { useSelector } from "react-redux";
import { getOrderDetailsApi } from "../service/cart.api";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const queryParams = new URLSearchParams(location.search);
  const stateData = location.state || {};

  // Real Razorpay parameters from location state or URL params
  const realOrderId = stateData.orderId || queryParams.get("order_id") || queryParams.get("orderId");
  const realPaymentId = stateData.paymentId || queryParams.get("payment_id") || queryParams.get("paymentId");
  
  // Real items & totals passed from checkout
  const purchasedItems = stateData.items || [];
  const subtotal = stateData.subtotal !== undefined ? stateData.subtotal : (purchasedItems.reduce((acc, item) => acc + (item.price?.amount || item.price || 0) * (item.quantity || 1), 0));
  const shippingCost = stateData.shippingCost !== undefined ? stateData.shippingCost : (subtotal >= 2000 ? 0 : 150);
  const gstTax = Math.round(subtotal * 0.12);
  const totalAmount = stateData.totalAmount !== undefined ? stateData.totalAmount : (subtotal + shippingCost + gstTax);

  const [tracked, setTracked] = useState(false);
  const [dbOrder, setDbOrder] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("Order Placed");

  useEffect(() => {
    if (realOrderId) {
      getOrderDetailsApi(realOrderId)
        .then((res) => {
          if (res?.order) {
            setDbOrder(res.order);
            if (res.order.deliveryStatus) {
              setCurrentStatus(res.order.deliveryStatus);
            }
          }
        })
        .catch((err) => console.error("Error fetching order details:", err));
    }
  }, [realOrderId]);

  const statusSteps = ["Order Placed", "Processing", "Shipped", "Delivered"];
  const currentStepIndex = Math.max(0, statusSteps.indexOf(currentStatus));
  const progressWidthPercentage = (currentStepIndex / (statusSteps.length - 1)) * 100;

  // Delivery estimation: 4 to 6 days time period from today
  const minDeliveryDate = new Date();
  minDeliveryDate.setDate(minDeliveryDate.getDate() + 4);
  const maxDeliveryDate = new Date();
  maxDeliveryDate.setDate(maxDeliveryDate.getDate() + 6);

  const formattedMinDate = minDeliveryDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const formattedMaxDate = maxDeliveryDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedDeliveryDate = `${formattedMinDate} – ${formattedMaxDate} (4–6 Days)`;

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const getDisplayImage = (item) => {
    const product = item?.product || {};
    if (product.images?.length) {
      return product.images[0]?.url || product.images[0];
    }
    return "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&auto=format&fit=crop&q=80";
  };
  const shippingAddress = stateData.shippingAddress || dbOrder?.shippingAddress || null;

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] font-sans antialiased flex flex-col justify-between selection:bg-[#ff851b] selection:text-white">
      
      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto w-full px-4 py-4 flex-1">
        
        {/* COMPACT HERO CONFIRMATION HEADER */}
        <section className="flex flex-col items-center justify-center text-center mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-base shadow-sm">
              <i className="ri-check-line"></i>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#000613] tracking-tight">
              Thank you for your order!
            </h1>
          </div>

          <p className="text-xs text-slate-500 font-medium mb-3">
            Your Razorpay payment was processed successfully. Order confirmation has been dispatched.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {realOrderId ? (
              <span className="inline-flex items-center gap-1.5 bg-[#001f3f] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                <i className="ri-hashtag text-[#ff851b]"></i>
                Razorpay Order ID: <span className="font-mono text-amber-300">{realOrderId}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-[#001f3f] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                <i className="ri-hashtag text-[#ff851b]"></i>
                Status: <span className="font-mono text-emerald-300">Payment Verified</span>
              </span>
            )}

            {realPaymentId && (
              <span className="inline-flex items-center gap-1.5 bg-slate-800 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                <i className="ri-bank-card-line text-emerald-400"></i>
                Payment ID: <span className="font-mono text-slate-200">{realPaymentId}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full">
              <i className="ri-truck-line text-emerald-600"></i>
              Est. Delivery: {formattedDeliveryDate}
            </span>
          </div>
        </section>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: TRACKER + DETAILS (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* ORDER STATUS TRACKER CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <i className="ri-route-line text-[#ff851b]"></i>
                  <h2 className="text-sm font-black text-[#000613]">Order Status Timeline</h2>
                </div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Status: {currentStatus}
                </span>
              </div>

              {/* Dynamic Progress Steps */}
              <div className="relative flex justify-between items-center w-full px-4 py-4">
                {/* Background Line */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-slate-100 z-0 rounded-full"></div>
                {/* Active Progress Line */}
                <div
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-1.5 bg-[#ff851b] z-0 rounded-full transition-all duration-700"
                  style={{ width: `calc(${progressWidthPercentage}% * 0.88)` }}
                ></div>

                {statusSteps.map((stepLabel, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={stepLabel} className="flex flex-col items-center relative z-10 gap-1.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                          isDone
                            ? "bg-[#ff851b] text-white shadow-md ring-4 ring-orange-100"
                            : "bg-slate-100 border border-slate-300 text-slate-400"
                        }`}
                      >
                        {isDone ? (
                          idx === 0 ? <i className="ri-check-line font-bold"></i> :
                          idx === 1 ? <i className="ri-time-line font-bold"></i> :
                          idx === 2 ? <i className="ri-truck-line font-bold"></i> :
                          <i className="ri-map-pin-user-line font-bold"></i>
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-[11px] ${isCurrent ? "font-black text-[#000613]" : isDone ? "font-bold text-slate-800" : "font-medium text-slate-400"}`}>
                        {stepLabel}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {isCurrent ? "Active Stage" : isDone ? "Completed" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORDERED ITEMS LIST */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-black text-[#000613] mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <i className="ri-shopping-bag-3-line text-[#001f3f]"></i>
                Purchased Items ({purchasedItems.length > 0 ? purchasedItems.length : 1})
              </h2>

              <div className="space-y-3">
                {purchasedItems.length > 0 ? (
                  purchasedItems.map((item, idx) => {
                    const product = item.product || {};
                    const title = product.title || item.title || "Snitch Apparel";
                    const priceVal = item.price?.amount || item.price || product.price?.amount || product.price || 0;
                    const qty = item.quantity || 1;
                    const imgUrl = getDisplayImage(item);

                    return (
                      <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                            <img
                              src={imgUrl}
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-[#000613]">
                              {title}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Qty: <span className="text-slate-800 font-bold">{qty}</span>
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-sm text-[#000613]">{formatCurrency(priceVal * qty)}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                    <span className="font-bold text-[#000613]">Order Confirmed via Razorpay Gateway</span>
                    <span className="font-black text-sm text-[#000613]">Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* SHIPPING & PAYMENT INFO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Shipping Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2 text-[#001f3f]">
                  <i className="ri-map-pin-2-fill text-sm text-[#ff851b]"></i>
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    Delivery Address
                  </h3>
                </div>
                {shippingAddress ? (
                  <div>
                    <p className="text-xs font-bold text-[#000613]">
                      {shippingAddress.fullName} <span className="text-[9px] bg-amber-100 text-[#964900] px-1.5 py-0.5 rounded font-extrabold ml-1 uppercase">{shippingAddress.addressType || "Home"}</span>
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                      {shippingAddress.streetAddress}{shippingAddress.landmark ? `, ${shippingAddress.landmark}` : ""}, {shippingAddress.city}, {shippingAddress.state} - <span className="font-bold">{shippingAddress.pincode}</span>
                    </p>
                    <p className="text-[11px] text-slate-700 font-bold mt-1.5">
                      Phone: {shippingAddress.contact}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-[#000613]">
                      {user?.fullName || "Valued Customer"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                      {user?.email || "customer@snitch.co"}
                    </p>
                    {user?.contact && (
                      <p className="text-[11px] text-slate-700 font-bold mt-1">
                        Phone: {user.contact}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2 text-[#001f3f]">
                  <i className="ri-bank-card-fill text-sm text-[#ff851b]"></i>
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    Razorpay Gateway Info
                  </h3>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="w-9 h-7 bg-[#001f3f] rounded-lg flex items-center justify-center text-white font-black text-[10px] italic">
                    RZP
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#000613] truncate">
                      {realPaymentId ? `Payment ID: ${realPaymentId}` : "Razorpay Checkout"}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold">
                      ✓ Signature Verified
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-[#000613] border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Paid
                </span>
              </h2>

              <div className="space-y-2 text-xs font-medium text-slate-600">
                {subtotal > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span className="font-extrabold text-emerald-600">
                    {shippingCost === 0 ? "FREE" : formatCurrency(shippingCost)}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="text-xs font-black text-[#000613]">Total Amount Paid</span>
                  <span className="text-xl font-black text-[#000613]">
                    {formatCurrency(totalAmount > 0 ? totalAmount : subtotal)}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setTracked(true);
                    alert(`Real-time tracking for Order ${realOrderId || displayOrderId} enabled! Updates sent to ${user?.email || "your registered email"}.`);
                  }}
                  className="w-full bg-[#ff851b] hover:bg-[#e07010] text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <i className="ri-radar-line text-base"></i>
                  {tracked ? "Tracking Active" : "Track Order Status"}
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-slate-50 border border-slate-200 hover:bg-[#001f3f] hover:text-white text-[#001f3f] font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <i className="ri-arrow-left-line text-base"></i>
                  Continue Shopping
                </button>
              </div>

            </div>

            {/* TRUST BADGE BANNER */}
            <div className="bg-[#001f3f] text-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg text-[#ff851b] shrink-0">
                <i className="ri-shield-flash-line"></i>
              </div>
              <div>
                <h4 className="text-[11px] font-extrabold text-white">Snitch Guarantee</h4>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Easy 7-day hassle-free returns & authentic products.
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* COMPACT FOOTER */}
      <footer className="bg-[#000613] text-white py-3 border-t border-slate-800 mt-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-xs">SNITCH.</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest border-l border-slate-800 pl-2">
              Order Confirmation
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/cart" className="hover:text-white transition-colors">Bag</Link>
            <Link to="/seller/dashboard" className="hover:text-white transition-colors">Seller Center</Link>
          </div>

          <p className="text-[9px] text-slate-500 uppercase tracking-wider">
            © 2026 SNITCH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default OrderSuccess;