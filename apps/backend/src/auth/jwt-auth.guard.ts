import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      // Validate Supabase JWT token
      const user = await this.authService.validateToken(token);

      if (!user) {
        throw new UnauthorizedException("Invalid token");
      }

      // Attach user to request
      request.user = user;
      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException("Token validation failed");
    }
  }
}
