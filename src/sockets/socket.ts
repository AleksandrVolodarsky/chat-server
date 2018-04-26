export abstract class Socket{
  constructor(
    protected app: any, 
    protected socket: any,
    protected event_name: string,
    protected value: any) {}

  public error(value, event: string = '') {
    if (event == '') {
      event = this.event_name;
    }
    this.socket.emit(
      event,
      { 
        msg: value.message,
        line: value.stack
      }
    );
    return this;
  }
  abstract launch();
}