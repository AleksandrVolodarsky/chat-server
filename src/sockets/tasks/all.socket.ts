import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';

export class AllSocket extends Socket{

  get token(): string {
    return this.value.token;
  }

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
            if (u.role == 0) {
              return this.app.db
                .collection('tasks')
                .find().toArray();
            }
            return this.app.db
              .collection('tasks')
              .find({ 
                '$or': [
                  { participants: u._id.toString() },
                  { owner: u._id }
                ] 
              })
              .toArray();
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(res => fn(res))
      .catch(err => this.error(err, 'banner_error'))
  }
}