import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';

export class LostPasswordSocket extends Socket{

  get email(): string {
    return this.value.email;
  }

  get random_string(): string {
    return _.times(20, () => _.random(35).toString(36)).join('');
  }

  launch() {
    const lost_password_key = this.random_string;
    return Promise
      .resolve()
      .then(
        nothing => {
          if (this.email == '') {
            throw new Error(EErrors.empty_login_name);
          }

          if (this.email.length > 60) {
            throw new Error(EErrors.username_not_by_longer);
          }
          return this.app.db.collection('users').findOne({ email: this.email });
        }
      )
      .then(
        u => {
          if (u) {
            return this.app.db
              .collection('users')
              .update(
                { email: this.email}, 
                { 
                  "$set": 
                  { 
                    "lost_password_key": lost_password_key,
                    "lost_password_time": (new Date()).toISOString().substring(0, 19).replace('T', ' ')
                  } 
                }
              )
          }
          throw new Error(util.format(EErrors.not_found, 'User'));
        }
      )
      .then(res => this.socket.emit(this.event_name, res))
      .catch(err => this.error(err, 'banner_error'))
  }
}