import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';
import * as md5 from 'md5';

export class RegistrationSocket extends Socket{

  get name(): string {
    return this.value.name;
  }

  get email(): string {
    return this.value.email;
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
          if (this.email == '') {
            throw new Error(EErrors.empty_login_name);
          }

          if (this.email.length > 60) {
            throw new Error(EErrors.username_not_by_longer);
          }

          if (this.password.length <= 4) {
            throw new Error(util.format(EErrors.must_be_more_than, 'Password', '4 characters!'));
          }

          if (this.name == '') {
            throw new Error(EErrors.empty_name);
          }
          return this.app.db.collection('users').find({ email: this.email }).toArray();
        }
      )
      .then(
        u => {
          if (u instanceof Array && u.length > 0) {
            throw new Error(EErrors.username_exists);
          }
          return this.app.db
            .collection('users')
            .insert({
              name: this.name,
              email: this.email,
              password: this.passwordHash,
              created: (new Date()).toISOString().substring(0, 19).replace('T', ' '),
              role: 1,
              token: md5(this.email + this.passwordHash + '.::HACK THE SYSTEM::.')
            });
        }
      )
      .then(res => fn(res))
      .catch(msg => this.error(msg, 'banner_error'));
  }
}