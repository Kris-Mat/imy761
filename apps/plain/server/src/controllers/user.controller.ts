import { Controller, Route, Get } from 'tsoa';
import { User } from '@shared/api/models/user.model';
import { userService } from '@plain-server/services/user.service';

@Route('users')
export class UserController extends Controller {

  @Get('')
  public async getUser(): Promise<User[]> {
    return userService.getUsers();
  }
}