import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { StorageModule } from '../../integrations/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [PropertiesController],
  providers: [PropertiesService]
})
export class PropertiesModule {}
