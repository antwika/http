import { createServer, IncomingMessage, ServerResponse } from 'http';
import { AppArguments } from '@antwika/app';
import { IServiceArgs, Service } from '@antwika/common';
import { IHttpHandler } from './IHttpHandler';

export interface IHttpOperation {
  req(): IncomingMessage,
  res(): ServerResponse,
}

export interface IHttpServerArgs extends IServiceArgs {
  appArguments?: AppArguments;
  host: string;
  port: number;
  httpHandlers: IHttpHandler[];
}

export class HttpServer extends Service {
  private readonly host: string;

  private readonly port: number;

  private readonly httpHandlers: IHttpHandler[];

  constructor(args: IHttpServerArgs) {
    super({ name: 'HttpServer', services: [] });
    const port = parseInt(args.appArguments?.args.find((arg) => arg.longName === 'port')?.value, 10);
    this.host = args.host;
    this.port = port || args.port;
    this.httpHandlers = args.httpHandlers;
  }

  public async onStart() {
    const server = createServer(this.requestListener);
    await new Promise((resolve: any) => {
      server.listen(this.port, this.host, () => {
        resolve();
      });
    });

    console.log(`HttpServer is running on: http://${this.host}:${this.port}`);
  }

  public async onStop() {
    console.log('HttpServer stopping...');
  }

  public requestListener = async (req: IncomingMessage, res: ServerResponse) => {
    const operation: IHttpOperation = { req: () => req, res: () => res };
    for (const httpHandler of this.httpHandlers) {
      // eslint-disable-next-line no-await-in-loop
      if (await httpHandler.canHandle(operation)) {
        // eslint-disable-next-line no-await-in-loop
        await httpHandler.handle(operation);
        return;
      }
    }
  };

  public getPort() {
    return this.port;
  }
}
