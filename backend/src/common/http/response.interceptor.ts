import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface ResponseDto<T> {
  payload: T;
}

@Injectable()
export class HttpResponseInterceptor<T> implements NestInterceptor<T> {
  /**
   * Intercept the request and wrap response in a payload
   * @param context {ExecutionContext}
   * @param next {CallHandler}
   * @returns { payload: Response<T> }
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((payload) => {
        return { payload };
      }),
    );
  }
}
