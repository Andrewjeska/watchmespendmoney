import { AppProps } from "next/app";
import "semantic-ui-css/semantic.min.css";
import "./styles.css";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
