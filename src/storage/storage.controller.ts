import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
  ) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Generate a pre-signed upload URL',
  })
  createUploadUrl(
    @Body() dto: CreateUploadUrlDto,
  ) {
    return this.storageService.createUploadUrl(dto);
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Confirm an uploaded file',
  })
  completeUpload(
    @Body() dto: CompleteUploadDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.storageService.completeUpload(
      dto,
      user.id,
    );
  }

  @Get(':fileId/download')
  @ApiOperation({
    summary: 'Generate a pre-signed download URL',
  })
  @ApiParam({
    name: 'fileId',
  })
  createDownloadUrl(
    @Param('fileId') fileId: string,
  ) {
    return this.storageService.createDownloadUrl(fileId);
  }

  @Delete(':fileId')
  @ApiOperation({
    summary: 'Delete a file',
  })
  @ApiParam({
    name: 'fileId',
  })
  deleteFile(
    @Param('fileId') fileId: string,
  ) {
    return this.storageService.deleteFile(fileId);
  }
}