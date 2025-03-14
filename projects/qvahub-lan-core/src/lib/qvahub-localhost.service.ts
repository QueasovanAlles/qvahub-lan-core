import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QvahubLocalhostService {

    private IPv4 : string = '127.0.0.1';
	private port : number = 52330;

	setPortNumberFromLocation() {
        this.port = window.location.port ? parseInt(window.location.port) : 52330;
		if (this.port === 52400) this.port = 52330;  //this allows usage of ng cli in dev mode on port 52400
        if (this.port === 52401) this.port = 52330;  //this allows usage of ng cli in dev mode on port 52400
	}

	setIPv4FromLocation() {
		this.IPv4 = window.location.hostname;
		if (this.IPv4 === 'localhost' || '127.0.0.1') {
			// Get server IP via API call or use LAN IP
			this.IPv4 = '192.168.1.2';
		}
	}

	setFromLocation() {
		this.setPortNumberFromLocation();
		this.setIPv4FromLocation();
	}

	getIPv4() : string {
		return this.IPv4;
	}

	getPort() : number {
		return this.port;
	}

	async pingServer(): Promise<boolean> {
		const url = `http://${this.IPv4}:${this.port}/api/myip`;
		try {
			const response = await fetch(url);
			return response.ok;
		} catch {
			return false;
		}
	}

	toString() {
		return this.IPv4 + ':' + this.port;
	}

}
