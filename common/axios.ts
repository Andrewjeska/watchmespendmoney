import axios from "axios";

axios.defaults.baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export { axios };
