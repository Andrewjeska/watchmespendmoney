import axios, { AxiosRequestConfig, Method } from "axios";

// We make an instance here so that /server doesn't use this axios
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `https://${process.env.NEXT_PUBLIC_API_URL}`
    : "http://localhost:5000",
});

interface AxiosPayload {
  data?: any;
  params?: any;
}

// caller must catch errors
export const authenticatedRequest = async (
  user: firebase.User,
  method: Method,
  url: string,
  payload: AxiosPayload
) => {
  const firebaseToken = await user.getIdToken(true);

  var config: AxiosRequestConfig = {
    method,
    url,
    headers: { authToken: firebaseToken },
  };

  const { data, params } = payload;
  if (data) config.data = data;
  if (params) config.params = params;

  return instance(config);
};

export { instance as axios };
