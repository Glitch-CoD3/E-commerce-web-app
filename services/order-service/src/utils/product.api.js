import axios from "axios";

const getProductsByIds = async (productIds, token) => {

    try {
        const response = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL}/api/v1/products/${productIds}`,
            {
                headers: {
                    Cookie: `refreshToken=${token}`,
                },
            }
        );


        return response.data.product;

    } catch (error) {
        console.log("Axios Error:");

        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        } else {
            console.log(error.message);
        }

        throw error;
    }
};


const getProductByVariantId = async (id, token) => {
    try {
        const response = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL}/api/v1/product-variants/${id}`,
            {
                headers: {
                    Cookie: `refreshToken=${token}`,
                },
            }
        );

        // Adjust 'variant' to match your API response body key (e.g. response.data.variant or response.data.data)
        return response.data.variant || response.data.data || response.data;

    } catch (error) {
        console.log("Axios Error:");

        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        } else {
            console.log(error.message);
        }

        throw error;
    }
};



const getProductVarientImage = async (id, token) => {
    try {
        const response = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL}/api/v1/product-variants-images/${id}`,
            {
                headers: {
                    Cookie: `refreshToken=${token}`,
                },
            }
        );

        // Adjust 'variant' to match your API response body key (e.g. response.data.variant or response.data.data)
        return response.data.variant || response.data.data || response.data;

    } catch (error) {
        console.log("Axios Error:");

        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        } else {
            console.log(error.message);
        }

        throw error;
    }
};
export { getProductsByIds, getProductByVariantId, getProductVarientImage };