import { Controller, Route, Get } from 'tsoa';
import { User } from '@shared/api/models/user.model';

@Route('users')
export class UserController extends Controller {
  
  @Get('')
  public async getUser(): Promise<User[]> {
    return [
      { name: 'John Doe' }, 
      { name: 'Jane Doe' }
    ];
  }
}