import { EventSchemas, Inngest } from "inngest";

type EntityEvents = {
  "entity/brand.created": {
    data: {
      id: string;
      name: string;
      tagline?: string;
      logoUrl?: string;
      website?: string;
      userId: string;
    };
  };
  "entity/brand.updated": {
    data: {
      id: string;
      name?: string;
      tagline?: string;
      logoUrl?: string;
      website?: string;
      isActive?: boolean;
    };
  };
  "entity/brand.deleted": {
    data: {
      id: string;
    };
  };
  "entity/category.created": {
    data: {
      id: string;
      name: string;
      slug: string;
      description?: string;
      userId: string;
    };
  };
  "entity/category.updated": {
    data: {
      id: string;
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    };
  };
  "entity/category.deleted": {
    data: {
      id: string;
    };
  };
  "entity/product.created": {
    data: {
      id: string;
      name: string;
      description?: string;
      price: number;
      brandId: string;
      categoryId: string;
      userId: string;
    };
  };
  "entity/product.updated": {
    data: {
      id: string;
      name?: string;
      description?: string;
      price?: number;
      isActive?: boolean;
    };
  };
  "entity/product.deleted": {
    data: {
      id: string;
    };
  };
};

export const inngest = new Inngest({
  id: "entities-app",
  schemas: new EventSchemas().fromRecord<EntityEvents>(),
});
