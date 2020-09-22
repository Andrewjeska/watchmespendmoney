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
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=UA-169999153-1"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'UA-169999153-1');`,
          }}
        ></script>
      </Head>

      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
