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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ListPropertiesDto } from './dto/list-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreatePropertyUploadUrlDto } from './dto/create-property-upload-url.dto';
import { CompletePropertyUploadDto } from './dto/complete-property-upload.dto';

@Controller({
  path: 'properties',
  version: '1',
})
@ApiTags('Properties')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a property',
    description: 'Creates a draft property for the authenticated user.',
  })
  @ApiBody({
    type: CreatePropertyDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Property created successfully.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(
      user.id,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all properties',
    description:
      'Returns all properties that belong to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Properties retrieved successfully.',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPropertiesDto,
  ) {
    return this.propertiesService.findAll(
      user.id,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a property',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the property.',
    example: 'cmf2p3abc0000xyz123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Property retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found.',
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.findOne(
      id,
      user.id,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a property',
    description:
      'Updates a property owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the property.',
    example: 'cmf2p3abc0000xyz123456789',
  })
  @ApiBody({
    type: UpdatePropertyDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Property updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found.',
  })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(
      id,
      user.id,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a property',
    description:
      'Deletes a property owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the property.',
    example: 'cmf2p3abc0000xyz123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Property deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found.',
  })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.remove(
      id,
      user.id,
    );
  }

  @Post(':propertyId/images/upload-url')
  @ApiOperation({
    summary: 'Generate property image upload URL',
    description:
      'Generates a signed upload URL for uploading a property image.',
  })
  @ApiParam({
    name: 'propertyId',
    description: 'The unique identifier of the property.',
  })
  @ApiBody({
    type: CreatePropertyUploadUrlDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Upload URL generated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found.',
  })
  createUploadUrl(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePropertyUploadUrlDto,
  ) {
    return this.propertiesService.createUploadUrl(
      propertyId,
      user.id,
      dto,
    );
  }

  @Post(':propertyId/images/complete-upload')
  @ApiOperation({
    summary: 'Complete property image upload',
    description:
      'Registers an uploaded property image.',
  })
  @ApiParam({
    name: 'propertyId',
    description: 'The unique identifier of the property.',
  })
  @ApiBody({
    type: CompletePropertyUploadDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Property image uploaded successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found.',
  })
  completeUpload(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompletePropertyUploadDto,
  ) {
    return this.propertiesService.completeUpload(
      propertyId,
      user.id,
      dto,
    );
  }

  @Delete(':propertyId/images/:imageId')
  @ApiOperation({
    summary: 'Delete property image',
    description:
      'Deletes a property image.',
  })
  @ApiParam({
    name: 'propertyId',
    description: 'The unique identifier of the property.',
  })
  @ApiParam({
    name: 'imageId',
    description: 'The unique identifier of the property image.',
  })
  @ApiResponse({
    status: 200,
    description: 'Property image deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Property image not found.',
  })
  removeImage(
    @Param('propertyId') propertyId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.deleteImage(
      propertyId,
      imageId,
      user.id,
    );
  }
}