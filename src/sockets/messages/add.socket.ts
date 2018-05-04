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

  get files(): Array<any> {
    return this.value.files;
  }

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
            let data = {
              message: this.message,
              owner: this.user._id,
              task_id: t._id,
              created: (new Date()).toISOString().substring(0, 19).replace('T', ' ')
            };

            if (this.files instanceof Array && this.files.length > 0) {
              data['files'] = this.files;
            }
            return this.app.db
              .collection('messages')
              .insert(data)
          }
          throw new Error(util.format(EErrors.not_found, 'Task'));
        }
      )
      .then(
        res => {
          let messages_count = parseInt(this.task.messages_count) || 0;
          messages_count++;
          this.task.messages_count = messages_count;
          this.app.io.emit(this.event_name, res);
          return this.app.db
            .collection('tasks')
            .update(
              { _id: this.task._id },
              {
                "$set": { 
                  "messages_count": messages_count
                },
              }
            )
        }
      )
      .then(
        res => this.app.tasks_service.sendToTaskParticipants(this.task, 'update_task', this.task)
      )
      .catch(err => this.error(err, 'banner_error'))
  }
}