import React, { useEffect, useState } from "react";
import { getUserOrdersApi } from "../service/cart.api";
import { useNavigate, Link } from "react-router";
import { useSelector } from "react-redux";

const MyOrders = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const res = await getUserOrdersApi();
      if (res?.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error("Failed to load user orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const formatCurrency = (amount, currency = "INR") => {
    const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
    const symbol = symbols[currency] || "₹";
    return `${symbol}${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const statusSteps = ["Order Placed", "Processing", "Shipped", "Delivered"];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] font-sans antialiased flex flex-col justify-between selection:bg-[#ff851b] selection:text-white">
      
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#000613]">
              My Orders & Track Deliveries
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              View real-time processing, shipping, and delivery updates for your purchases.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-[#000613] hover:bg-[#001f3f] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            ← Back to Shop
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs font-bold text-slate-500">
            Loading your orders from database...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#964900] flex items-center justify-center text-3xl font-black border border-amber-200">
              <i className="ri-shopping-bag-3-line text-[#964900] text-3xl"></i>
            </div>
            <h2 className="text-xl font-extrabold text-[#000613]">No Orders Placed Yet</h2>
            <p className="text-xs text-slate-500 max-w-sm">
              Explore our curated clothing and accessories drops to place your first order.
            </p>
            <Link
              to="/"
              className="px-6 py-3 bg-[#ff851b] hover:bg-[#e07010] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all uppercase tracking-wider"
            >
              Explore Drops →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const currentStatus = order.deliveryStatus || "Order Placed";
              const currentStepIndex = Math.max(0, statusSteps.indexOf(currentStatus));
              const progressWidthPercentage = (currentStepIndex / (statusSteps.length - 1)) * 100;
              const addr = order.shippingAddress || {};

              return (
                <div
                  key={order._id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                >
                  {/* Order Summary Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base text-[#000613]">
                          Order #{order.razorpay?.orderId || order._id?.slice(-8)}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          Paid: {formatCurrency(order.price?.amount || 0, order.price?.currency)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/order-success?order_id=${order.razorpay?.orderId || order._id}`, { state: { orderId: order.razorpay?.orderId, paymentId: order.razorpay?.paymentId, items: order.orderItems, shippingAddress: addr } })}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#000613] font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
                    >
                      <span>View Receipt & Tracking Details →</span>
                    </button>
                  </div>

                  {/* Real-time Order Status Timeline Bar */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <i className="ri-route-line text-[#ff851b]"></i>
                        Live Delivery Timeline
                      </span>
                      <span className="text-xs font-extrabold text-[#964900] bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                        Status: {currentStatus}
                      </span>
                    </div>

                    <div className="relative flex justify-between items-center w-full px-4 py-3">
                      {/* Background Line */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 z-0 rounded-full"></div>
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
                                  : "bg-white border border-slate-300 text-slate-400"
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
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items and Address Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Items (7 cols) */}
                    <div className="md:col-span-7 space-y-2">
                      <h4 className="text-xs font-extrabold uppercase text-slate-500">Purchased Items</h4>
                      {order.orderItems?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                          <div>
                            <p className="font-bold text-[#000613]">{item.title}</p>
                            <p className="text-[11px] text-slate-500">Qty: {item.quantity || 1}</p>
                          </div>
                          <span className="font-extrabold text-[#000613]">
                            {formatCurrency(item.price?.amount || 0, item.price?.currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Address (5 cols) */}
                    <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
                      <h4 className="text-xs font-extrabold uppercase text-slate-500">Delivery Address</h4>
                      <p className="text-xs font-bold text-[#000613]">{addr.fullName || user?.fullName || "Valued Buyer"}</p>
                      <p className="text-[11px] text-slate-600 font-medium leading-snug">
                        {addr.streetAddress}{addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-[11px] text-slate-700 font-bold pt-1">Phone: {addr.contact || user?.contact}</p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

    </div>
  );
};

export default MyOrders;
