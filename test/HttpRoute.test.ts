import { IHttpHandler } from '../src/IHttpHandler';
import { HttpRoute, IHttpRouteHandlable } from '../src/HttpRoute';

describe('HttpRoute', () => {
  let mockHttpHandler: jest.Mocked<IHttpHandler>;
  let handlable: jest.Mocked<IHttpRouteHandlable>;

  beforeAll(() => {
    mockHttpHandler = {
      canHandle: jest.fn(),
      handle: jest.fn(),
    };

    handlable = {
      req: jest.fn(),
      res: jest.fn(),
      paths: jest.fn(),
    }
  });

  afterEach(() => {
    jest.resetAllMocks();
  })

  it('rejects if there are no routes and no endpoint configured', async () => {
    const route = new HttpRoute({
      path: '/test',
    });
    handlable.req.mockReturnValue({ url: '/test' } as any);
    handlable.paths.mockReturnValue(['/', '/test']);

    expect(route.canHandle(handlable)).resolves.toBeFalsy();
  });

  it('rejects if there are no url in http request', async () => {
    const route = new HttpRoute({
      path: '/test',
      endpoint: mockHttpHandler,
    });
    handlable.req.mockReturnValue({ url: undefined } as any);
    handlable.paths.mockReturnValue(['/', '/test']);

    expect(route.canHandle(handlable)).resolves.toBeFalsy();
    expect(mockHttpHandler.canHandle).not.toHaveBeenCalled();
    expect(mockHttpHandler.handle).not.toHaveBeenCalled();

    await route.handle(handlable);
    expect(mockHttpHandler.canHandle).not.toHaveBeenCalled();
    expect(mockHttpHandler.handle).not.toHaveBeenCalled();
  });

  it('rejects http paths that does not match configured route/path', async () => {
    const route = new HttpRoute({
      path: '/test',
      routes: [],
      endpoint: mockHttpHandler,
    });

    mockHttpHandler.canHandle.mockResolvedValue(true);
    handlable.req.mockReturnValue({ url: '/other' } as any);
    handlable.paths.mockReturnValue(['/', '/other']);

    expect(route.canHandle(handlable)).resolves.toBeFalsy();
  });

  it('rejects if endpoint can not handle the request', async () => {
    const route = new HttpRoute({
      path: '/test',
      routes: [],
      endpoint: mockHttpHandler,
    });

    mockHttpHandler.canHandle.mockResolvedValue(false);
    handlable.req.mockReturnValue({ url: '/test' } as any);
    handlable.paths.mockReturnValue(['/', '/test']);

    expect(route.canHandle(handlable)).resolves.toBeFalsy();
  });

  it('populates "paths" none are provided', async () => {
    const route = new HttpRoute({
      path: '/test',
    });
    handlable.req.mockReturnValue({ url: '/test' } as any);
    handlable.paths.mockReturnValue([]);

    expect(route.canHandle(handlable)).resolves.toBeFalsy();
  });

  it('can calls canHandle on endpoint', async () => {
    const route = new HttpRoute({
      path: '/test',
      routes: [],
      endpoint: mockHttpHandler,
    });

    mockHttpHandler.canHandle.mockResolvedValue(true);
    handlable.req.mockReturnValue({ url: '/test' } as any);
    handlable.paths.mockReturnValue(['/', '/test']);

    expect(route.canHandle(handlable)).resolves.toBeTruthy();
  });

  it('can calls canHandle on nested route/endpoint', async () => {
    const nestedRoute = new HttpRoute({
      path: '/nested',
      routes: [],
      endpoint: mockHttpHandler,
    });

    const route = new HttpRoute({
      path: '/test',
      routes: [nestedRoute]
    });

    mockHttpHandler.canHandle.mockResolvedValue(true);
    handlable.req.mockReturnValue({ url: '/test/nested' } as any);
    handlable.paths.mockReturnValue(['/', '/test', '/nested']);

    expect(route.canHandle(handlable)).resolves.toBeTruthy();
    expect(mockHttpHandler.canHandle).toHaveBeenCalledTimes(1);
  });

  it('can calls handle request on nested route/endpoint', async () => {
    const nestedRoute = new HttpRoute({
      path: '/nested',
      routes: [],
      endpoint: mockHttpHandler,
    });

    const route = new HttpRoute({
      path: '/test',
      routes: [nestedRoute]
    });

    mockHttpHandler.canHandle.mockResolvedValue(true);
    handlable.req.mockReturnValue({ url: '/test/nested' } as any);
    handlable.paths.mockReturnValue(['/', '/test', '/nested']);

    await route.handle(handlable);

    expect(mockHttpHandler.canHandle).toHaveBeenCalledTimes(1);
    expect(mockHttpHandler.handle).toHaveBeenCalledTimes(1);
  });

  it('populates(if missing) paths from request url', async () => {
    const route = new HttpRoute({
      path: '/test'
    });

    const handlable = {
      req: jest.fn(),
      res: jest.fn(),
    }
    handlable.req.mockReturnValue({ url: '/test' } as any);

    expect(route.extractNestedHandlable(handlable as any)).toBeTruthy();
  })
});
