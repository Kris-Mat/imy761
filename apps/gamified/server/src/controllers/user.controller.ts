import { Controller, Route, Get, Post, Security, Request } from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import { User } from '@shared/api/models/user.model';
import { UserStats } from '@shared/api/models/user-stats.model';
import { FarmProgress } from '@shared/api/models/farm.model';
import { userService } from '@shared/server/src/services/user.service';
import { userStatsService } from '@shared/server/src/services/user-stats.service';
import { farmService } from '@shared/server/src/services/farm.service';
import '@shared/server/src/middleware/auth.middleware';

// Lives in this app's own package (not apps/shared/server) because tsx/esbuild
// fails to transform parameter decorators (e.g. @Request()) on files loaded
// across an npm-workspace package boundary on this environment. Business
// logic stays shared; only this thin routing class is duplicated per app.
//
// Confirmed 2026-08-01: moving this to apps/shared/server crashes esbuild
// ("Parameter decorators only work when experimental decorators are enabled")
// even though that package's tsconfig has experimentalDecorators/
// emitDecoratorMetadata set identically to this one.
//
// Also tried 2026-08-01: replacing @Request() with an AsyncLocalStorage-based
// context (auth.context.ts) so the shared controller would have zero parameter
// decorators. That built and booted fine, but broke at runtime in production
// use — the ALS context set in expressAuthentication does not survive tsoa's
// generated runAuthenticationMiddleware handing off via Express's next()
// (confirmed via a real 500: "getAuthenticatedUser() called outside an
// authenticated request", reproduced live in apps/gamified/server). A
// synthetic await-chain test passed, which was misleading — it didn't
// reproduce Express's actual next()-based middleware dispatch. Do not retry
// ALS here without first proving context survives an actual
// runAuthenticationMiddleware -> next() -> controller hop, not just a
// hand-rolled async simulation.
@Route('users')
export class UserController extends Controller {

  @Security('jwt')
  @Get('')
  public async getUser(): Promise<User[]> {
    return userService.getUsers();
  }

  @Security('jwt')
  @Post('sync')
  public async syncUser(@Request() request: ExpressRequest): Promise<User> {
    // @Security('jwt') guarantees expressAuthentication has run and set request.user.
    return userService.syncFromSupabase(request.user!);
  }

  @Security('jwt')
  @Get('me/stats')
  public async getMyStats(@Request() request: ExpressRequest): Promise<UserStats> {
    return userStatsService.getStatsForSupabaseUser(request.user!);
  }

  @Security('jwt')
  @Get('me/farms')
  public async getMyFarms(@Request() request: ExpressRequest): Promise<FarmProgress[]> {
    return farmService.getFarmsForSupabaseUser(request.user!);
  }
}
