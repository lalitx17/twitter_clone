import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { SignInButton, SignOutButton, SignUp, auth } from "@clerk/nextjs";
import { api } from "~/utils/api";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

import { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";

import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";

dayjs.extend(relativeTime);


const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;

      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to Post! Try again Later");
      }
    },
  });

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
        type="text"
        disabled={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {input !== "" && !isPosting && (
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}

      {isPosting && (
        <div className="item-center flex justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postLoading } = api.posts.getAll.useQuery();

  if (postLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong!</div>;

  return (
    <div className="flex grow flex-col overflow-y-scroll">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

export default function Home() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  //start fetching data asap
  api.posts.getAll.useQuery();

  if (!userLoaded) return <div />;

  return (
    <>
      <PageLayout>
      <div className="flex border-b border-slate-400 p-4">
            {!isSignedIn && (
              <div className="flex justify-center text-white">
                {" "}
                <SignInButton />{" "}
              </div>
            )}
            {isSignedIn && <CreatePostWizard />}
          </div>
          <Feed />
          </PageLayout>
    </>
  );
}
