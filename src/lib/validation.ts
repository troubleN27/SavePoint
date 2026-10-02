import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, "Ник: от 3 до 24 символов, латиница, цифры и _");
