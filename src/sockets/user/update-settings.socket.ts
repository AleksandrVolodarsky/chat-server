import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';

export class UpdateSettingsSocket extends Socket{

  get token(): string {
    return this.value.token;
  }

  get name(): string {
    return this.value.name;
  }

  get password(): string {
    return this.value.password;
  }

  get email(): string {
    return this.value.email;
  }

  get avatar(): string {
    return this.value.avatar;
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
            let data = {};
            if (this.password != '') {
              if (this.password.length > 4) {
                data['password'] = this.password;
              } else {
                throw new Error(util.format(EErrors.must_be_more_than, 'Password', '4 characters!'));
              }
            }

            if (this.email != '') {
              data['email'] = this.email;
            }

            if (this.name != '') {
              data['name'] = this.name;
            }

            if (this.avatar != '') {
              data['avatar'] = this.avatar;
            }

            return this.app.db
              .collection('users')
              .update(
                { _id: u._id },
                { '$set': data }
              )
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(
        res => {
          fn(this.user);
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
            .toArray();
        }
      )
      .then(
        users => {
          this.app.io.emit(
            'users_all',
            users
          );
        }
      )
      .catch(err => this.error(err, 'banner_error'))
  }
}