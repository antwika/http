import assert from 'assert';
import { URLSearchParams } from 'url';

export type Params = Record<string, string>;
export type QueryParams = Record<string, string>;

export interface IRouteData {
  route: string,
  path: string,
  parts: string[],
  params: Params,
  queryParams: URLSearchParams,
}

export class RouteDataParser {
  public static parse(route: string, path: string): IRouteData {
    const routeUrl = new URL(`http://foo.bar${route}`);
    const keys = routeUrl.pathname.split('/');
    keys.shift();

    const pathUrl = new URL(`http://foo.bar${path}`);
    const values = pathUrl.pathname.split('/');
    values.shift();

    assert(keys.length <= values.length, 'number of route keys must be less or equal to number of path values');

    const params: Params = {};
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = values[i];
      if (key.startsWith(':')) {
        const paramName = key.slice(1);
        params[paramName] = values[i];
      } else {
        assert(key === value, 'route does not match the provided path');
      }
    }

    const parts = path.split('/');
    parts.shift();

    const queryParams = pathUrl.searchParams;

    return {
      route,
      path,
      parts,
      params,
      queryParams,
    };
  }
}
