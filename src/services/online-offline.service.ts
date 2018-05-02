export class OnlineOfflineService {
  private users: any;

  constructor(
    private app:any) {
    this.users = {};
  }

  sendTo(name, token, data) {
    if (this.users[ token ] instanceof Array && this.users[ token ].length > 0) {
      this.users[ token ].map(
        socket_id => {
          this.app.io.to(socket_id).emit(name, data);
        }
      );
    }
  }

  addSocketID(token, socket_id) {
    if (token != null && !this.isHave(token, socket_id)) {
      this.users[ token ] = this.users[ token ] || [];
      if (this.users[ token ].indexOf(socket_id) == -1) {
        this.users[ token ].push(socket_id);
      }
      console.log('.::Connected::.', token, socket_id);
      console.log(this.users);
      console.log('');

      this.getIDs().then(ids => this.app.io.emit('online_offline', ids));
    }
    return this;
  }

  isHave(token, socket_id) {
    return this.users[ token ] instanceof Array && this.users[ token ].indexOf(socket_id) > -1;
  }

  removeSocketID(socket_id) {
    let tokens, ret_tokens, ret;

    tokens     = this.getTokens();
    ret_tokens = [];
    ret        = {};

    this.getTokens().map(
      t => {
        if (this.isHave(t, socket_id)) {
          this.users[ t ] = this.users[ t ].filter(id => id != socket_id);
          this.clearEmpty();
          console.log('.::Disconnected::.', socket_id);
          console.log(this.users);
          console.log('');
          this.getIDs().then(ids => this.app.io.emit('online_offline', ids));
        }
      }
    );
    return this;
  }

  clearEmpty() {
    let ret, tokens, not_empty_tokens;

    tokens     = this.getTokens();
    not_empty_tokens = [];
    ret        = {};

    if (tokens instanceof Array && tokens.length > 0) {
      tokens.map(
        t => {
          if(this.users[ t ] instanceof Array && this.users[ t ].length > 0) {
            not_empty_tokens.push(t);
          }
        }
      );

      not_empty_tokens.map(
        t => {
          ret[ t ] = this.users[ t ];
        }
      );

      this.users = ret;
    }
    return this;
  }

  getTokens() {
    return Object.keys(this.users);
  }

  tokensToIDs(tokens) {
    let query = { "$or" : [] };
    tokens.map(
      t => {
        query['$or'].push({ token : t });
        return t;
      }
    );
    if (query['$or'].length > 0) {
      return this.app.db
        .collection('users')
        .find(query, { fields: { _id: 1 }})
        .map(f => f._id)
        .toArray();
    }
    return new Promise((resolve, reject) => { resolve([]) });
  }

  getIDs() {
    return this.tokensToIDs(this.getTokens());
  }
}
