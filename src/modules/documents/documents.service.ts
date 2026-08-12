import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";
import { StorageService } from "../../integrations/storage/storage.service";
import { CreateDocumentUploadUrlDto } from "./dto/create-document-upload-url.dto";
import { CompleteDocumentUploadDto } from "./dto/complete-document-upload.dto";
import { ListDocumentsDto } from "./dto/list-documents.dto";
import { DocumentStatus, Prisma } from "@prisma/client";
import { UpdateDocumentDto } from "./dto/update-document.dto";

const documentInclude = {
  storageFile: true,
  uploadedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  },
} satisfies Prisma.DocumentInclude;


@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}


  async createUploadUrl(
    dto: CreateDocumentUploadUrlDto,
    userId: string,
  ) {
    const deal = await this.findDealOrThrow(dto.dealId);

    this.ensureDealAccess(deal, userId);

    const key = this.storage.generateObjectKey(
      `deals/${deal.id}/documents`,
      dto.originalName,
    );

    const upload = this.storage.createUploadUrl(
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
    dto: CompleteDocumentUploadDto,
    userId: string,
  ) {
    const deal = await this.findDealOrThrow(dto.dealId);

    this.ensureDealAccess(deal, userId);

    return this.prisma.$transaction(async (tx) => {
      const storageFile = await this.storage.completeUpload(
        {
          key: dto.key,
          originalName: dto.originalName,
          mimeType: dto.mimeType,
          size: dto.size,
        },
        userId,
        tx,
      );

      const document = tx.document.create({
        data: {
          dealId: deal.id,
          storageFileId: storageFile.id,
          title: dto.title,
          description: dto.description,
          type: dto.type,
          uploadedById: userId,
        },
        include: documentInclude,
      });

      return {
        success: true,
        message: 'Document uploaded successfully.',
        data: document,
      };
    });
  }

  async findAll(
    dealId: string,
    query: ListDocumentsDto,
    userId: string,
  ) {
    const deal = await this.findDealOrThrow(dealId);

    this.ensureDealAccess(deal, userId);

    const where: Prisma.DocumentWhereInput = {
      dealId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    const documents = await this.prisma.document.findMany({
      where,
      include: documentInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      message: 'Documents retrieved successfully',
      data: documents,
    };
  }

  async findOne(
    dealId: string,
    documentId: string,
    userId: string,
  ) {
    const deal = await this.findDealOrThrow(dealId);

    this.ensureDealAccess(deal, userId);

    const document = await this.findDocumentOrThrow(
      dealId,
      documentId,
    );

    return {
      success: true,
      message: 'Document retrieved successfully',
      data: document,
    };
  }

  async update(
    dealId: string,
    documentId: string,
    dto: UpdateDocumentDto,
    userId: string,
  ) {
    const deal = await this.findDealOrThrow(dealId);

    this.ensureDealAccess(deal, userId);

    const document = await this.findDocumentOrThrow(
      dealId,
      documentId,
    );

    const updatedDocument = await this.prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.type !== undefined && { type: dto.type }),
      },
      include: documentInclude,
    });

    return {
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument,
    };
  }

  async approve(
    dealId: string,
    documentId: string,
    userId: string,
  ) {
    const deal = await this.findDealOrThrow(dealId);

    this.ensureDealAccess(deal, userId);

    const document = await this.findDocumentOrThrow(
      dealId,
      documentId,
    );

    if (document.status === DocumentStatus.APPROVED) {
      return {
        success: true,
        message: 'Document is already approved.',
        data: document,
      };
    }

    const approvedDocument = await this.prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        status: DocumentStatus.APPROVED,
        approvedById: userId,
      },
      include: documentInclude,
    });

    return {
      success: true,
      message: 'Document approved successfully.',
      data: approvedDocument,
    };
  }

  async reject(
    dealId: string,
    documentId: string,
    userId: string,
  ) {
    const deal = await this.findDealOrThrow(dealId);

    this.ensureDealAccess(deal, userId);

    const document = await this.findDocumentOrThrow(
      dealId,
      documentId,
    );

    if (document.status === DocumentStatus.REJECTED) {
      return {
        success: true,
        message: 'Document is already rejected.',
        data: document,
      };
    }

    const rejectedDocument = await this.prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        status: DocumentStatus.REJECTED,
        approvedById: userId,
      },
      include: documentInclude,
    });

    return {
      success: true,
      message: 'Document rejected successfully.',
      data: rejectedDocument,
    };
  }

  async remove(
    dealId: string,
    documentId: string,
    userId: string,
  ) {
    const deal = await this.findDealOrThrow(dealId);

    this.ensureDealAccess(deal, userId);

    const document = await this.findDocumentOrThrow(
      dealId,
      documentId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.document.delete({
        where: {
          id: document.id,
        },
      });

      await this.storage.deleteStorageFile(
        document.storageFileId,
        tx,
      );
    });

    return {
      success: true,
      message: 'Document deleted successfully.',
    };
  }

  private async findDealOrThrow(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { participants: true },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found.');
    }

    return deal;
  }

  private async findDocumentOrThrow(
    dealId: string,
    documentId: string,
  ) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        dealId,
      },
      include: documentInclude,
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    return document;
  }

  private ensureDealAccess(
    deal: NonNullable<
      Awaited<ReturnType<DocumentsService['findDealOrThrow']>>
    >,
    userId: string,
  ) {
    const isParticipant =
      deal.creatorId === userId ||
      deal.participants.some(
        (participant) => participant.userId === userId,
      );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You do not have permission to access this deal.',
      );
    }
  }
}