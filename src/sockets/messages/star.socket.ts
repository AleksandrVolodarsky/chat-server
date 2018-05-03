import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';

export class StarSocket extends Socket{

  get message_id(): string {
    return this.value.message_id;
  }

  get token(): string {
    return this.value.token;
  }

  private message;

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
            return this.app.db
              .collection('messages')
              .findOne({ _id : new mongodb.ObjectID(this.message_id) })
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(
        m => {
          if (m) {
            this.message = m;
            m.starred = m.starred ? false : true;
            return this.app.db
              .collection('messages')
              .update(
                { _id: new mongodb.ObjectID(this.message_id) }, 
                { "$set": { "starred": m.starred } }
              )
          }
          throw new Error(util.format(EErrors.not_found, `Message ${ this.message_id }`));
        }
      )
      .then(
        updated => this.app.db.collection('tasks').findOne({ _id: this.message.task_id })
      )
      .then(
        t => this.app.tasks_service.sendToTaskParticipants(t, this.event_name, this.message)
      )
      .catch(err => this.error(err, 'banner_error'))
  }
}