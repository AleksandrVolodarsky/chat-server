import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as child from 'child_process';
import * as io from 'socket.io';
import * as mongodb from 'mongodb';
import * as Auth from './sockets/auth/index';
import * as Tasks from './sockets/tasks/index';
import * as Messages from './sockets/messages/index';
import * as Users from './sockets/users/index';
import * as Participants from './sockets/participants/index';
import * as _ from 'lodash';
import { Router, Request, Response, NextFunction } from 'express';

import { ViewsService } from './services/views.service';
import { SocketsService } from './services/sockets.service';
import { TasksService } from './services/tasks.service';
import { OnlineOfflineService } from './services/online-offline.service';

import { ISocket } from './interfaces/isocket';

class App {
  public express: express.Application;
  public io: any;
  public db: any;
  public mongo_client: any;
  public sockets_service: SocketsService;
  public sockets: Array<ISocket>;
  public online_offline: OnlineOfflineService;
  public tasks_service: TasksService;

  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.io = io('13665');
    this.online_offline = new OnlineOfflineService(this);
    this.tasks_service  = new TasksService(this);

    this.sockets = [
      {
        name: 'participant_add',
        socket_service: Participants.AddSocket
      },
      {
        name: 'participant_remove',
        socket_service: Participants.RemoveSocket
      },
      {
        name: 'registration',
        socket_service: Auth.RegistrationSocket
      },
      {
        name: 'login',
        socket_service: Auth.LoginSocket
      },
      {
        name: 'lost_password',
        socket_service: Auth.LostPasswordSocket
      },
      {
        name: 'reset_password',
        socket_service: Auth.ResetPasswordSocket
      },
      {
        name: 'task_add',
        socket_service: Tasks.AddSocket
      },
      {
        name: 'task_all',
        socket_service: Tasks.AllSocket
      },
      {
        name: 'message_add',
        socket_service: Messages.AddSocket
      },
      {
        name: 'messages',
        socket_service: Messages.AllSocket
      },
      {
        name: 'users_all',
        socket_service: Users.AllSocket
      }
    ];
    
    this.io
      // .use(
      //   (socket, next) => {
      //     this.online_offline.addSocketID(_.get(socket, 'handshake.query.token', null), socket.id);
      //     next();
      //   }
      // )
      .on(
        'connection',
        (socket) => {
          
          socket.use(
            (s, next) => {
              this.online_offline.addSocketID(_.get({ s }, 's[1].token', null), socket.id);
              next();
            }
          );

          socket.on(
            'disconnect', 
            () => {
              this.online_offline.removeSocketID(socket.id);
            }
          );
          this.sockets_service = new SocketsService(this, socket, this.sockets);
          this.sockets_service.init();
        }
      );
    this.initMongo();
  }

  initMongo() {
    this.mongo_client = mongodb.MongoClient;
    this.mongo_client.connect(
      'mongodb://localhost:27017/',
      (err, client) => {
        if (err) {
          console.log(err);
        }
        this.db = client.db('cnchat');
      }
    )
    return this;
  }

  private middleware(): void {
    // view engine setup
    this.express.set('views', path.join(path.dirname(__dirname), 'views'));
    this.express.set('view engine', 'twig');

    this.express.use(logger('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  private catch404(req, res, next) {
    let err = new Error('Not Found');
    (<any>err).status = 404;
    next(err);
  }

  private errorHandler(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  }

  // Configure API endpoints.
  private routes(): void {
    let router = express.Router();
    this.express.use(cors());
    router.get('/', this.mainRoute);

    this.express.use('/', router);

    this.express.use((req, res, next) => { this.catch404(req, res, next) });
    this.express.use((err, req, res, next) => { this.errorHandler(err, req, res, next) });
  }

  mainRoute(req: Request, res: Response, next: NextFunction) {
    ViewsService.render(res, 'main')
      .then(html => res.send(html))
  }

}

export default new App().express;
