import AxiosInstance from "../api/axiosInstance";

export interface CategoryType {
  id: number;
  category_name: string;
  url_slug: string;
  parent_category_id: number | null;
}

// Create category Api call
export const createCategory = async (data: CategoryType) => {
  const response = await AxiosInstance.post("/categories", data);
  return response.data;
};

//Gate all Categories Api call
export const getCategories = async () => {
  const response = await AxiosInstance.get("/categories");
  return response.data;
};

//Gate category By category id
// export const getCategoryById

