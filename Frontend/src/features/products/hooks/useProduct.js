import { createProducts, getSellerProduct, getAllProducts, getProductById, addVariantToProduct, updateVariantStock, updateProductApi, deleteProductApi, updateVariantApi, deleteVariantApi } from "../service/product.api.js"
import { useDispatch } from "react-redux"
import { setSellerProducts, setProducts } from "../state/product.slice.js"
import toast from "react-hot-toast"

export const useProduct = () => {
    const dispatch = useDispatch()

    async function handleCreateProduct(formData){
        try {
            const data = await createProducts(formData)
            toast.success("Product created successfully! ✨")
            return data.product
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create product")
            throw err
        }
    }

    async function handlegetSellerProduct(){
        const data = await getSellerProduct()
        dispatch(setSellerProducts(data.product))
        return data.product
    }

    async function handlegetAllProducts(){
        const data = await getAllProducts()
        dispatch(setProducts(data.products || data.product))
        return data.products || data.product
    }

    async function handleGetProductById(productId){
        const data = await getProductById(productId)
        return data?.product || data
    }

    async function handleUpdateProduct(productId, formData){
        try {
            const data = await updateProductApi(productId, formData)
            toast.success("Product updated successfully!")
            return data.product
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update product")
            throw err
        }
    }

    async function handleDeleteProduct(productId){
        try {
            const data = await deleteProductApi(productId)
            toast.success("Product deleted successfully!")
            return data
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete product")
            throw err
        }
    }

    async function handleAddVariant(productId, formData){
        try {
            const data = await addVariantToProduct(productId, formData)
            toast.success("Variant added successfully!")
            return data.product
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add variant")
            throw err
        }
    }

    async function handleCreateVariant(payload) {
        if (typeof payload === 'object' && payload.productId) {
            const { productId, ...rest } = payload;
            return await handleAddVariant(productId, rest);
        }
        return await handleAddVariant(arguments[0], arguments[1]);
    }

    async function handleUpdateVariantDetails(productId, variantId, formData){
        try {
            const data = await updateVariantApi(productId, variantId, formData)
            toast.success("Variant updated successfully!")
            return data.product
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update variant")
            throw err
        }
    }

    async function handleDeleteVariant(productId, variantId){
        try {
            const data = await deleteVariantApi(productId, variantId)
            toast.success("Variant removed")
            return data
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete variant")
            throw err
        }
    }

    async function handleUpdateVariantStock(productId, variantId, stock){
        const data = await updateVariantStock(productId, variantId, stock)
        return data.product
    }

    async function handleUpdateStock(payload) {
        if (typeof payload === 'object' && payload.productId) {
            const { productId, variantId, stock } = payload;
            return await handleUpdateVariantStock(productId, variantId, stock);
        }
        return await handleUpdateVariantStock(arguments[0], arguments[1], arguments[2]);
    }

    return {
        handleCreateProduct,
        handlegetSellerProduct,
        handleGetSellerProducts: handlegetSellerProduct,
        handlegetAllProducts,
        handleGetAllProducts: handlegetAllProducts,
        handleGetProductById,
        handleUpdateProduct,
        handleDeleteProduct,
        handleAddVariant,
        handleCreateVariant,
        handleUpdateVariantDetails,
        handleDeleteVariant,
        handleUpdateVariantStock,
        handleUpdateStock
    }
}