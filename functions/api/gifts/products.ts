import { Env } from '../../lib/db';
import { getProducts } from '../../lib/floristone';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const products = await getProducts(context.env.FLORISTONE_API_KEY);
  return Response.json({ products });
};
