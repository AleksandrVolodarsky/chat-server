import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';

export class AllSocket extends Socket{

  get task_id(): string {
    return this.value.task_id;
  }

  get token(): string {
    return this.value.token;
  }

  private user;

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
              .collection('messages')
              .find({ task_id: new mongodb.ObjectID(this.task_id) })
              .toArray()
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(res => fn(res))
      .catch(err => this.error(err, 'banner_error'))
  }
}