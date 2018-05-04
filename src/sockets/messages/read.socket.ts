import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';

export class ReadSocket extends Socket{

  get task_id(): string {
    return this.value.task_id;
  }

  get token(): string {
    return this.value.token;
  }

  private user;
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
            this.user = u;
            return this.app.db
              .collection('tasks')
              .findOne({ _id : new mongodb.ObjectID(this.task_id) })
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(
        t => {
          if (t) {
            this.task = t;
            this.user.last_read_index = this.user.last_read_index || {};
            this.user.last_read_index[ this.task_id ] = t.messages_count;

            return this.app.db
              .collection('users')
              .update(
                { _id: this.user._id },
                {
                  '$set' : { last_read_index: this.user.last_read_index }
                }
              )
          }
          throw new Error(util.format(EErrors.not_found, 'Task'));
        }
      )
      .then(
        res => this.app.tasks_service.sendToTaskParticipants(this.task, this.event_name, this.task)
      )
      .catch(err => this.error(err, 'banner_error'))
  }
}