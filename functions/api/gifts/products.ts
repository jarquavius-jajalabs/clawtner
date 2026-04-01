import { Env } from '../../lib/db';
import { getProducts } from '../../lib/floristone';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const products = await getProducts(context.env.FLORISTONE_API_KEY);
    return Response.json({ products });
  } catch {
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
};
