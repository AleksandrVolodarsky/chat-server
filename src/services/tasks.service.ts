import * as mongodb from 'mongodb';

export class TasksService {

  constructor(
    private app:any) {}

  public sendToTaskParticipants(task, event_name, data) {
    return Promise
      .resolve()
      .then(
        nothing => {
          let ids, query;
          ids = [task.owner];
          if (task.participants instanceof Array) {
            ids = ids.concat(task.participants);
          }
          query = { "$or" : [] };
          ids.map(
            id => {
              query['$or'].push({ _id : new mongodb.ObjectID(id) });
              return id;
            }
          );
          return this.app.db
            .collection('users')
            .find(query, { token: true })
            .toArray();
        }
      )
      .then(
        tokens => {
          if (tokens instanceof Array && tokens.length > 0) {
            tokens.map(
              t => {
                if (t.token) {
                  this.app.online_offline.sendTo(event_name, t.token, data);
                }
              }
            );
          }
        }
      )
  }
}
