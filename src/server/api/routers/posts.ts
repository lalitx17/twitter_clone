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

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */ 
  prefix: "@upstash/ratelimit",
});

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: [{createdAt: 'desc'}]
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

  create: protectedProcedure.input(z.object({
    content: z.string().emoji().min(1).max(10)
  })).mutation(async ({ctx, input}) => {
    const authorId = ctx.userId;

    const { success } = await ratelimit.limit(authorId);

    if (!success) throw new TRPCError({ code:"TOO_MANY_REQUESTS"})

    const post = await ctx.db.post.create({
      data:{
        authorId, 
        content: input.content,
      }
    });
    return post;
  })
});
