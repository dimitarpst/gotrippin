import { Controller, Get } from "@nestjs/common";
import { SupabaseService } from "./supabase/supabase.service";

@Controller("health")
export class HealthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getHealth() {
    try {
      const client = this.supabaseService.getClient();
      const { error } = await client.from("profiles").select("id").limit(1);

      if (error) {
        return {
          status: "error",
          supabase: false,
          message: error.message,
        };
      }

      return {
        status: "ok",
        supabase: true,
      };
    } catch (err) {
      return {
        status: "error",
        supabase: false,
        message: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }
}

