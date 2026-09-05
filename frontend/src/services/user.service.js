import AxiosInstance from '../api/axiosInstance'


//getUser
export const getUserById = async (id)=>{
    const user = await AxiosInstance.get(`/auth/user/${id}`)
    return user.data;
}

export const getme = async ()=>{
    const user = await AxiosInstance.get(`/auth/get-me`)
    return user.data;
}