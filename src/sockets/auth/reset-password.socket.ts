import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';

export class ResetPasswordSocket extends Socket{

  get key(): string {
    return this.value.key;
  }

  get password(): string {
    return this.value.password;
  }

  get passwordHash(): string {
    return hash.HashPassword(this.password);
  }

  launch(fn) {

    return Promise
      .resolve()
      .then(
        nothing => {
          if (this.key == '') {
            throw new Error(EErrors.invalid_lost_password_key);
          }

          if (this.password.length <= 4) {
            throw new Error(util.format(EErrors.must_be_more_than, 'Password', '4 characters!'));
          }
          return this.app.db.collection('users').findOne({ lost_password_key: this.key });
        }
      )
      .then(
        u => {
          if (u) {
            let yesterday: Date, lost_password_time: Date;
            yesterday = new Date();
            yesterday.setDate(yesterday.getDate()-1);
            lost_password_time = new Date(Date.parse(u.lost_password_time));
            if (yesterday < lost_password_time) {
              return this.app.db
                .collection('users')
                .update(
                  { email: u.email }, 
                  { 
                    "$set": { 
                      "password": this.passwordHash
                    },
                    "$unset": {
                      "lost_password_key": true,
                      "lost_password_time": true
                    }
                  }
                );
            } else {
              throw new Error('Lost password key expired');
            }
          }
          throw new Error(util.format(EErrors.not_found, 'User'));
        }
      )
      .then(res => fn(res))
      .catch(err => this.error(err, 'banner_error'))
  }
}