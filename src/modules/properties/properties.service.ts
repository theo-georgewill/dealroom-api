import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { StorageService } from '../../integrations/storage/storage.service';
import { CreatePropertyUploadUrlDto } from './dto/create-property-upload-url.dto';
import { CompletePropertyUploadDto } from './dto/complete-property-upload.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private readonly propertyInclude =
    Prisma.validator<Prisma.PropertyInclude>()({
      images: {
        include: {
          storageFile: true,
        },
      },
    });

  private readonly propertyImageInclude =
    Prisma.validator<Prisma.PropertyImageInclude>()({
      storageFile: true,
    });
    
  async create(
    userId: string,
    dto: CreatePropertyDto,
  ) {
    const property =  await this.prisma.property.create({
      data: {
        ownerId: userId,
        ...dto,
      },
      include: this.propertyInclude,
    });

    return {
      success: true,
      message: 'Property created successfully.',
      data: property,
    };
  }

  async findOne(
    id: string,
    userId: string,
  ) {
    const property = await this.findPropertyOrThrow(
      id,
      userId,
    );

    return {
      success: true,
      message: 'Property retrieved successfully.',
      data: property,
    };
  }

  async findAll(
    userId: string,
    query: ListPropertiesDto,
  ) {
    const {
      page = 1,
      limit = 20,
      search,
    } = query;

    const where: Prisma.PropertyWhereInput = {
      ownerId: userId,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [properties, total] =
      await this.prisma.$transaction([
        this.prisma.property.findMany({
          where,
          include: this.propertyInclude,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            updatedAt: 'desc',
          },
        }),

        this.prisma.property.count({
          where,
        }),
      ]);

    return {
      success: true,
      message: 'Properties retrieved successfully.',
      data: properties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePropertyDto,
  ) {
    await this.findPropertyOrThrow(
      id,
      userId,
    );

    const property = await this.prisma.property.update({
      where: {
        id,
      },
      data: dto,
      include: this.propertyInclude,
    });

    return {
      success: true,
      message: 'Property updated successfully.',
      data: property,
    };
  }

  async remove(
    id: string,
    userId: string,
  ) {
    await this.findPropertyOrThrow(
      id,
      userId,
    );

    await this.prisma.property.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Property deleted successfully.',
    };
  }

  async createUploadUrl(
    propertyId: string,
    userId: string,
    dto: CreatePropertyUploadUrlDto,
  ) {
    await this.findPropertyOrThrow(
      propertyId,
      userId,
    );

    const key = this.storageService.generateObjectKey(
      `properties/${propertyId}/images`,
      dto.filename,
    );

    const upload =
      await this.storageService.createUploadUrl(
        key,
        dto.mimeType,
      );

    return {
      success: true,
      message: 'Upload URL generated successfully.',
      data: upload,
    };
  }

  async completeUpload(
    propertyId: string,
    userId: string,
    dto: CompletePropertyUploadDto,
  ) {
    await this.findPropertyOrThrow(
      propertyId,
      userId,
    );

    return this.prisma.$transaction(async (tx) => {
      const file =
        await this.storageService.completeUpload(
          dto,
          userId,
          tx,
        );

      const existing =
        await tx.propertyImage.findFirst({
          where: {
            propertyId,
            storageFileId: file.id,
          },
          include: this.propertyImageInclude,
        });

      if (existing) {
        if (dto.isCover && !existing.isCover) {
          await tx.propertyImage.updateMany({
            where: {
              propertyId,
              isCover: true,
            },
            data: {
              isCover: false,
            },
          });

          const updated =
            await tx.propertyImage.update({
              where: {
                id: existing.id,
              },
              data: {
                isCover: true,
              },
              include: this.propertyImageInclude,
            });

          return {
            success: true,
            message: 'Property image uploaded successfully.',
            data: updated,
          };
        }
        return {
          success: true,
          message: 'Property image uploaded successfully.',
          data: existing,
        };
      }

      if (dto.isCover) {
        await tx.propertyImage.updateMany({
          where: {
            propertyId,
            isCover: true,
          },
          data: {
            isCover: false,
          },
        });
      }

      const image =
        await tx.propertyImage.create({
          data: {
            propertyId,
            storageFileId: file.id,
            isCover: dto.isCover ?? false,
          },
          include: this.propertyImageInclude,
        });

      return {
        success: true,
        message: 'Property image uploaded successfully.',
        data: image,
      };
    });
  }

  async deleteImage(
    propertyId: string,
    imageId: string,
    userId: string,
  ) {
    await this.findPropertyOrThrow(
      propertyId,
      userId,
    );

    const image =
      await this.findPropertyImageOrThrow(
        propertyId,
        imageId,
      );

    await this.prisma.$transaction(async (tx) => {
      await this.storageService.deleteStorageFile(
        image.storageFileId,
        tx,
      );

      await tx.propertyImage.delete({
        where: {
          id: image.id,
        },
      });
    });

    return {
      success: true,
      message: 'Property image deleted successfully.',
    };
  }

  private async findPropertyOrThrow(
    id: string,
    userId: string,
  ) {
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: this.propertyInclude,
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    return property;
  }

  private async findPropertyImageOrThrow(
    propertyId: string,
    imageId: string,
  ) {
    const image =
      await this.prisma.propertyImage.findFirst({
        where: {
          id: imageId,
          propertyId,
        },
        include: this.propertyImageInclude,
      });

    if (!image) {
      throw new NotFoundException(
        'Property image not found.',
      );
    }

    return image;
  }
}