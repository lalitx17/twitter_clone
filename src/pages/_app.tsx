import { type Session } from "next-auth";

import { type AppType } from "next/app";
import { ClerkProvider } from '@clerk/nextjs'
import { api } from "~/utils/api";
import Head from "next/head";

import "~/styles/globals.css";
import { Toaster } from "react-hot-toast";

const MyApp: AppType = ({Component, pageProps}) => {
  return (
    <ClerkProvider>
      <Head>
        <title>Tittr</title>
        <meta name="description" content="💭" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Toaster position="bottom-center" />
      <Component {...pageProps} />

    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
