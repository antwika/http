import { IHttpHandlable, IHttpHandler } from './IHttpHandler';

export interface IHttpRouteHandlable extends IHttpHandlable {
  paths(): string[];
}

export interface IHttpRouteArgs {
  path: string;
  routes?: HttpRoute[];
  endpoint?: IHttpHandler;
}

export class HttpRoute implements IHttpHandler {
  private readonly path: string;

  private readonly routes?: HttpRoute[];

  private readonly endpoint?: IHttpHandler;

  constructor(args: IHttpRouteArgs) {
    this.path = args.path;
    this.routes = args.routes;
    this.endpoint = args.endpoint;
  }

  public async canHandle(handlable: IHttpRouteHandlable) {
    const nestedHandlable = this.extractNestedHandlable(handlable);
    if (!nestedHandlable) return false;

    const nestedPaths = nestedHandlable.paths();

    if (nestedPaths[0] !== this.path) return false;

    if (this.routes) {
      for (const route of this.routes) {
        // eslint-disable-next-line no-await-in-loop
        if (await route.canHandle(nestedHandlable)) {
          return true;
        }
      }
    }

    if (this.endpoint && nestedPaths.length === 1) {
      return this.endpoint.canHandle(handlable);
    }

    return false;
  }

  public async handle(handlable: IHttpRouteHandlable) {
    const nestedHandlable = this.extractNestedHandlable(handlable);
    if (!nestedHandlable) return;

    if (this.routes) {
      for (const route of this.routes) {
        // eslint-disable-next-line no-await-in-loop
        if (await route.canHandle(nestedHandlable)) {
          // eslint-disable-next-line no-await-in-loop
          await route.handle(nestedHandlable);
          return;
        }
      }
    }

    if (this.endpoint) {
      await this.endpoint.handle(handlable);
    }
  }

  public extractNestedHandlable(handlable: IHttpRouteHandlable): IHttpRouteHandlable | void {
    const request = handlable.req();

    if (!request.url) return;

    let paths;
    if (handlable.paths !== undefined) {
      paths = handlable.paths();
    } else {
      const baseUrl = 'http://example.com';
      const url = new URL(`${baseUrl}${request.url}`);
      paths = url.pathname.split('/').map((path) => `/${path}`);
    }

    const nestedPaths = paths.slice(1);

    // eslint-disable-next-line consistent-return
    return { ...handlable, paths: () => nestedPaths };
  }
}
