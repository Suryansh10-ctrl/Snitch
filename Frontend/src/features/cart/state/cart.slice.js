import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [], // Array of { product, variant, quantity, price }
    totalPrice: 0,
    currency: "INR",
  },
  reducers: {
    setCart: (state, action) => {
      const cart = action.payload;
      if (cart) {
        state.items = cart.items || [];
        state.totalPrice = cart.totalPrice || 0;
        state.currency = cart.currency || "INR";
      } else {
        state.items = [];
        state.totalPrice = 0;
        state.currency = "INR";
      }
    },
    addToCart: (state, action) => {
      const { product, quantity = 1, variantId = null } = action.payload;
      const targetId = product._id || product.id;
      const existingIndex = state.items.findIndex(
        (item) =>
          (item.product?._id === targetId || item.product === targetId) &&
          (variantId ? item.variant === variantId : true)
      );

      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({ product, variant: variantId, quantity });
      }
    },
    removeFromCart: (state, action) => {
      const { productId, variantId } = typeof action.payload === "object" ? action.payload : { productId: action.payload };
      state.items = state.items.filter(
        (item) =>
          !(
            (item.product?._id === productId || item.product === productId) &&
            (variantId ? item.variant === variantId : true)
          )
      );
    },
    updateQuantity: (state, action) => {
      const { productId, variantId, quantity } = action.payload;
      const existingItem = state.items.find(
        (item) =>
          (item.product?._id === productId || item.product === productId) &&
          (variantId ? item.variant === variantId : true)
      );

      if (existingItem) {
        if (quantity <= 0) {
          state.items = state.items.filter(
            (item) =>
              !(
                (item.product?._id === productId || item.product === productId) &&
                (variantId ? item.variant === variantId : true)
              )
          );
        } else {
          existingItem.quantity = quantity;
        }
      }
    },
    incrementCartItem: (state, action) => {
      const { productId, variantId } = action.payload;
      const existingItem = state.items.find(
        (item) =>
          (item.product?._id === productId || item.product === productId) &&
          (variantId ? item.variant === variantId : true)
      );
      if (existingItem) {
        existingItem.quantity += 1;
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
      state.currency = "INR";
    },
  },
});

export const { setCart, addToCart, removeFromCart, updateQuantity, incrementCartItem, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
