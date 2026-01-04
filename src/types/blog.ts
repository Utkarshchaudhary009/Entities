
import { z } from "zod";
export const BlogPostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string(),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;
