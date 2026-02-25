import { EventSchemas, Inngest } from "inngest";

type EntityEvents = {
  "entity/brand.created.v1": {
    data: {
      id: string;
      name: string;
      tagline?: string;
      logoUrl?: string;
      isActive?: boolean;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/brand.updated.v1": {
    data: {
      id: string;
      name?: string;
      tagline?: string;
      logoUrl?: string;
      isActive?: boolean;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/brand.deleted.v1": {
    data: {
      id: string;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/category.created.v1": {
    data: {
      id: string;
      name: string;
      slug: string;
      about?: string;
      isActive?: boolean;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/category.updated.v1": {
    data: {
      id: string;
      name?: string;
      slug?: string;
      about?: string;
      isActive?: boolean;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/category.deleted.v1": {
    data: {
      id: string;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/product.created.v1": {
    data: {
      id: string;
      name: string;
      description?: string;
      price: number;
      categoryId?: string | null;
      isActive?: boolean;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/product.updated.v1": {
    data: {
      id: string;
      name?: string;
      description?: string;
      price?: number;
      isActive?: boolean;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/product.deleted.v1": {
    data: {
      id: string;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "entity/order.created.v1": {
    data: {
      id: string;
      orderNumber: string;
      customerName: string;
      whatsappNumber: string;
      email?: string;
      total: number;
      status: string;
      clerkId?: string;
      idempotencyKey: string;
    };
  };
  "entity/order.status-changed.v1": {
    data: {
      id: string;
      orderNumber: string;
      previousStatus: string;
      newStatus: string;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "app/heartbeat.v1": {
    data: {
      idempotencyKey: string;
    };
  };
  "storage/file.upload.v1": {
    data: {
      bucket: string;
      filename: string;
      fileBuffer: string;
      contentType: string;
      actorId?: string;
      idempotencyKey: string;
    };
  };
  "storage/file.delete.v1": {
    data: {
      bucket: string;
      urls: string[];
      actorId?: string;
      idempotencyKey: string;
    };
  };
};

export const inngest = new Inngest({
  id: "entities-app",
  schemas: new EventSchemas().fromRecord<EntityEvents>(),
});
