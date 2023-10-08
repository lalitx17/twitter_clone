import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";
import type { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return { id: user.id, username: user.username, profilePictureUrl: user.imageUrl }
}

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
    });

    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })).map(filterUserForClient);



    return posts.map((post) => {   //create an object that combines the post and the data of the author from the clerk. 
      const author = users.find((user) => user.id === post.authorId);
      if (!author?.username)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author for the post not found",
        });

      return {
        post,
        author:{
          ...author, 
          username: author.username
        }
      };
    });
  }),
});
