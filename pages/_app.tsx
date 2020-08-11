import { AppProps } from "next/app";
import Head from "next/head";
import "semantic-ui-css/semantic.min.css";
import "./styles.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Watch me spend money: Stop wasting money on stupid things</title>
        <meta
          name="description"
          content="Share your expenses with your friends to hold yourself accountable to your spending goals"
        ></meta>
      </Head>

      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
