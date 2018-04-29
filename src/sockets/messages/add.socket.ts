import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';

export class AddSocket extends Socket{

  get message(): string {
    return this.value.message;
  }

  get task_id(): string {
    return this.value.task_id;
  }

  get token(): string {
    return this.value.token;
  }

  private user;

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
            return this.app.db
              .collection('messages')
              .insert({
                message: this.message,
                owner: this.user._id,
                task_id: t._id
              })
          }
          throw new Error(util.format(EErrors.not_found, 'Task'));
        }
      )
      .then(res => this.socket.emit(this.event_name, res))
      .catch(err => this.error(err, 'banner_error'))
  }
}