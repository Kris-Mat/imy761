import { Controller, Route, Get } from 'tsoa';
import { Monolith } from '@shared/api/models/monolith.model';
import { monolithService } from '../services/monolith.service';

@Route('monoliths')
export class MonolithController extends Controller {

  @Get('')
  public async getMonoliths(): Promise<Monolith[]> {
    return monolithService.getMonoliths();
  }
}
