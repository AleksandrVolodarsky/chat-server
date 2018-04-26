import { Response } from 'express';

export class ViewsService {

  public static render(res: Response, view: string, options?: any) {
    return new Promise(
      (resolve, reject) => {
        res.render(
          view, 
          options,
          (err, html) => {
            resolve(html);
          }
        );
      }
    );
  }
}
