import { createServer, IncomingMessage, ServerResponse } from 'http';
import { IServiceArgs, Service } from '@antwika/common';
import { IHttpHandler } from './IHttpHandler';

export interface IHttpServerArgs extends IServiceArgs {
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
    this.host = args.host;
    this.port = args.port;
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
    for (const httpHandler of this.httpHandlers) {
      if (await httpHandler.canHandle({ req: () => req, res: () => res })) {
        await httpHandler.handle({ req: () => req, res: () => res });
        return;
      }
    }
  }
}
