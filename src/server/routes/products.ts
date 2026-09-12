import { Router } from "express";
import { z } from "zod";
import { businessService, type BusinessService } from "../services/business";

const productSlugSchema = z.string().trim().max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export function createProductsRouter(service: BusinessService = businessService) {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const products = await service.listProducts();
      return res.status(200).json({ products });
    } catch (error) {
      console.error("Product catalogue query failed.", error);
      return res.status(500).json({ error: "Unable to load products." });
    }
  });

  router.get("/:slug", async (req, res) => {
    const slug = productSlugSchema.safeParse(req.params.slug);
    if (!slug.success) {
      return res.status(404).json({ error: "Product not found." });
    }

    try {
      const product = await service.getProductBySlug(slug.data);
      if (!product) {
        return res.status(404).json({ error: "Product not found." });
      }
      return res.status(200).json({ product });
    } catch (error) {
      console.error("Product query failed.", error);
      return res.status(500).json({ error: "Unable to load product." });
    }
  });

  return router;
}
