import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';

export class LoginSocket extends Socket{

  get email(): string {
    return this.value.email;
  }

  get password(): string {
    return this.value.password;
  }

  get passwordHash(): string {
    return hash.HashPassword(this.password);
  }

  launch() {

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

          if (this.password.length <= 4) {
            throw new Error(util.format(EErrors.must_be_more_than, 'Password', '4 characters!'));
          }
          return this.app.db.collection('users').findOne({ email: this.email });
        }
      )
      .then(
        u => {
          if(u.password) {
            if (hash.CheckPassword(this.password, u.password)) {
              return this.socket.emit(this.event_name, u);
            }
          }
          throw new Error(EErrors.password_incorrect);
        }
      )
      .catch(err => this.error(err, 'banner_error'))
  }
}