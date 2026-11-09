import { z } from "zod";

export const unsubscribeSchema = z.object({
  token: z
    .string({ required_error: "Unsubscribe token is required" })
    .min(1, "Unsubscribe token cannot be empty"),
});

