import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AnalyzeRequestSchema } from '../core/schemas';

export const validateAnalyzeRequest = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Synchronously parse and validate the incoming JSON body against our Zod schema
    req.body = AnalyzeRequestSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // According to API contract Section 4.1: Return 400 for malformed input/missing fields
      res.status(400).json({
        error: "Malformed input",
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }
    
    // 500 fallback per contract rules (must not expose stack traces)
    res.status(500).json({ error: "Internal server error during validation" });
  }
};
