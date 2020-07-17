import axios from "axios";

// We make an instance here so that /server doesn't use this axios
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `https://${process.env.NEXT_PUBLIC_API_URL}`
    : "http://localhost:5000",
});

export { instance as axios };
