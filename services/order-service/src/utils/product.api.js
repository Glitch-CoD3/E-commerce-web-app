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


        return response.data.data;

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

export { getProductsByIds };