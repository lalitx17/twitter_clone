import Head from "next/head";

import type { NextPage } from "next";

import { api } from "~/utils/api";

import superjson from "superjson";
import { db } from "~/server/db";
import { appRouter } from "~/server/api/root";
import type { GetStaticProps } from "next";
import Image from "next/image";

const ProfilePage: NextPage<{ username: string }> = () => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username: "lalitx17",
  });

  if (isLoading) return <div>Loading</div>;

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>

        <PageLayout>
          <div className="relative h-36 bg-slate-600">
            <Image
              src={data.profilePictureUrl}
              alt={`${data.username ?? ""}'s profile pic`}
              width={128}
              height={128}
              className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4 border-black bg-black"
            />
            
          </div>
          <div className="h-[64px]" />
          <div className="p-2 text-2xl font-bold">{`@${data.username ?? ""}`}</div>
          <div className="w-full border-b border-slate-400" />
        </PageLayout>

    </>
  );
};

import { createServerSideHelpers } from "@trpc/react-query/server";
import { PageLayout } from "~/components/layout";

export const getStaticProps: GetStaticProps = async (context) => {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });
  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await helpers.profile.getUserByUsername.prefetch({ username: slug });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
