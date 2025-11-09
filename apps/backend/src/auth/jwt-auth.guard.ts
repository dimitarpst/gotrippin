import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      // Validate Supabase JWT token
      const user = await this.authService.validateToken(token);

      if (!user) {
        throw new UnauthorizedException("Invalid token");
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Token validation failed");
    }
  }
}
