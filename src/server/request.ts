import api from "./API";

export const timezone = (action: "GET" | "PUT", data?: any) => {
  const root = "api/timezone";
  switch (action) {
    case "GET":
      return api.get(root);
    case "PUT":
      return api.put(root, data);
    default:
      break;
  }
};

export const shift = (
  action: "GET" | "PUT" | "DELETE" | "POST",
  data?: any,
  id?: number
) => {
  const root = "api/shift";
  switch (action) {
    case "GET":
      return api.get(root, data);
      break;
    case "PUT":
      return api.put(`${root}/${id}`, data);
      break;
    case "DELETE":
      return api.delete(`${root}/${id}`, data);
      break;
    case "POST":
      return api.post(root, data);
      break;
    default:
      break;
  }
};
