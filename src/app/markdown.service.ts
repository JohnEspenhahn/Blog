import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

@Injectable()
export class MarkdownService {

  constructor(private http: Http) { }

  load(file: string): Observable<String> {
    return this.http.get(`assets/markdown/${file}`).map((value: Response) => {
      return value.text();
    });
  }
}
