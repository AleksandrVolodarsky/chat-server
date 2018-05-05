import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';

export class ToggleCloseSocket extends Socket{

  get token(): string {
    return this.value.token;
  }

  get task_id(): string {
    let task_id = this.value.task_id;
    if (!task_id) {
      throw new Error(util.format(EErrors.not_found, 'Task ID'));
    }
    return task_id;
  }

  private user;
  private task;

  launch(fn) {
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
            this.user = u;
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
            if (this.user.role != 0 && t.owner != this.user._id.toString()) {
              throw new Error(EErrors.not_owner);
            }
            t.closed = t.closed === true ? false : true;
            this.task = t;
            return this.app.db
              .collection('tasks')
              .updateOne(
                { _id : new mongodb.ObjectID(this.task_id) },
                { "$set" : { "closed" : this.task.closed } }
              );
          }
          throw new Error(util.format(EErrors.not_found, 'Task'));
        }
      )
      .then(
        res => this.app.tasks_service.sendToTaskParticipants(this.task, 'update_task', this.task)
      )
      .catch(err => this.error(err, 'banner_error'))
  }
}