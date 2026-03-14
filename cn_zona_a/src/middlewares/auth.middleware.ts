import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/auth.types";

export function auth(requiredRole?: string) {

  return (req: Request, res: Response, next: NextFunction) => {

    const header = req.headers.authorization;

    if (!header) return res.status(401).json({ message: "No token" });

    const token = header.split(" ")[1];

    try {

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      (req as any).user = decoded;

      if (requiredRole && decoded.role !== requiredRole)
        return res.status(403).json({ message: "Forbidden" });

      next();

    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

  };

}