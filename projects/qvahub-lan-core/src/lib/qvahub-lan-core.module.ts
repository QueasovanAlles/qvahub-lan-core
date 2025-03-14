import { NgModule } from '@angular/core';
import { QvaLoggerService } from './qva-logger.service';
import { QvahubLocalhostService } from './qvahub-localhost.service';

@NgModule({
  declarations: [],
  imports: [],
  exports: [],
  providers: [
    QvaLoggerService,
    QvahubLocalhostService
  ]
})
export class QvahubLanCoreModule { }
