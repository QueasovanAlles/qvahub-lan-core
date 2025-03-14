import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QvaLoggerService {

	private logging : boolean = false;

	log(message: string, object: any = {}, src: string = 'test') {
		const objString = JSON.stringify(object);
		if (this.logging === true) {
			if (src) {
				console.log(`%c${src}%c ${message} ${objString}`, 
					'color: #00AA00', 
					'color: inherit');
			} else {
				console.log(`${message} ${objString}`);
			}
		}
	}

	logError(message : string, object? : any) {
		let objString : string = '';
		if (object) objString = JSON.stringify(object);
		console.log(`${message} ${objString}`);
	}

    setLogging(logging:boolean) {
		this.logging = logging;
	}

}
