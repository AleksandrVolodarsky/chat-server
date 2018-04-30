import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';

export class AddSocket extends Socket{

  get title(): string {
    let title = this.value.title;
    if (title == '') {
      throw new Error(EErrors.empty_task_title);
    }
    return title;
  }

  get description(): string {
    let description = this.value.description;
    if (description <= 24) {
      throw new Error(util.format(EErrors.must_be_more_than, 'Description', '24 characters!'));
    }
    return description;
  }

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
            return this.app.db
              .collection('tasks')
              .insert({
                title: this.title,
                description: this.description,
                owner: u._id,
                created: (new Date()).toISOString().substring(0, 19).replace('T', ' ')
              })
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(res => fn(res))
      .catch(err => this.error(err, 'banner_error'))
  }
}