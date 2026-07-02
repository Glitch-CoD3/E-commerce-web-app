import axios from "axios";

export const cartClient = axios.create({
    baseURL: process.env.CART_SERVICE_URL,
    timeout: 5000
});

export const productClient = axios.create({
    baseURL: process.env.PRODUCT_SERVICE_URL,
    timeout: 5000
});