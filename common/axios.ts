import axios from "axios";

// We make an instance here so that /server doesn't use this axios
// TODO: Set up TLS
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `http://${process.env.NEXT_PUBLIC_API_URL}`
    : "http://localhost:5000",
});

export { instance as axios };
