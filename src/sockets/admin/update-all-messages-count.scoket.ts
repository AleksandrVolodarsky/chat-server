import { Socket } from '../socket';
import { EErrors } from '../../enums/eerrors.enum';
import * as hash from 'wordpress-hash-node';
import * as util from 'util';
import * as _ from 'lodash';

export class UpdateAllMessagesCountSocket extends Socket{

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
                .collection('tasks')
                .find()
                .toArray();
            }
          }
          throw new Error(EErrors.not_logged_in);
        }
      )
      .then(
        tasks => {

          if (tasks instanceof Array && tasks.length) {
            tasks.map(
              t => {
                this.app.db
                  .collection('messages')
                  .find({ task_id: t._id })
                  .count()
                  .then(
                    messages_count => {
                      this.app.db
                        .collection('tasks')
                        .update(
                          { _id: t._id },
                          {
                            '$set' : {
                              messages_count: messages_count
                            }
                          }
                        );
                    }
                  );
              }
            );
          }

        }
      )
      .catch(err => this.error(err, 'banner_error'))
  }
}