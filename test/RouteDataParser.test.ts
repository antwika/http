import { RouteDataParser } from '../src/RouteDataParser';

describe('RouteDataParser', () => {
  it('returns the provided "route" argument value', () => {
    expect(RouteDataParser.parse('/foo', '/foo').route).toBe('/foo');
  });

  it('returns the provided "path" argument value', () => {
    expect(RouteDataParser.parse('/foo', '/foo').path).toBe('/foo');
  });

  it('can chop up path into parts', () => {
    expect(RouteDataParser.parse('/foo/bar/baz', '/foo/bar/baz').parts).toStrictEqual(['foo', 'bar', 'baz']);
  });

  it('can parse a parameter', () => {
    expect(RouteDataParser.parse('/:foo', '/foo').params.foo).toBe('foo');
  });

  it('can parse multiple parameters', () => {
    expect(RouteDataParser.parse('/:foo/:bar', '/foo/bar').params).toStrictEqual({ foo: 'foo', bar: 'bar' });
  });

  it('can parse routes with a mixture of path and params', () => {
    expect(RouteDataParser.parse('/foo/:bar', '/foo/bar').params).toStrictEqual({ bar: 'bar' });
    expect(RouteDataParser.parse('/:foo/bar', '/foo/bar').params).toStrictEqual({ foo: 'foo' });
    expect(RouteDataParser.parse('/foo/:bar/baz', '/foo/bar/baz').params).toStrictEqual({ bar: 'bar' });
    expect(RouteDataParser.parse('/:foo/bar/:baz', '/foo/bar/baz').params).toStrictEqual({ foo: 'foo', baz: 'baz' });
  });

  it('can parse a query parameter', () => {
    expect(RouteDataParser.parse('/', '/?foo=bar').queryParams.get('foo')).toStrictEqual('bar');
  });

  it('can parse multiple query parameters', () => {
    const { queryParams } = RouteDataParser.parse('/', '/?foo=bar&hello=world');
    expect(queryParams.get('foo')).toStrictEqual('bar');
    expect(queryParams.get('hello')).toStrictEqual('world');
  });

  it('throws when trying to parse route with an incompatible path', () => {
    expect(() => RouteDataParser.parse('/foo/bar', '/foo/baz')).toThrow('route does not match the provided path');
  });
});
