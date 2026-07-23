import axios from "axios";

const AxiosInstance = axios.create({
  baseURL:process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // if you're using cookies
});

export default AxiosInstance;