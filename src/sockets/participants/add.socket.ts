import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';

export class AddSocket extends Socket{

  get id(): string {
    let id = this.value.id;
    if (!id) {
      throw new Error(util.format(EErrors.not_found, 'ID'));
    }
    return id;
  }

  get task_id(): string {
    let task_id = this.value.task_id;
    if (!task_id) {
      throw new Error(util.format(EErrors.not_found, 'Task ID'));
    }
    return task_id;
  }

  get token(): string {
    return this.value.token;
  }

  private task;

  launch() {
    return Promise
      .resolve()
      .then(
        nothing => {
          return this.app.db
            .collection('users')
            .findOne({ token: this.token }, { password: false });
        }
      )
      .then(
        u => {
          if(u) {
            return this.app.db
              .collection('tasks')
              .findOne({
                _id : new mongodb.ObjectID(this.task_id)
              });
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(
        t => {
          if (t) {
            let participants = t.participants || [];
            if (participants.indexOf(this.id) == -1) {
              participants.push(this.id);
              this.task = t;
              this.task.participants = participants;
              return this.app.db
                .collection('tasks')
                .updateOne(
                  { _id : new mongodb.ObjectID(this.task_id) },
                  { "$set" : { "participants" : participants } }
                );
            }
            throw new Error(EErrors.developer_exists);
          }
          throw new Error(util.format(EErrors.not_found, 'Task'));
        }
      )
      .then(
        res => {
          let ids, query;
          ids = [this.task.owner];
          if (this.task.participants instanceof Array) {
            ids = ids.concat(this.task.participants);
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
                  this.app.online_offline.sendTo('update_task', t.token, this.task);
                }
              }
            );
          }
        }
      )
      .catch(err => this.error(err, 'banner_error'))
  }
}