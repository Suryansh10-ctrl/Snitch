import axios from "axios"

const productApiInstance = axios.create({
    baseURL: "/api/products",
    withCredentials: true,
})

export async function createProducts(formData) {
    const response = await productApiInstance.post('/', formData)
    return response.data
}

export async function getSellerProduct(){
    const response = await productApiInstance.get('/seller')
    return response.data
}

export async function getAllProducts(){
    const response = await productApiInstance.get("/")
    return response.data
}

export async function getProductById(productId){
    const response = await productApiInstance.get(`/${productId}`)
    return response.data
}

export async function updateProductApi(productId, formData){
    const response = await productApiInstance.put(`/${productId}`, formData)
    return response.data
}

export async function deleteProductApi(productId){
    const response = await productApiInstance.delete(`/${productId}`)
    return response.data
}

export async function addVariantToProduct(productId, formData){
    const response = await productApiInstance.post(`/${productId}/variants`, formData)
    return response.data
}

export async function updateVariantApi(productId, variantId, formData){
    const response = await productApiInstance.put(`/${productId}/variants/${variantId}`, formData)
    return response.data
}

export async function deleteVariantApi(productId, variantId){
    const response = await productApiInstance.delete(`/${productId}/variants/${variantId}`)
    return response.data
}

export async function updateVariantStock(productId, variantId, stock){
    const response = await productApiInstance.patch(`/${productId}/variants/${variantId}/stock`, { stock })
    return response.data
}