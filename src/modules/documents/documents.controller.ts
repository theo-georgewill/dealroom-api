import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { DocumentsService } from './documents.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

import { CreateDocumentUploadUrlDto } from './dto/create-document-upload-url.dto';
import { CompleteDocumentUploadDto } from './dto/complete-document-upload.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ListDocumentsDto } from './dto/list-documents.dto';

@ApiTags('Documents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'deals/:dealId/documents',
  version: '1',
})
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
  ) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Generate document upload URL',
    description:
      'Generates a signed upload URL for uploading a document to storage.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
    example: 'b3d1d17d-f3d7-45d8-9f3c-5b13b0d7eec3',
  })
  @ApiBody({ type: CreateDocumentUploadUrlDto })
  @ApiResponse({
    status: 201,
    description: 'Upload URL generated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found.',
  })
  createUploadUrl(
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentUploadUrlDto,
  ) {
    return this.documentsService.createUploadUrl(
      { ...dto, dealId },
      user.id,
    );
  }

  @Post('complete-upload')
  @ApiOperation({
    summary: 'Complete document upload',
    description:
      'Registers an uploaded document and associates it with the deal.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
    example: 'b3d1d17d-f3d7-45d8-9f3c-5b13b0d7eec3',
  })
  @ApiBody({ type: CompleteDocumentUploadDto })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found.',
  })
  completeUpload(
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteDocumentUploadDto,
  ) {
    return this.documentsService.completeUpload(
      { ...dto, dealId },
      user.id,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List documents',
    description: 'Returns all documents for a deal.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
    example: 'b3d1d17d-f3d7-45d8-9f3c-5b13b0d7eec3',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found.',
  })
  findAll(
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDocumentsDto,
  ) {
    return this.documentsService.findAll(
      dealId,
      query,
      user.id,
    );
  }

  @Get(':documentId')
  @ApiOperation({
    summary: 'Get document',
    description: 'Returns a single document.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
  })
  @ApiParam({
    name: 'documentId',
    description: 'The unique identifier of the document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  findOne(
    @Param('dealId') dealId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.findOne(
      dealId,
      documentId,
      user.id,
    );
  }

  @Patch(':documentId')
  @ApiOperation({
    summary: 'Update document',
    description: 'Updates document metadata.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
  })
  @ApiParam({
    name: 'documentId',
    description: 'The unique identifier of the document.',
  })
  @ApiBody({ type: UpdateDocumentDto })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  update(
    @Param('dealId') dealId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(
      dealId,
      documentId,
      dto,
      user.id,
    );
  }

  @Patch(':documentId/approve')
  @ApiOperation({
    summary: 'Approve document',
    description: 'Approves a document.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
  })
  @ApiParam({
    name: 'documentId',
    description: 'The unique identifier of the document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document approved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  approve(
    @Param('dealId') dealId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.approve(
      dealId,
      documentId,
      user.id,
    );
  }

  @Patch(':documentId/reject')
  @ApiOperation({
    summary: 'Reject document',
    description: 'Rejects a document.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
  })
  @ApiParam({
    name: 'documentId',
    description: 'The unique identifier of the document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document rejected successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  reject(
    @Param('dealId') dealId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.reject(
      dealId,
      documentId,
      user.id,
    );
  }

  @Delete(':documentId')
  @ApiOperation({
    summary: 'Delete document',
    description: 'Deletes a document.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
  })
  @ApiParam({
    name: 'documentId',
    description: 'The unique identifier of the document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  remove(
    @Param('dealId') dealId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.remove(
      dealId,
      documentId,
      user.id,
    );
  }
}