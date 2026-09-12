import { Router } from "express";
import { z } from "zod";
import { ok } from "../lib/apiResponse.js";
import { sendContactMessage } from "../lib/email.js";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
});

export const contactRouter = Router();

contactRouter.post("/", async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const result = await sendContactMessage(body);
    res.json(
      ok({
        received: true,
        emailed: result.sent,
        message: result.sent
          ? "Mesazhi u dërgua."
          : "Mesazhi u pranua. Email-i i serverit nuk është konfiguruar ende — na kontaktoni edhe me telefon.",
      })
    );
  } catch (error) {
    next(error);
  }
});
