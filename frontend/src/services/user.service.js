import AxiosInstance from '../api/axiosInstance'


//getUser
export const getUserById = async (id)=>{
    const user = await AxiosInstance.get(`/auth/user/${id}`)
    return user.data;
}