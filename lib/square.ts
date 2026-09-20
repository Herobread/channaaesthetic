// lib/square.ts
import "server-only"; // Guarantees build fails if imported by a client component
import { SquareClient, SquareEnvironment } from "square";

export const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});
