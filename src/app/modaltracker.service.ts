import { Injectable } from '@angular/core';

@Injectable()
export class ModaltrackerService {

  private _open: boolean;

  constructor() { 
    this._open = false;
  }

  public setOpen() {
    this._open = true;
  }

  public setClosed() {
    this._open = false;
  }

  public isOpen() {
    return this._open;
  }

}
