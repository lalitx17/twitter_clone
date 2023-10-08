import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { SignInButton, SignOutButton, SignUp, auth } from "@clerk/nextjs";
import { api } from "~/utils/api";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="border-b border-slate-400 p-4 gap-3 flex">
      <Image src={author.profilePictureUrl}
        className="h-16 w-16 rounded-full"
        height={100}
        width={100}
        alt={`@${author.username}`} />
      <div className="flex flex-col">
        <div className="flex text-slate-300 gap-1">
          <span>{`@${author.username}`}</span>
          <span className="font-thin">{`·  ${dayjs(post.createdAt).fromNow()}`}</span>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
};

const CreatePostWizard = () => {
  const { user } = useUser();

  console.log(user);

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.imageUrl}
        height={100}
        width={100}
        alt="Profile Image"
        className="h-16 w-16 rounded-full"
      />

      <input
        placeholder="Type some emojis!!"
        className="grow bg-transparent outline-none"
      />
    </div>
  );
};

export default function Home() {
  const user = useUser();
  const { data, isLoading } = api.posts.getAll.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Something went wrong!</div>;

  return (
    <>
      <Head>
        <title>Tittr</title>
      </Head>

      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4">
            {!user.isSignedIn && (
              <div className="flex justify-center text-white">
                {" "}
                <SignInButton />{" "}
              </div>
            )}
            {user.isSignedIn && <CreatePostWizard />}
          </div>
          <div className="flex flex-col">
            {[...data, ...data]?.map((fullPost) => (
              <PostView {...fullPost} key={fullPost.post.id} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
