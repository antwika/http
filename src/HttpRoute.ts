import { IHttpHandlable, IHttpHandler } from './IHttpHandler';
import { RouteDataParser } from './RouteDataParser';

export interface IHttpRouteHandlable extends IHttpHandlable {
  paths(): string[] | undefined; // Deprecated
  base?: string;
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
    const req = handlable.req();
    const base = handlable.base || '';
    const { paths } = handlable;
    if (paths !== undefined) console.warn('Deprecation: IHttpRouteHandlable "paths" property deprecated');
    const { url } = req;

    if (!url) return false;

    const compatiblePath = this.findFirstCompatiblePath(handlable);

    if (!compatiblePath) return false;

    if (this.routes) {
      for (const route of this.routes) {
        const nestedBase = base + compatiblePath;
        const nestedHandlable = {
          ...handlable,
          base: nestedBase,
        };

        // eslint-disable-next-line no-await-in-loop
        if (await route.canHandle(nestedHandlable)) {
          return true;
        }
      }
    }

    if (this.endpoint) {
      return this.endpoint.canHandle(handlable);
    }

    return false;
  }

  public async handle(handlable: IHttpRouteHandlable) {
    const canHandle = await this.canHandle(handlable);
    if (!canHandle) return;

    const base = handlable.base || '';

    const compatiblePath = this.findFirstCompatiblePath(handlable);

    if (this.routes) {
      for (const route of this.routes) {
        const nestedBase = base + compatiblePath;
        const nestedHandlable = {
          ...handlable,
          base: nestedBase,
        };
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

  public findFirstCompatiblePath(handlable: IHttpRouteHandlable) {
    const { url } = handlable.req();

    if (!url) return null;

    const { base } = handlable;
    let compatiblePath: string | null = null;
    for (const path of this.paths) {
      try {
        RouteDataParser.parse(base + path, url);
        compatiblePath = path;
      } catch (err) {
        // NOP
      }
    }
    return compatiblePath;
  }
}
