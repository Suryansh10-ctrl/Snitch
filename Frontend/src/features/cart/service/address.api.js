import axios from "axios";

const addressApiInstance = axios.create({
    baseURL: "/api/address",
    withCredentials: true
});

export const getUserAddressesApi = async () => {
    const response = await addressApiInstance.get("/");
    return response.data;
};

export const addAddressApi = async (addressData) => {
    const response = await addressApiInstance.post("/", addressData);
    return response.data;
};

export const updateAddressApi = async (addressId, addressData) => {
    const response = await addressApiInstance.put(`/${addressId}`, addressData);
    return response.data;
};

export const deleteAddressApi = async (addressId) => {
    const response = await addressApiInstance.delete(`/${addressId}`);
    return response.data;
};
