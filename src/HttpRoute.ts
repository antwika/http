import { IHttpHandlable, IHttpHandler } from './IHttpHandler';

export interface IHttpRouteHandlable extends IHttpHandlable {
  paths(): string[];
}

export interface IHttpRouteArgs {
  path?: string | string[];
  paths?: string[];
  routes?: HttpRoute[];
  endpoint?: IHttpHandler;
}

export class HttpRoute implements IHttpHandler {
  private readonly paths: string[];

  private readonly routes?: HttpRoute[];

  private readonly endpoint?: IHttpHandler;

  constructor(args: IHttpRouteArgs) {
    const {
      path, // Deprecated, use paths instead
      paths,
      routes,
      endpoint,
    } = args;

    this.paths = [];

    if (path) console.warn('Deprecation: HttpRoute "path" argument deprecated, use argument "paths" instead');
    if (path && paths) throw new Error('Failed to instantiate HttpRoute because both "paths" and "path" arguments were provided, prefer usage of "paths" only');
    if (!paths && !path) throw new Error('Failed to instantiate HttpRoute because argument neither "path" nor "paths" were provided');
    if (paths && paths.length === 0) throw new Error('Failed to instantiate HttpRoute because "paths" argument is an empty array');

    if (paths) {
      this.paths = paths;
    } else if (path) {
      this.paths = Array.isArray(path) ? path : [path];
    }

    this.routes = routes;
    this.endpoint = endpoint;

    if (!Array.isArray(args.path)) console.warn('Deprecation: HttpRoute "path" argument deprecated, use argument "paths" instead');
  }

  public async canHandle(handlable: IHttpRouteHandlable) {
    const nestedHandlable = this.extractNestedHandlable(handlable);
    if (!nestedHandlable) return false;

    const nestedPaths = nestedHandlable.paths();

    const foundPath = this.paths.some((path) => nestedPaths[0] === path);
    if (!foundPath) return false;

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
