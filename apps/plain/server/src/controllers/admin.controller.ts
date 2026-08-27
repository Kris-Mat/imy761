import {
  Controller, Route, Get, Security, Request
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import { StudentAnalytics } from '@shared/api/models/admin.model';
import { userService } from '@shared/server/src/services/user.service';
import { adminService } from '@shared/server/src/services/admin.service';
import '@shared/server/src/middleware/auth.middleware';

// Lives in this app's own package (not apps/shared/server) for the same
// reason as user.controller.ts — see the long comment at the top of that
// file. Business logic (including the ADMIN-role check) stays shared in
// userService.requireAdmin / adminService; only this thin routing class is
// duplicated per app.
//
// This is a research-instrument endpoint, not part of the student-facing
// product: it's only reachable from the client's unlinked /admin route,
// behind both the ordinary auth guard and a role check re-verified here
// server-side (the JWT itself carries no role claim — see
// AuthenticatedUser).
@Route('admin')
export class AdminController extends Controller {

  @Security('jwt')
  @Get('students')
  public async getStudentAnalytics(@Request() request: ExpressRequest): Promise<StudentAnalytics[]> {
    await userService.requireAdmin(request.user!);
    return adminService.getStudentAnalytics();
  }

}
