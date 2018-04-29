import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';

export class AllSocket extends Socket{

  get token(): string {
    return this.value.token;
  }

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
            if (u.role == 0) {
              return this.app.db
                .collection('users')
                .find()
                .toArray();
            }
            return this.app.db
              .collection('users')
              .find(
                {},
                {
                  password: false,
                  email: false,
                  token: false
                }
              )
              .toArray()
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(res => this.socket.emit(this.event_name, res))
      .catch(err => this.error(err, 'banner_error'))
  }
}