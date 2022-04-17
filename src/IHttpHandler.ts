import { IHandler, IHandlable } from '@antwika/common';
import { IncomingMessage, ServerResponse } from 'http';

export interface IHttpHandlable extends IHandlable {
  req(): IncomingMessage;
  res(): ServerResponse;
}

export interface IHttpHandler extends IHandler {
  canHandle(handlable: IHttpHandlable): Promise<boolean>;
  handle(handlable: IHttpHandlable): Promise<void>;
}
