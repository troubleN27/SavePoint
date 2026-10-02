export type ActionError = {
  ok: false;
  error: string;
  code?: "PRO_REQUIRED" | "LIMIT" | "VALIDATION" | "AUTH";
};

export type ActionResult<T = undefined> = ({ ok: true } & (T extends undefined ? object : { data: T })) | ActionError;
