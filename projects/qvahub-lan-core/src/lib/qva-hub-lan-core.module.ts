import { NgModule } from '@angular/core';
import { QvaLoggerService } from './qva-logger.service';
import { QvaHubLocalhostService } from './qva-hub-localhost.service';
import { QvaHubLanHost } from './qva-hub-lan-host';

@NgModule({
  declarations: [],
  imports: [],
  exports: [],
  providers: [
    QvaLoggerService,
    QvaHubLocalhostService,
    QvaHubLanHost
  ]
})
export class QvaHubLanCoreModule { }
