import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { fail, HttpError } from "../lib/apiResponse.js";
import { env } from "../lib/env.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    return res.status(error.status).json(fail(error.message, error.details));
  }
  if (error instanceof ZodError) {
    return res.status(400).json(
        fail(
        "Kërkesë e pavlefshme",
        error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      )
    );
  }
  console.error(error);
  return res.status(500).json(
    fail(env.isProd ? "Something went wrong" : error instanceof Error ? error.message : "Server error")
  );
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json(fail("Not found"));
}
