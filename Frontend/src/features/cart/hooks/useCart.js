import {
  addItem,
  getCart,
  incrementCartItemApi,
  updateQuantityApi,
  removeFromCartApi,
  clearCartApi,
  checkoutApi,
  createCartOrder,
  verifyCartOrder,
} from "../service/cart.api";
import { useDispatch } from "react-redux";
import {
  setCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementCartItem,
  clearCart,
} from "../state/cart.slice";
import { getAllProducts } from "../../products/service/product.api";
import { setProducts } from "../../products/state/product.slice";
import toast from "react-hot-toast";

export const useCart = () => {
  const dispatch = useDispatch();

  async function handleGetCart() {
    try {
      const data = await getCart();
      if (data?.cart) {
        dispatch(setCart(data.cart));
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  }

  async function handleAddItem({ productId, variantId, quantity = 1, product = null, attributes = null, color = null, size = null }) {
    try {
      let availableStock = null;
      if (product) {
        if (variantId && Array.isArray(product.variants)) {
          const targetV = product.variants.find((v) => v._id?.toString() === variantId?.toString());
          if (targetV && targetV.stock !== undefined) availableStock = Number(targetV.stock);
        }
        if (availableStock === null && product.stock !== undefined) {
          availableStock = Number(product.stock);
        }
      }

      if (availableStock !== null && availableStock <= 0) {
        toast.error("Sorry, this item is currently Out of Stock! ❌");
        return;
      }

      if (product) {
        dispatch(addToCart({ product, quantity, variantId }));
      }
      const data = await addItem({ productId, variantId, quantity, attributes, color, size });
      if (data?.cart) {
        dispatch(setCart(data.cart));
      }
      toast.success("Added to Shopping Bag! 🛍️");
      return data;
    } catch (err) {
      console.error("Failed to add item to cart:", err);
      handleGetCart();
      toast.error(err.response?.data?.message || "Item is Out of Stock or unavailable. ❌");
      throw err;
    }
  }

  async function handleIncrementCartItem({ productId, variantId }) {
    try {
      dispatch(incrementCartItem({ productId, variantId }));
      const data = await incrementCartItemApi({ productId, variantId });
      if (data?.cart) {
        dispatch(setCart(data.cart));
      }
      toast.success("Cart item quantity increased");
      return data;
    } catch (err) {
      handleGetCart();
      toast.error("Failed to update item quantity");
      throw err;
    }
  }

  async function handleUpdateQuantity({ productId, variantId, quantity }) {
    try {
      dispatch(updateQuantity({ productId, variantId, quantity }));
      const data = await updateQuantityApi({ productId, variantId, quantity });
      if (data?.cart) {
        dispatch(setCart(data.cart));
      }
      toast.success(quantity <= 0 ? "Item removed from cart" : "Cart quantity updated");
      return data;
    } catch (err) {
      handleGetCart();
      toast.error("Failed to update item quantity");
      throw err;
    }
  }

  async function handleRemoveItem({ productId, variantId }) {
    try {
      dispatch(removeFromCart({ productId, variantId }));
      const data = await removeFromCartApi({ productId, variantId });
      if (data?.cart) {
        dispatch(setCart(data.cart));
      }
      toast.success("Item removed from Shopping Bag");
      return data;
    } catch (err) {
      handleGetCart();
      toast.error("Failed to remove item from cart");
      throw err;
    }
  }

  async function handleClearCart() {
    try {
      dispatch(clearCart());
      const data = await clearCartApi();
      if (data?.cart) {
        dispatch(setCart(data.cart));
      }
      toast.success("Shopping Bag cleared");
      return data;
    } catch (err) {
      handleGetCart();
      toast.error("Failed to clear shopping bag");
      throw err;
    }
  }

  async function handleCheckoutCart(items = null) {
    try {
      dispatch(clearCart());
      const data = await checkoutApi(items);
      if (data?.cart) {
        dispatch(setCart(data.cart));
      }
      // Refresh global products so catalog stock updates immediately
      try {
        const prodData = await getAllProducts();
        if (prodData?.products || prodData?.product) {
          dispatch(setProducts(prodData.products || prodData.product));
        }
      } catch (pe) {
        console.error("Failed to refresh products post checkout:", pe);
      }

      toast.success("Order Placed Successfully! 🎉 Inventory stock updated.");
      return data;
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err.response?.data?.message || "Checkout failed. Please try again.");
      throw err;
    }
  }

  async function handleCreateCartOrder (amount = null, shippingAddress = null) {
    const data = await createCartOrder(amount, shippingAddress);
    return data.order;
  }

  async function handleVerifyCartOrder (orderId) {
    const data = await verifyCartOrder(orderId);
    return data.success;
  }

  return {
    handleGetCart,
    handleAddItem,
    handleIncrementCartItem,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    handleCheckoutCart,
    handleCreateCartOrder,
    handleVerifyCartOrder
  };
};