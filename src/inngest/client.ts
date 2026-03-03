import { EventSchemas, Inngest } from "inngest";

type EntityEvents = {
  "entity/brand.created.v1": {
    data: {
      id: string;
      name: string;
      tagline?: string;
      logoUrl?: string;
      heroImageUrl?: string;
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
      heroImageUrl?: string;
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
  "user/address.created.v1": {
    data: {
      id: string;
      clerkId: string;
      label: string;
      name: string;
      city: string;
      isDefault: boolean;
      idempotencyKey: string;
    };
  };
  "user/address.updated.v1": {
    data: {
      id: string;
      clerkId: string;
      changes: Record<string, unknown>;
      idempotencyKey: string;
    };
  };
  "user/address.deleted.v1": {
    data: {
      id: string;
      clerkId: string;
      idempotencyKey: string;
    };
  };
  "user/address.default-changed.v1": {
    data: {
      id: string;
      clerkId: string;
      previousDefaultId?: string;
      idempotencyKey: string;
    };
  };
  "user/preferences.updated.v1": {
    data: {
      clerkId: string;
      changes: {
        notifyPush?: boolean;
        notifyEmail?: boolean;
        notifySms?: boolean;
        notifyInApp?: boolean;
      };
      idempotencyKey: string;
    };
  };
};

export const inngest = new Inngest({
  id: "entities-app",
  schemas: new EventSchemas().fromRecord<EntityEvents>(),
});
