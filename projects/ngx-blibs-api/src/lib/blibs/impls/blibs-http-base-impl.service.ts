import {
    HttpInterceptor,
    HttpClient,
    HttpHeaders,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpParams,
    HttpResponse,
    HttpErrorResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { FilesRequest } from '../../blibs_union/files-request.model';
import { BlibsAuthenticationService } from '../blibs-authentication.service';
import { BlibsErrorService } from '../blibs-error.service';
import { BlibsHttpBaseService } from '../blibs-http-base.service';
import { BlibsToastService } from '../blibs-toast.service';

@Injectable()
export class BlibsHttpBaseImplService implements HttpInterceptor, BlibsHttpBaseService {
    protected HEADER_REQ = 'Authorization';
    protected TOKEN_TYPE_REQ = 'Bearer ';
    protected APIEndpoint: string;
    protected numberRetry = 1;

    constructor(
        private http: HttpClient,
        private authenticationService: BlibsAuthenticationService,
        private blibsToastService: BlibsToastService,
        private blibsErrorService: BlibsErrorService
    ) { }


    protected get headers() {
        // return new HttpHeaders({ 'Content-Type': 'application/json' });
        /*
        let headers = new HttpHeaders({
            'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${this.authenticationService.getBlibsToken()}`,
        });
        */
        let headers = new HttpHeaders({
            'Content-Type': 'application/json; charset=UTF-8',
        });

        if (this.authenticationService.isAuthenticated()) {
            headers = headers.append('Authorization', `Bearer ${this.authenticationService.getBlibsToken()}`);
        }

        return headers;
    }

    /*
      intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      return fromPromise(this.handleAccess(request, next));
    }
    */

    /*
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      let authenticationRequest = request;
      if (this.clientService.getToken() != null) {
        authenticationRequest = request.clone(
          { headers: request.headers.set(this.TOKEN_HEADER, this.TOKEN_TYPE + this.clientService.getToken()) });
      }
      return next.handle(authenticationRequest);
    }
    */

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let authenticationRequest = request;
        if (this.authenticationService.isAuthenticated()) {
            authenticationRequest = request.clone(
                { headers: request.headers.set(this.HEADER_REQ, this.TOKEN_TYPE_REQ + this.authenticationService.getBlibsToken()) });
        }
        return next.handle(authenticationRequest);

        /*
        return next.handle(authenticationRequest).do((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse) {
                // do stuff with response if you want
            }
        }, (err: any) => {
            if (err instanceof HttpErrorResponse) {
                if (err.status === 401) {
                    this.blibsErrorService.collectFailedRequest(request);
                }
            }
        });
        */

        /*
        return next.handle(authenticationRequest).pipe(
            map((event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    // console.log('event--->', event);
                }
                return event;
            }),
            catchError((error: HttpErrorResponse) => {
                let data = {};
                data = {
                    reason: error && error.error && error.error.reason ? error.error.reason : '',
                    status: error.status
                };
                this.blibsToastService.update(`${JSON.stringify(data)}`);
                this.blibsToastService.show();
                this.blibsErrorService.collectFailedRequest(authenticationRequest);
                return throwError(error);
            }));
        */
    }

    // Firstly, run this function! To connect api endpoint!
    setUpEnvironment(env: string): void {
        this.APIEndpoint = env;
        if (this.APIEndpoint === null || this.APIEndpoint === undefined || this.APIEndpoint === '') {
            this.blibsToastService.update(`[ERROR] Can't connect to API endpoint server`);
            this.blibsToastService.show();
        }
    }

    get(relativeUrl: string): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.get(url, {
            headers: this.headers
        }).pipe(
            retry(this.numberRetry),
            catchError(this.handleError)
        );
    }

    getWithParams(relativeUrl: string, params: HttpParams): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.get(url, {
            headers: this.headers,
            params
        }).pipe(
            retry(this.numberRetry),
            catchError(this.handleError)
        );
    }

    post(relativeUrl: string, data: any): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.post(url, JSON.stringify(data), {
            headers: this.headers
        }).pipe(
            retry(this.numberRetry),
            catchError(this.handleError)
        );
    }

    put(relativeUrl: string, data: any): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.put(url, JSON.stringify(data), {
            headers: this.headers
        }).pipe(retry(this.numberRetry),
            catchError(this.handleError));
    }

    deleteById(relativeUrl: string, id: number): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.delete<any>(url + id, {
            headers: this.headers
        }).pipe(retry(this.numberRetry),
            catchError(this.handleError));
    }

    deleteByIds(relativeUrl: string, listId: number[]): Observable<any> {
        let url = this.APIEndpoint.concat(relativeUrl);
        if (!url.endsWith('?')) {
            url = url.concat('?');
        }
        return this.http.delete<any>(url + listId, {
            headers: this.headers
        }).pipe(retry(this.numberRetry),
            catchError(this.handleError));
    }

    deleteAll(relativeUrl: string): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.delete<any>(url, {
            headers: this.headers
        }).pipe(retry(this.numberRetry),
            catchError(this.handleError));
    }

    // method is: POST, PUT, DELETE
    createHttps(method: string, relativeUrl: string, data: any): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        const currentRequest = new HttpRequest(
            method,
            url,
            data, {
            headers: this.headers,
            reportProgress: true,
            responseType: 'json'
        }
        );
        return this.http.request(currentRequest)
            .pipe(retry(this.numberRetry),
                catchError(this.handleError));
    }

    createOtherHttps(method: string, relativeUrl: string, data: any): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.request(method, url, {
            body: data,
            headers: this.headers
        })
            .pipe(retry(this.numberRetry),
                catchError(this.handleError));
    }

    logWritter(data: any): void {
        window.alert(`${JSON.stringify(data)}`);
        console.log(`${JSON.stringify(data)}`);
        // return;
    }

    // downloade file includes: pdf, excel, json, images
    getBuffersType(relativeUrl: string, params: HttpParams): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.get(url, {
            headers: this.headers,
            responseType: 'arraybuffer' as 'json',
            params
        }).pipe(
            retry(this.numberRetry),
            catchError(this.handleError)
        );
    }

    // downloade file includes: csv
    getBuffersCsv(relativeUrl: string, params: HttpParams): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        let headers = new HttpHeaders();
        headers = headers.append('Accept', 'text/csv; charset=utf-8');
        return this.http.get(url, {
            headers: this.headers,
            responseType: 'text',
            params
        }).pipe(
            retry(this.numberRetry),
            catchError(this.handleError)
        );
    }

    protected handleError(error: any) {
        // tslint:disable-next-line: prefer-const
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
            errorMessage = error.error.message;
        } else {
            errorMessage = `:( Error server code : ${error.status} => Message: ${error.message}`;
        }
        // this.logWritter(errorMessage);
        return throwError(errorMessage);
    }

    private async handleAccess(request: HttpRequest<any>, next: HttpHandler):
        Promise<HttpEvent<any>> {
        const token = await this.authenticationService.getBlibsToken();
        let changedRequest = request;
        const headerSettings: { [name: string]: string | string[]; } = {};

        for (const key of request.headers.keys()) {
            headerSettings[key] = request.headers.getAll(key);
        }
        if (token) {
            headerSettings[`${this.HEADER_REQ}`] = `${this.TOKEN_TYPE_REQ}` + token;
        }
        headerSettings['Content-Type'] = 'application/json';
        const newHeader = new HttpHeaders(headerSettings);

        changedRequest = request.clone({
            headers: newHeader
        });
        return next.handle(changedRequest).toPromise();
    }

    // upload parts: files
    uploadParts(relativeUrl: string, httpMethod: string, files: File, filesRequest: FilesRequest): Observable<any> {
        const data: FormData = new FormData();
        data.append('files', files);
        data.append('filesRequest', JSON.stringify(filesRequest));
        const requests = new HttpRequest(httpMethod,
            `${this.APIEndpoint.concat(relativeUrl)}`,
            data, {
            reportProgress: true,
            responseType: 'json'
        });
        return this.http.request(requests);
    }


    // upload parts: files
    uploadOtherParts(relativeUrl: string, data: any): Observable<any> {
        const url = this.APIEndpoint.concat(relativeUrl);
        return this.http.post(url, JSON.stringify(data), {
            headers: this.headers
        }).pipe(
            retry(this.numberRetry),
            catchError(this.handleError)
        );
    }


    // upload parts: files
    uploadPartsWithHeader(relativeUrl: string, httpMethod: string, files: File, filesRequest: FilesRequest): Observable<any> {
        const data: FormData = new FormData();
        data.append('files', files);
        data.append('filesRequest', JSON.stringify(filesRequest));
        return this.http.request(httpMethod, `${this.APIEndpoint.concat(relativeUrl)}`, {
            body: data,
            headers: this.headers.append('Content-Type', 'multipart/form-data')
        });
    }
}
