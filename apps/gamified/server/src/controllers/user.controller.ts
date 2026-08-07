import {
  Controller, Route, Get, Post, Put, Body, Security, Request
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import { User, AvatarConfig } from '@shared/api/models/user.model';
import { UserStats } from '@shared/api/models/user-stats.model';
import { FarmProgress } from '@shared/api/models/farm.model';
import { AttemptResult, SubmitAttemptRequest } from '@shared/api/models/attempt.model';
import { userService } from '@shared/server/src/services/user.service';
import { userStatsService } from '@shared/server/src/services/user-stats.service';
import { farmService } from '@shared/server/src/services/farm.service';
import { attemptService } from '@shared/server/src/services/attempt.service';
import '@shared/server/src/middleware/auth.middleware';

interface SaveDetailsRequest {
  username: string;
  firstName: string;
  lastName: string;
}

interface SaveAvatarRequest {
  // Loosely typed on purpose: tsoa's runtime body validator doesn't reliably
  // validate the AvatarConfig alias (a Record<string, ...> aliased through
  // another Record alias) — every field trips "Could not match the union
  // against any of the items" even for plain strings. The actual shape is
  // opaque to the server anyway (defined by whichever avatar-generation
  // library the client uses), so there's nothing meaningful to validate here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  avatarConfig: Record<string, any>;
}

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

  @Security('jwt')
  @Put('me/details')
  public async saveMyDetails(
    @Request() request: ExpressRequest,
    @Body() body: SaveDetailsRequest
  ): Promise<User> {
    return userService.updateDetails(request.user!, body);
  }

  @Security('jwt')
  @Put('me/avatar')
  public async saveMyAvatar(
    @Request() request: ExpressRequest,
    @Body() body: SaveAvatarRequest
  ): Promise<AvatarConfig> {
    return userService.saveAvatarConfig(request.user!, body.avatarConfig);
  }

  @Security('jwt')
  @Post('me/attempts')
  public async submitAttempt(
    @Request() request: ExpressRequest,
    @Body() body: SubmitAttemptRequest
  ): Promise<AttemptResult> {
    return attemptService.submitAttempt(request.user!, body.questionId, body.selectedOptionId);
  }
}
