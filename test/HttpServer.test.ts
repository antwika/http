import { HttpServer } from '../src/HttpServer';
import { IHttpHandlable, IHttpHandler } from '../src/IHttpHandler';

const jestListen = jest.fn((port, host, listeningListener) => { listeningListener(); });
jest.mock('http', () => ({
  createServer: jest.fn(() => ({ listen: jestListen })),
}));

describe('HttpServer', () => {
  let mockHttpHandler: jest.Mocked<IHttpHandler>;

  beforeAll(() => {
    mockHttpHandler = {
      canHandle: jest.fn(),
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('can be instantiated with default settings, handle a request and be stopped', async () => {
    const httpServer = new HttpServer({
      name: 'Hello',
      services: [],
      host: 'localhost',
      port: 3000,
      httpHandlers: [mockHttpHandler],
    });

    const req = { url: '/' } as any;
    const res = {} as any;

    await httpServer.start();
    expect(jestListen).toHaveBeenCalledWith(3000, 'localhost', expect.any(Function));
    mockHttpHandler.canHandle.mockImplementation(async (handlable: IHttpHandlable) => {
      handlable.req(); handlable.res(); return true;
    });
    mockHttpHandler.handle.mockImplementation(async (handlable: IHttpHandlable) => {
      handlable.req(); handlable.res();
    });
    await httpServer.requestListener(req, res);
    await httpServer.stop();
  });

  it('can be instantiated with another port based on injected "port" argument', async () => {
    const httpServer = new HttpServer({
      name: 'Hello',
      services: [],
      host: 'localhost',
      port: 3000,
      httpHandlers: [mockHttpHandler],
      appArguments: {
        args: [{
          shortName: 'p',
          longName: 'port',
          description: 'A port',
          value: '4000',
        }],
      },
    });
    expect(httpServer.getPort()).toBe(4000);
  });
});
