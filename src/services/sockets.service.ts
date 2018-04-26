import { ISocket } from '../interfaces/isocket';

export class SocketsService {
  private initialized: Array<any>;

  constructor(
    private app:any, 
    private socket_object: any, 
    private sockets: Array<ISocket>) {
  }

  init() {
    this.sockets.map(
      s => {
        this
        this.socket_object.on(
          s.name,
          v => {
            return (new s.socket_service(this.app, this.socket_object, s.name, v)).launch();
          }
        );
      }
    );
  }

  public static success(value: any, res, status_code = 200) {
    if (value instanceof Array) {
      value = value.map(
        el => el.toSimpleObject !== undefined ? el.toSimpleObject() : el
      );
    }
    if (value) {
      value = value.toSimpleObject !== undefined ? value.toSimpleObject() : value;
    }
    return res.status(status_code).json(value);
  }

  public static error(value, res, status_code = 400) {
    if (typeof value === 'string') {
      value = { msg: value };
    }
    if (value instanceof Error) {
      value = { 
        msg: value.message,
        line: value.stack
      };
    }
    console.log(value);
    return res.status(status_code).json(value);
  }
}
