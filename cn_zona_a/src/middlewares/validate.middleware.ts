import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        // Return without returning the Response object to avoid Promise<void> type errors
        res.status(400).json({ 
          error: 'Datos inválidos', 
          details: errors 
        });
        return;
      }
      
      res.status(500).json({ error: 'Error de validación interno' });
    }
  };
};
