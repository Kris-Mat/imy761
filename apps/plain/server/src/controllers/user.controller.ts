import { Controller, Route, Get, Post, Security, Request } from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import { User } from '@shared/api/models/user.model';
import { userService } from '@shared/server/src/services/user.service';
import '@shared/server/src/middleware/auth.middleware';

// Lives in this app's own package (not apps/shared/server) because tsx/esbuild
// fails to transform parameter decorators (e.g. @Request()) on files loaded
// across an npm-workspace package boundary on this environment. Business
// logic stays shared; only this thin routing class is duplicated per app.
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
}
