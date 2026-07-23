import AxiosInstance from "../api/axiosInstance";

export const signupUser = async (data: {
  name: string;
  email: string;
  password: string;
  phone_number: string;

}) => {
  const response = await AxiosInstance.post("/auth/register", data);
  return response.data;
};


export const signin_User = async (data: {
  email: string;
  password: string;

}) => {
  const response = await AxiosInstance.post("/auth/login", data);
  return response.data;
};


export const submitOtp = async (data: {
  email: string;
  otp: string;

}) => {
  const response = await AxiosInstance.post("/auth/email-verify", data);
  return response.data;
};


export const resendOtp = async (data: {
  email: string;
}) => {
  const response = await AxiosInstance.post("/auth/resend-otp", data);
  return response.data;
};


