import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useProduct } from "../hooks/useProduct";
import { useAuth } from "../../auth/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router";
import { addToCart } from "../../cart/state/cart.slice";
import CartDrawer from "../../cart/components/CartDrawer";
import { useCart } from "../../cart/hooks/useCart";
import toast from "react-hot-toast";
import { useFeedback } from "../hooks/useFeedback";

const Home = () => {
    const dispatch = useDispatch();
    const products = useSelector((state) => state.product?.products || []);
    const user = useSelector((state) => state.auth?.user);
    const cartItems = useSelector((state) => state.cart?.items || []);
    const { handlegetAllProducts } = useProduct();
    const { handleGetCart } = useCart();
    const { handleLogout } = useAuth();
    const {
        feedbacks: userFeedbacks,
        isFeedbackOwner,
        handleGetFeedbacks,
        handleCreateFeedback,
        handleUpdateFeedback,
        handleDeleteFeedback: triggerDeleteFeedback
    } = useFeedback();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [sortBy, setSortBy] = useState("newest");
    const [visibleCount, setVisibleCount] = useState(8);
    const [wishlist, setWishlist] = useState({});
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [directBuyProduct, setDirectBuyProduct] = useState(null);
    const [activeGallery, setActiveGallery] = useState(null);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    // Feedback Modal & Pagination State
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [editingFeedbackId, setEditingFeedbackId] = useState(null);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackCategory, setFeedbackCategory] = useState("Product Quality");
    const [feedbackName, setFeedbackName] = useState("");
    const [feedbackComment, setFeedbackComment] = useState("");
    const [feedbackStartIndex, setFeedbackStartIndex] = useState(0);

    useEffect(() => {
        handleGetFeedbacks();
    }, []);

    const openNewFeedbackModal = () => {
        setEditingFeedbackId(null);
        setFeedbackRating(5);
        setFeedbackCategory("Product Quality");
        setFeedbackName(user?.fullname || user?.name || user?.email?.split("@")[0] || "");
        setFeedbackComment("");
        setIsFeedbackModalOpen(true);
    };

    const openEditFeedbackModal = (fb) => {
        if (!isFeedbackOwner(fb)) {
            toast.error("You can only edit your own feedback.");
            return;
        }
        const targetId = fb._id || fb.id;
        setEditingFeedbackId(targetId);
        setFeedbackRating(fb.rating || 5);
        setFeedbackCategory(fb.category || "Product Quality");
        setFeedbackName(fb.name || "");
        setFeedbackComment(fb.comment || "");
        setIsFeedbackModalOpen(true);
    };

    const handleDeleteFeedback = async (fb) => {
        await triggerDeleteFeedback(fb);
        setFeedbackStartIndex((prev) => Math.max(0, Math.min(prev, userFeedbacks.length - 4)));
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackComment.trim()) {
            toast.error("Please enter your feedback comments.");
            return;
        }

        const payload = {
            name: feedbackName || user?.fullname || user?.name || user?.email?.split("@")[0] || "Valued Customer",
            rating: feedbackRating,
            category: feedbackCategory,
            comment: feedbackComment
        };

        if (editingFeedbackId) {
            const targetFb = userFeedbacks.find((fb) => (fb._id || fb.id) === editingFeedbackId);
            await handleUpdateFeedback(editingFeedbackId, payload, targetFb);
        } else {
            await handleCreateFeedback(payload);
            setFeedbackStartIndex(0);
        }

        setIsFeedbackModalOpen(false);
        setEditingFeedbackId(null);
        setFeedbackComment("");
    };

    const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        const categoryParam = searchParams.get("category");
        const queryParam = searchParams.get("q") || "";

        if (categoryParam) {
            setSelectedCategory(categoryParam);
            setSearchQuery(queryParam);
        } else if (queryParam) {
            const qLower = queryParam.toLowerCase().trim();
            if (["clothing", "accessories", "shoes", "shirts", "pants"].includes(qLower)) {
                setSelectedCategory(queryParam);
                setSearchQuery("");
            } else {
                setSearchQuery(queryParam);
            }
        } else {
            setSelectedCategory("ALL");
            setSearchQuery("");
        }

        setVisibleCount(8);
        if (categoryParam || queryParam) {
            const el = document.getElementById("trending-products");
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                await handlegetAllProducts();
                if (user) {
                    await handleGetCart();
                }
            } catch (err) {
                console.error("Failed to fetch products for home page:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [user]);

    const formatCurrency = (amount, currency = "INR") => {
        const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
        const symbol = symbols[currency] || "₹";
        return `${symbol}${Number(amount || 0).toLocaleString()}`;
    };

    const toggleWishlist = (id, e) => {
        e.stopPropagation();
        setWishlist((prev) => {
            const nextState = !prev[id];
            if (nextState) {
                toast.success("Saved to Wishlist! ❤️");
            } else {
                toast.success("Removed from Wishlist.");
            }
            return { ...prev, [id]: nextState };
        });
    };

    // Filter products by search, category, and brand
    const filteredProducts = products.filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
            !q ||
            item.title?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.color?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q) ||
            item.brand?.toLowerCase().includes(q);

        const selCat = selectedCategory.toLowerCase().trim();
        if (selCat === "all") {
            return matchesSearch;
        }

        const itemCat = (item.category || "").toLowerCase().trim();
        const itemBrand = (item.brand || "").toLowerCase().trim();
        const itemTitle = (item.title || "").toLowerCase();
        const itemDesc = (item.description || "").toLowerCase();

        let matchesCat = false;

        if (selCat === "clothing") {
            matchesCat =
                itemCat === "clothing" ||
                itemCat === "shirts" ||
                itemCat === "pants" ||
                itemCat.includes("cloth") ||
                itemCat.includes("shirt") ||
                itemCat.includes("pant") ||
                itemCat.includes("apparel") ||
                itemTitle.includes("shirt") ||
                itemTitle.includes("pant") ||
                itemTitle.includes("coat") ||
                itemTitle.includes("jacket") ||
                itemTitle.includes("suit") ||
                itemTitle.includes("trench") ||
                itemTitle.includes("trouser") ||
                itemTitle.includes("hoodie") ||
                itemTitle.includes("sweater") ||
                itemTitle.includes("linen") ||
                itemTitle.includes("top") ||
                itemDesc.includes("shirt") ||
                itemDesc.includes("pant") ||
                itemDesc.includes("coat") ||
                itemDesc.includes("jacket") ||
                itemDesc.includes("apparel");
        } else if (selCat === "watches") {
            matchesCat =
                itemCat === "watches" ||
                itemCat.includes("watch") ||
                itemTitle.includes("watch") ||
                itemTitle.includes("fastrack") ||
                itemTitle.includes("sonata") ||
                itemTitle.includes("titan") ||
                itemTitle.includes("casio") ||
                itemTitle.includes("fossil") ||
                ["fastrack", "sonata", "titan", "casio", "fossil"].includes(itemBrand);
        } else if (selCat === "accessories") {
            matchesCat =
                itemCat === "accessories" ||
                itemCat.includes("accessor") ||
                itemCat.includes("belt") ||
                itemCat.includes("bag") ||
                itemCat.includes("watch") ||
                itemCat.includes("hat") ||
                itemCat.includes("cap") ||
                itemTitle.includes("belt") ||
                itemTitle.includes("bag") ||
                itemTitle.includes("wallet") ||
                itemTitle.includes("watch") ||
                itemTitle.includes("hat") ||
                itemTitle.includes("cap") ||
                itemTitle.includes("sunglass") ||
                itemTitle.includes("scarf") ||
                itemTitle.includes("leather good") ||
                itemDesc.includes("accessor") ||
                itemDesc.includes("belt") ||
                itemDesc.includes("bag") ||
                itemDesc.includes("watch");
        } else if (selCat === "shoes") {
            matchesCat =
                itemCat === "shoes" ||
                itemCat.includes("shoe") ||
                itemCat.includes("footwear") ||
                itemCat.includes("sneaker") ||
                itemCat.includes("boot") ||
                itemCat.includes("loafer") ||
                itemTitle.includes("shoe") ||
                itemTitle.includes("sneaker") ||
                itemTitle.includes("boot") ||
                itemTitle.includes("loafer") ||
                itemTitle.includes("step") ||
                itemTitle.includes("footwear") ||
                itemDesc.includes("shoe") ||
                itemDesc.includes("sneaker") ||
                itemDesc.includes("boot") ||
                itemDesc.includes("footwear");
        } else {
            matchesCat =
                itemCat === selCat ||
                itemBrand === selCat ||
                itemCat.includes(selCat) ||
                itemTitle.includes(selCat) ||
                itemDesc.includes(selCat);
        }

        return matchesSearch && matchesCat;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "price-asc") {
            return (a.price?.amount || 0) - (b.price?.amount || 0);
        }
        if (sortBy === "price-desc") {
            return (b.price?.amount || 0) - (a.price?.amount || 0);
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // Paginate visible products
    const visibleProducts = sortedProducts.slice(0, visibleCount);

    // Lightbox Gallery Modal
    const openGallery = (product, initialIndex = 0) => {
        if (!product.images || !product.images.length) return;
        const formattedImages = product.images
            .map((img) => (typeof img === "string" ? img : img?.url || ""))
            .filter(Boolean);

        if (!formattedImages.length) return;

        setActiveGallery({
            productTitle: product.title,
            description: product.description,
            price: formatCurrency(product.price?.amount, product.price?.currency),
            images: formattedImages,
            currentIndex: initialIndex,
        });
    };

    const closeGallery = () => setActiveGallery(null);

    const nextPhoto = () => {
        if (!activeGallery) return;
        setActiveGallery((prev) => ({
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length,
        }));
    };

    const prevPhoto = () => {
        if (!activeGallery) return;
        setActiveGallery((prev) => ({
            ...prev,
            currentIndex:
                prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1,
        }));
    };

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    // FAQs List
    const faqs = [
        {
            question: "How long does express global shipping take?",
            answer: "We dispatch all orders within 24 hours. Express global shipping delivers in 2–4 business days with live tracking provided."
        },
        {
            question: "Are all luxury brands on Luxe Market authentic?",
            answer: "Yes! Every single item listed on Luxe Market undergo strict physical inspection and digital certificate verification before listing."
        },
        {
            question: "What is your return & exchange policy?",
            answer: "We offer a 30-day hassle-free return window. Returns are completely free with pre-paid return labels included in every parcel."
        },
        {
            question: "How can independent merchants sell on Luxe Market?",
            answer: "Registered users can create a Merchant Account under 'Register' or navigate to 'Sell' in the header menu to manage inventory."
        }
    ];

    return (
        <div className="min-h-screen w-full bg-[#f8f9fa] text-[#191c1d] font-sans antialiased selection:bg-[#ff851b] selection:text-white flex flex-col justify-between">

            {/* Top Announcement Ticker Bar */}
            <div className="bg-[#000613] text-[#ffdcc7] text-[11px] font-bold py-2 px-4 text-center tracking-wider overflow-hidden border-b border-slate-800">
                <div className="flex items-center justify-center gap-4 animate-pulse">
                    <span>✨ COMPLIMENTARY EXPRESS SHIPPING OVER $200</span>
                    <span>•</span>
                    <span>USE CODE <span className="text-[#ff851b] font-black">LUXE2026</span> FOR 15% OFF</span>
                    <span>•</span>
                    <span>100% VERIFIED AUTHENTICITY</span>
                </div>
            </div>

            {/* Main Body */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16 py-8 flex-1 w-full">

                {/* Seasonal Hero Section */}
                <section className="relative overflow-hidden rounded-3xl bg-[#001f3f] min-h-[460px] flex items-center shadow-xl">
                    <div className="relative z-10 grid md:grid-cols-2 w-full h-full">

                        {/* Left Content */}
                        <div className="flex flex-col justify-center px-6 sm:px-12 py-10 space-y-5 text-white">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/10 text-[#ffdcc7] border border-white/20 w-fit">
                                <span className="w-2 h-2 rounded-full bg-[#ff851b] animate-pulse" />
                                LIMITED SEASONAL LAUNCH 2026
                            </span>

                            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                                The Modernist <br />Collection.
                            </h1>

                            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                                Precision-crafted essentials designed for the urban pioneer. High-performance fabrics meet editorial elegance.
                            </p>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        const el = document.getElementById("trending-products");
                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="bg-[#ff851b] hover:bg-[#e07010] text-white px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                                >
                                    Shop Collection
                                </button>
                                <button
                                    onClick={() => {
                                        const firstProd = products[0];
                                        if (firstProd) openGallery(firstProd, 0);
                                    }}
                                    className="border-2 border-white text-white hover:bg-white hover:text-[#001f3f] px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all"
                                >
                                    Explore Lookbook
                                </button>
                            </div>

                            {/* Stats Bar */}
                            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-center sm:text-left">
                                <div>
                                    <p className="text-lg font-extrabold text-white">50K+</p>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Happy Buyers</p>
                                </div>
                                <div>
                                    <p className="text-lg font-extrabold text-white">4.9 ★</p>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Global Rating</p>
                                </div>
                                <div>
                                    <p className="text-lg font-extrabold text-[#ffdcc7]">100%</p>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Authentic Brands</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Hero Editorial Portrait */}
                        <div className="hidden md:block relative h-full min-h-[460px]">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage:
                                        "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop')",
                                }}
                            />
                        </div>

                    </div>
                </section>

                {/* Feature Highlights Ribbon */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#000613] flex items-center justify-center font-bold text-lg shrink-0">
                            <i className="ri-truck-line"></i>
                        </div>
                        <div>
                            <h4 className="text-xs font-extrabold text-[#000613]">Express Global Shipping</h4>
                            <p className="text-[10px] text-slate-500 font-medium">2-4 Days Doorstep Delivery</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#000613] flex items-center justify-center font-bold text-lg shrink-0">
                            <i className="ri-shield-keyhole-line"></i>
                        </div>
                        <div>
                            <h4 className="text-xs font-extrabold text-[#000613]">Authenticity Guaranteed</h4>
                            <p className="text-[10px] text-slate-500 font-medium">100% Verified Independent Brands</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#000613] flex items-center justify-center font-bold text-lg shrink-0">
                            <i className="ri-repeat-2-line"></i>
                        </div>
                        <div>
                            <h4 className="text-xs font-extrabold text-[#000613]">30-Day Free Returns</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Hassle-Free Return Labels</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#000613] flex items-center justify-center font-bold text-lg shrink-0">
                            <i className="ri-chat-1-line"></i>
                        </div>
                        <div>
                            <h4 className="text-xs font-extrabold text-[#000613]">24/7 VIP Concierge</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Dedicated Personal Support</p>
                        </div>
                    </div>

                </section>

                {/* Explore Categories (Editorial Grid) */}
                <section className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#000613]">Explore Collections</h2>
                            <p className="text-xs sm:text-sm text-slate-500">Hand-picked selections tailored to your aesthetic</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedCategory("ALL");
                                setSearchParams({});
                                const el = document.getElementById("trending-products");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-xs font-bold text-[#964900] hover:underline"
                        >
                            View all collections →
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                        {/* Clothing */}
                        <div
                            onClick={() => {
                                setSelectedCategory("Clothing");
                                setSearchParams({ category: "Clothing" });
                                const el = document.getElementById("trending-products");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="group relative aspect-[4/5] overflow-hidden rounded-3xl shadow-md cursor-pointer"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                                style={{
                                    backgroundImage:
                                        "url('https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop')",
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#000613]/85 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6 space-y-0.5">
                                <h3 className="text-white font-extrabold text-xl">Clothing</h3>
                                <p className="text-slate-300 text-xs">Essential Silhouettes & Outerwear</p>
                            </div>
                        </div>

                        {/* Accessories */}
                        <div
                            onClick={() => {
                                setSelectedCategory("Accessories");
                                setSearchParams({ category: "Accessories" });
                                const el = document.getElementById("trending-products");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="group relative aspect-[4/5] overflow-hidden rounded-3xl shadow-md cursor-pointer"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                                style={{
                                    backgroundImage:
                                        "url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop')",
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#000613]/85 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6 space-y-0.5">
                                <h3 className="text-white font-extrabold text-xl">Accessories</h3>
                                <p className="text-slate-300 text-xs">Signature Accents & Leather Goods</p>
                            </div>
                        </div>

                        {/* Shoes */}
                        <div
                            onClick={() => {
                                setSelectedCategory("Shoes");
                                setSearchParams({ category: "Shoes" });
                                const el = document.getElementById("trending-products");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="group relative aspect-[4/5] overflow-hidden rounded-3xl shadow-md cursor-pointer"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                                style={{
                                    backgroundImage:
                                        "url('https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop')",
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#000613]/85 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6 space-y-0.5">
                                <h3 className="text-white font-extrabold text-xl">Shoes</h3>
                                <p className="text-slate-300 text-xs">Crafted Steps & Designers</p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Bento Grid Promotions & Flash Drops */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Large Promotion Bento */}
                    <div className="lg:col-span-8 bg-slate-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 border border-slate-200 overflow-hidden">
                        <div className="space-y-3 flex-1">
                            <span className="inline-block px-2.5 py-1 bg-[#001f3f] text-[#ffdcc7] rounded text-[10px] font-bold uppercase tracking-wider">
                                DEAL OF THE MONTH
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#000613]">Artisanal Home Series</h2>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Elevate your living space with limited edition ceramics and handcrafted lighting fixtures. Exclusive to Luxe Market members.
                            </p>
                            <button
                                onClick={() => setSelectedCategory("ALL")}
                                className="bg-[#000613] hover:bg-[#001f3f] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                                Shop Collection
                            </button>
                        </div>

                        <div className="flex-1 w-full h-56 md:h-full min-h-[220px]">
                            <div
                                className="w-full h-full bg-cover bg-center rounded-2xl border border-slate-200"
                                style={{
                                    backgroundImage:
                                        "url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop')",
                                }}
                            />
                        </div>
                    </div>

                    {/* Trending Side Column Stack */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* New Arrivals Tile */}
                        <div
                            onClick={() => setSelectedCategory("ALL")}
                            className="bg-[#ffdcc7] text-[#311300] p-6 rounded-3xl flex flex-col justify-between flex-1 group cursor-pointer relative overflow-hidden shadow-sm"
                        >
                            <div className="relative z-10">
                                <h3 className="text-lg font-extrabold mb-1">New Arrivals</h3>
                                <p className="text-xs font-semibold text-[#723600]">Just landed: Summer Essentials</p>
                            </div>
                            <div className="relative z-10 mt-6 flex justify-end">
                                <svg className="w-6 h-6 text-[#723600] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </div>

                        {/* Gold Tier Rewards Tile */}
                        <div className="bg-[#e1e3e4] p-5 rounded-3xl flex items-center justify-between border border-slate-300">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loyalty Program</p>
                                <h4 className="text-base font-extrabold text-[#000613]">Gold Tier Rewards</h4>
                            </div>
                            <div className="w-10 h-10 bg-[#000613] rounded-full flex items-center justify-center text-white font-bold">
                                ★
                            </div>
                        </div>

                    </div>

                </section>

                {/* Dynamic Trending Products Section */}
                <section id="trending-products" className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#000613]">
                                {searchQuery ? `Search Results for "${searchQuery}"` : "Trending Now"}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {searchQuery
                                    ? `Showing products matching "${searchQuery}"`
                                    : "Popular apparel & streetwear curated by our editorial team"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* In-page search input */}
                            <div className="relative flex-1 sm:w-60">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchQuery(val);
                                        if (val.trim()) {
                                            setSearchParams({ q: val.trim() });
                                        } else {
                                            setSearchParams({});
                                        }
                                    }}
                                    placeholder="Filter products..."
                                    className="w-full bg-white border border-slate-200 rounded-full pl-4 pr-9 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#001f3f]/20 transition-all placeholder:text-slate-400 shadow-sm"
                                />
                                {searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSearchParams({});
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                                        title="Clear search"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                ) : (
                                    <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </div>

                            {/* Sort Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-full outline-none focus:ring-2 focus:ring-[#001f3f]/20 cursor-pointer shadow-sm"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                            </select>

                            <span className="text-xs font-bold text-slate-500 shrink-0">
                                {sortedProducts.length} items
                            </span>
                        </div>
                    </div>

                    {/* Category Quick Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {["ALL", "Clothing", "Pants", "Shirts", "Watches", "Accessories", "Shoes"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    if (cat === "ALL") {
                                        const newParams = new URLSearchParams(searchParams);
                                        newParams.delete("category");
                                        setSearchParams(newParams);
                                    } else {
                                        const newParams = new URLSearchParams(searchParams);
                                        newParams.set("category", cat);
                                        setSearchParams(newParams);
                                    }
                                }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    selectedCategory.toLowerCase() === cat.toLowerCase()
                                        ? "bg-[#000613] text-white shadow-sm"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                            >
                                {cat === "ALL" ? "All Products" : cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="bg-slate-100 rounded-2xl p-4 space-y-3 animate-pulse">
                                    <div className="w-full h-44 bg-slate-200 rounded-xl" />
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 text-xl shadow-sm border border-slate-200">
                                🔍
                            </div>
                            <div className="space-y-1 max-w-sm">
                                <h3 className="text-base font-extrabold text-slate-900">
                                    No products found {searchQuery ? `for "${searchQuery}"` : "in this category"}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    We couldn't find any products matching your current filters. Try selecting another category or clear search:
                                </p>
                            </div>

                            {/* Suggestions */}
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                                {products.map((prod) => (
                                    <button
                                        key={prod._id}
                                        onClick={() => {
                                            setSearchQuery(prod.title);
                                            setSelectedCategory("ALL");
                                            setSearchParams({ q: prod.title });
                                        }}
                                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 transition-all shadow-sm active:scale-95"
                                    >
                                        {prod.title}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedCategory("ALL");
                                        setSearchParams({});
                                    }}
                                    className="px-3 py-1.5 bg-[#000613] hover:bg-[#001f3f] text-white text-xs font-bold rounded-full transition-all shadow-sm active:scale-95"
                                >
                                    Show All Products
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {visibleProducts.map((product) => {
                                    const variants = Array.isArray(product.variants) ? product.variants : [];
                                    const isWishlisted = !!wishlist[product._id];

                                    return (
                                        <ProductCardItem
                                            key={product._id}
                                            product={product}
                                            variants={variants}
                                            isWishlisted={isWishlisted}
                                            toggleWishlist={toggleWishlist}
                                            navigate={navigate}
                                            formatCurrency={formatCurrency}
                                            cartItems={cartItems}
                                        />
                                    );
                                })}
                            </div>

                            {/* Load More Pagination Bar */}
                            {sortedProducts.length > visibleProducts.length && (
                                <div className="flex flex-col items-center justify-center pt-6 border-t border-slate-200 space-y-3">
                                    <p className="text-xs font-semibold text-slate-500">
                                        Showing <span className="font-extrabold text-slate-800">{visibleProducts.length}</span> of{" "}
                                        <span className="font-extrabold text-slate-800">{sortedProducts.length}</span> products
                                    </p>
                                    <button
                                        onClick={() => setVisibleCount((prev) => prev + 8)}
                                        className="bg-[#000613] hover:bg-[#001f3f] text-white px-8 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
                                    >
                                        <span>Load More Products</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Press & Media Recognition ("AS SEEN IN") */}
                <section className="bg-white py-8 px-6 rounded-3xl border border-slate-200 text-center space-y-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Featured In Global Press</p>
                    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-slate-400 font-extrabold text-lg sm:text-xl tracking-widest">
                        <span className="hover:text-slate-800 transition-colors">VOGUE</span>
                        <span className="hover:text-slate-800 transition-colors">GQ</span>
                        <span className="hover:text-slate-800 transition-colors">ELLE</span>
                        <span className="hover:text-slate-800 transition-colors">BAZAAR</span>
                        <span className="hover:text-slate-800 transition-colors">HYPEBEAST</span>
                    </div>
                </section>

                {/* Customer Reviews & Feedback Section (3 at a time) */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#000613] flex items-center gap-2">
                                <i className="ri-feedback-line text-[#ff851b]"></i>
                                Customer Feedback & Reviews
                            </h2>
                            <p className="text-xs text-slate-500">
                                Real ratings and experiences shared by verified Snitch apparel buyers (Showing 3 at a time)
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Navigation Arrows */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={feedbackStartIndex === 0}
                                    onClick={() => setFeedbackStartIndex((prev) => Math.max(0, prev - 3))}
                                    className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all flex items-center justify-center shadow-sm"
                                    title="Previous Feedbacks"
                                >
                                    <i className="ri-arrow-left-s-line text-lg"></i>
                                </button>
                                <span className="text-xs font-bold text-slate-500">
                                    {Math.min(feedbackStartIndex + 1, userFeedbacks.length)}–{Math.min(feedbackStartIndex + 3, userFeedbacks.length)} of {userFeedbacks.length}
                                </span>
                                <button
                                    type="button"
                                    disabled={feedbackStartIndex + 3 >= userFeedbacks.length}
                                    onClick={() => setFeedbackStartIndex((prev) => Math.min(userFeedbacks.length - 3, prev + 3))}
                                    className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all flex items-center justify-center shadow-sm"
                                    title="Next Feedbacks"
                                >
                                    <i className="ri-arrow-right-s-line text-lg"></i>
                                </button>
                            </div>

                            <button
                                onClick={openNewFeedbackModal}
                                className="bg-[#ff851b] hover:bg-[#e07010] text-white px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                            >
                                <i className="ri-add-line text-sm"></i>
                                <span>Share Feedback</span>
                            </button>
                        </div>
                    </div>

                    {/* 3 Cards View */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {userFeedbacks.slice(feedbackStartIndex, feedbackStartIndex + 3).map((fb) => (
                            <div key={fb.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between relative group">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-amber-500 font-bold text-sm">
                                            {"★".repeat(fb.rating)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                {fb.category}
                                            </span>
                                            {/* Action Buttons: Edit & Delete - Only visible to feedback owner */}
                                            {isFeedbackOwner(fb) && (
                                                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditFeedbackModal(fb)}
                                                        className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                                                        title="Edit Feedback"
                                                    >
                                                        <i className="ri-pencil-line text-sm"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteFeedback(fb)}
                                                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                        title="Delete Feedback"
                                                    >
                                                        <i className="ri-delete-bin-line text-sm"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed italic">
                                        "{fb.comment}"
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                                    <div className="w-9 h-9 rounded-full bg-[#001f3f] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                        {fb.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-extrabold text-[#000613] truncate">{fb.name}</p>
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-emerald-600 font-bold uppercase">{fb.role}</span>
                                            <span className="text-slate-400 font-medium">{fb.date}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Interactive FAQ Accordion Section */}
                <section id="faq-section" className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#000613]">Frequently Asked Questions</h2>
                        <p className="text-xs text-slate-500">Everything you need to know about shopping & selling on Luxe Market</p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full px-5 py-4 text-left flex justify-between items-center font-bold text-xs sm:text-sm text-[#000613] hover:bg-slate-100 transition-colors"
                                >
                                    <span>{faq.question}</span>
                                    <span className="text-base text-slate-400 font-extrabold">{openFaqIndex === idx ? "−" : "+"}</span>
                                </button>
                                {openFaqIndex === idx && (
                                    <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Terms & Conditions Section */}
                <section id="terms-section" className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <span className="px-3 py-1 bg-amber-100 text-[#964900] text-[10px] font-black uppercase tracking-widest rounded-full">
                                LEGAL POLICY • 2026
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#000613] mt-2 flex items-center gap-2">
                                <i className="ri-shield-keyhole-line text-[#ff851b]"></i>
                                Terms & Conditions
                            </h2>
                            <p className="text-xs text-slate-500">
                                Official store guidelines, delivery policies, return rules & buyer protections
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Last updated: August 2026</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 font-medium">
                        
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="flex items-center gap-2 font-black text-sm text-[#000613]">
                                <i className="ri-file-text-line text-[#ff851b]"></i>
                                <span>1. Acceptance of Terms</span>
                            </div>
                            <p className="leading-relaxed">
                                By accessing Snitch, browsing products, or completing purchases, you agree to comply with our store policies, code of conduct, and service guidelines.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="flex items-center gap-2 font-black text-sm text-[#000613]">
                                <i className="ri-shopping-cart-2-line text-[#ff851b]"></i>
                                <span>2. Orders & Payments</span>
                            </div>
                            <p className="leading-relaxed">
                                All prices are displayed in INR (₹). Orders are subject to item availability and verified via encrypted 256-bit SSL Razorpay payment gateways.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="flex items-center gap-2 font-black text-sm text-[#000613]">
                                <i className="ri-truck-line text-[#ff851b]"></i>
                                <span>3. Shipping & Deliveries</span>
                            </div>
                            <p className="leading-relaxed">
                                Orders dispatch within 24 hours. Express global shipping delivers in 4–6 business days with real-time status tracking under "My Orders & Deliveries".
                            </p>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="flex items-center gap-2 font-black text-sm text-[#000613]">
                                <i className="ri-repeat-2-line text-[#ff851b]"></i>
                                <span>4. 30-Day Returns Policy</span>
                            </div>
                            <p className="leading-relaxed">
                                We offer hassle-free 30-day returns for unworn apparel with original tags attached. Refunds process back to source method upon physical inspection.
                            </p>
                        </div>

                    </div>
                </section>

                {/* VIP Newsletter Card */}
                <section className="bg-[#000613] text-white p-8 sm:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                    <div className="space-y-2 max-w-lg">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ffdcc7]">JOIN THE VIP CLUB</span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">Get 15% Off Your First Order</h2>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Subscribe to receive private invitations to flash drops, merchant lookbooks, and exclusive seasonal releases.
                        </p>
                    </div>

                    <div className="flex w-full md:w-auto gap-2">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="bg-white/10 border border-white/20 text-white text-xs px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-[#ff851b] w-full md:w-64 placeholder:text-slate-400"
                        />
                        <button
                            onClick={() => alert("Thank you for joining the VIP club! Code LUXE2026 applied.")}
                            className="bg-[#ff851b] hover:bg-[#e07010] text-white font-extrabold text-xs px-6 py-3 rounded-xl shrink-0 transition-all shadow-md"
                        >
                            Claim 15%
                        </button>
                    </div>
                </section>

            </main>

            {/* Compact Minimal Footer */}
            <footer className="bg-[#000613] text-white py-5 border-t border-slate-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                        <span className="font-extrabold tracking-tight text-white text-sm">SNITCH.</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest border-l border-slate-800 pl-3">
                            Curated Apparel Market
                        </span>
                    </div>

                    <div className="flex items-center gap-5 text-[11px]">
                        <button onClick={() => setSelectedCategory("Clothing")} className="hover:text-white transition-colors">
                            Clothing
                        </button>
                        <button onClick={() => setSelectedCategory("Accessories")} className="hover:text-white transition-colors">
                            Accessories
                        </button>
                        <button
                            onClick={() => {
                                const el = document.getElementById("terms-section");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="hover:text-white transition-colors cursor-pointer"
                        >
                            Terms & Conditions
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

            {/* Photo Lightbox */}
            {activeGallery && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 max-w-6xl mx-auto w-full">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">
                                {activeGallery.productTitle}
                            </h3>
                            <p className="text-xs text-[#ff851b] font-extrabold">
                                {activeGallery.price} • Photo {activeGallery.currentIndex + 1} of {activeGallery.images.length}
                            </p>
                        </div>

                        <button
                            onClick={closeGallery}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-colors text-base"
                        >
                            ×
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative my-3 max-w-5xl mx-auto w-full overflow-hidden">
                        {activeGallery.images.length > 1 && (
                            <button
                                onClick={prevPhoto}
                                className="absolute left-2 sm:left-4 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/10 hover:bg-[#ff851b] hover:text-white text-white flex items-center justify-center transition-all shadow-xl"
                            >
                                ‹
                            </button>
                        )}

                        <img
                            src={activeGallery.images[activeGallery.currentIndex]}
                            alt={activeGallery.productTitle}
                            className="max-h-[60vh] max-w-full object-contain rounded-2xl border border-white/10 shadow-2xl transition-all duration-300"
                        />

                        {activeGallery.images.length > 1 && (
                            <button
                                onClick={nextPhoto}
                                className="absolute right-2 sm:right-4 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/10 hover:bg-[#ff851b] hover:text-white text-white flex items-center justify-center transition-all shadow-xl"
                            >
                                ›
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Shopping Bag Drawer */}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => {
                    setIsCartOpen(false);
                    setDirectBuyProduct(null);
                }}
                directBuyProduct={directBuyProduct}
            />

            {/* Floating Feedback Trigger Button */}
            <button
                onClick={openNewFeedbackModal}
                className="fixed bottom-6 right-6 z-40 bg-[#ff851b] hover:bg-[#e07010] text-white shadow-2xl px-4 py-3 rounded-full flex items-center gap-2 text-xs font-black transition-all hover:scale-105 border border-white/20 active:scale-95 cursor-pointer"
                title="Give Your Feedback"
            >
                <i className="ri-feedback-line text-base"></i>
                <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* Interactive Feedback Modal */}
            {isFeedbackModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-black text-[#000613] flex items-center gap-2">
                                    <i className="ri-feedback-line text-[#ff851b]"></i>
                                    {editingFeedbackId ? "Edit Your Feedback" : "Share Your Feedback"}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    {editingFeedbackId ? "Update your experience and rating below." : "We value your input to continuously improve Snitch products & service."}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsFeedbackModalOpen(false);
                                    setEditingFeedbackId(null);
                                }}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-lg font-bold transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                            
                            {/* Rating Selector */}
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold uppercase text-slate-700">
                                    Overall Satisfaction Rating *
                                </label>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFeedbackRating(star)}
                                            className={`text-2xl transition-all cursor-pointer ${
                                                star <= feedbackRating ? "text-amber-400 scale-110" : "text-slate-300 hover:text-amber-200"
                                            }`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span className="text-xs font-bold text-slate-600 ml-2">
                                        ({feedbackRating} / 5 Stars)
                                    </span>
                                </div>
                            </div>

                            {/* Category Selector */}
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold uppercase text-slate-700">
                                    Feedback Category *
                                </label>
                                <select
                                    value={feedbackCategory}
                                    onChange={(e) => setFeedbackCategory(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3.5 py-2.5 outline-none focus:border-[#001f3f] text-slate-800 cursor-pointer"
                                >
                                    <option value="Product Quality">Product Quality & Fabric</option>
                                    <option value="Delivery & Shipping">Delivery & Shipping Speed</option>
                                    <option value="Sizing & Fit">Sizing & Fit Accuracy</option>
                                    <option value="Customer Support">Customer Support Experience</option>
                                    <option value="Other">General Website Experience</option>
                                </select>
                            </div>

                            {/* Your Name */}
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold uppercase text-slate-700">
                                    Your Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={feedbackName}
                                    onChange={(e) => setFeedbackName(e.target.value)}
                                    placeholder="e.g. Suryansh Sharma"
                                    className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3.5 py-2.5 outline-none focus:border-[#001f3f] text-slate-800"
                                />
                            </div>

                            {/* Feedback Comments */}
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold uppercase text-slate-700">
                                    Your Feedback & Review *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                    placeholder="Write your experience, suggestions, or comments here..."
                                    className="w-full bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl p-3 outline-none focus:border-[#001f3f] text-slate-800"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-[#000613] hover:bg-[#001f3f] text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                            >
                                <span>{editingFeedbackId ? "Update Feedback" : "Submit Feedback"}</span>
                                <i className="ri-send-plane-fill text-amber-400"></i>
                            </button>

                        </form>

                    </div>
                </div>
            )}

        </div>
    );
};

const ProductCardItem = ({ product, variants, isWishlisted, toggleWishlist, navigate, formatCurrency, cartItems = [] }) => {
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(null);

    const activeVariant = selectedVariantIndex !== null ? variants[selectedVariantIndex] : null;

    const totalStock = activeVariant?.stock !== undefined ? Number(activeVariant.stock) : (product.stock !== undefined ? Number(product.stock) : 10);

    const cartQty = React.useMemo(() => {
        const rawProdId = String(product._id).split("_")[0];
        return cartItems.reduce((acc, item) => {
            const itemProdId = String(item.product?._id || item.product).split("_")[0];
            const itemVariantId = item.variant ? String(item.variant).split("_")[0] : null;
            const targetVariantId = activeVariant?._id ? String(activeVariant._id).split("_")[0] : null;

            const isMatch = itemProdId === rawProdId && (targetVariantId ? itemVariantId === targetVariantId : true);
            return isMatch ? acc + Number(item.quantity || 1) : acc;
        }, 0);
    }, [cartItems, product, activeVariant]);

    const remainingStock = totalStock - cartQty;
    const isOutOfStock = totalStock <= 0 || remainingStock <= 0;

    const activeImage = React.useMemo(() => {
        if (activeVariant && Array.isArray(activeVariant.images) && activeVariant.images.length > 0) {
            return typeof activeVariant.images[0] === "string"
                ? activeVariant.images[0]
                : activeVariant.images[0]?.url || "";
        }
        if (Array.isArray(product.images) && product.images.length > 0) {
            return typeof product.images[0] === "string"
                ? product.images[0]
                : product.images[0]?.url || "";
        }
        return "";
    }, [activeVariant, product]);

    const activePrice = activeVariant
        ? (typeof activeVariant.price === "object" ? activeVariant.price?.amount : activeVariant.price) ?? product.price?.amount
        : product.price?.amount;

    const activeCurrency = activeVariant
        ? (typeof activeVariant.price === "object" ? activeVariant.price?.currency : activeVariant.currency) ?? product.price?.currency
        : product.price?.currency;

    return (
        <div
            onClick={() => navigate(`/product/${product._id}`)}
            className={`group space-y-3 cursor-pointer bg-white p-3.5 rounded-2xl border transition-all hover:shadow-lg flex flex-col justify-between relative ${isOutOfStock ? "border-red-200 bg-red-50/20" : "border-slate-200 hover:border-slate-300"}`}
        >
            <div className="space-y-3">
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                    {activeImage ? (
                        <img
                            src={activeImage}
                            alt={product.title}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? "grayscale opacity-75" : ""}`}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            No Image
                        </div>
                    )}

                    {/* Out of Stock Overlay Ribbon */}
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-2">
                            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg border border-white/20 animate-pulse">
                                {totalStock <= 0 ? "OUT OF STOCK" : "ALL ITEMS IN BAG"}
                            </span>
                        </div>
                    )}

                    {/* Favorite Heart Button */}
                    <button
                        type="button"
                        onClick={(e) => toggleWishlist(product._id, e)}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-500 z-10"
                    >
                        <svg
                            className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "fill-none text-slate-700"}`}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                        {isOutOfStock ? (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase rounded shadow-sm">
                                OUT OF STOCK
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 bg-[#ff851b] text-white text-[9px] font-extrabold uppercase rounded shadow-sm">
                                NEW DROP
                            </span>
                        )}
                        {variants.length > 0 && (
                            <span className="px-2 py-0.5 bg-[#001f3f] text-white text-[9px] font-bold uppercase rounded shadow-sm">
                                {variants.length} VARIANTS
                            </span>
                        )}
                    </div>
                </div>

                {/* Title & Brand Swatches */}
                <div className="px-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#ff851b] bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                            {product.brand || "SNITCH"}
                        </span>
                        {product.category && (
                            <span className="text-[9px] font-bold uppercase text-slate-400">
                                {product.category}
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-sm text-[#000613] group-hover:text-[#964900] transition-colors truncate">
                        {product.title}
                    </h3>

                    {/* Variant Swatches Row */}
                    {variants.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                            {variants.slice(0, 5).map((v, idx) => {
                                const colorVal = v.attributes?.color || v.color || `Variant ${idx + 1}`;
                                const isSelected = selectedVariantIndex === idx;

                                const hexColor =
                                    String(colorVal).toLowerCase() === "black" ? "#1a1a1a" :
                                        String(colorVal).toLowerCase() === "white" ? "#ffffff" :
                                            String(colorVal).toLowerCase() === "red" || String(colorVal).toLowerCase() === "bordeaux" ? "#8b0000" :
                                                String(colorVal).toLowerCase() === "champagne" ? "#f5e6cc" :
                                                    String(colorVal).toLowerCase() === "blue" ? "#001f3f" : "#cbd5e1";

                                return (
                                    <button
                                        key={v._id || idx}
                                        type="button"
                                        title={`Color Option: ${colorVal}`}
                                        onMouseEnter={() => setSelectedVariantIndex(idx)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedVariantIndex(idx);
                                        }}
                                        className={`w-4 h-4 rounded-full border transition-all ${isSelected ? "ring-2 ring-[#ff851b] ring-offset-1 scale-110" : "border-slate-300 hover:scale-110"
                                            }`}
                                        style={{ backgroundColor: hexColor }}
                                    />
                                );
                            })}
                            {variants.length > 5 && (
                                <span className="text-[9px] font-extrabold text-slate-400">+{variants.length - 5}</span>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-1">
                        {product.description}
                    </p>
                </div>
            </div>

            {/* Footer Price & Action */}
            <div className="pt-2 px-1 flex items-center justify-between border-t border-slate-100">
                <span className="text-sm font-extrabold text-[#000613]">
                    {formatCurrency(activePrice, activeCurrency)}
                </span>
                <span className="text-xs font-bold text-[#964900] group-hover:underline">
                    View Details →
                </span>
            </div>
        </div>
    );
};

export default Home;