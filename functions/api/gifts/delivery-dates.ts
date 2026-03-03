import { Env } from '../../lib/db';
import { getDeliveryDates } from '../../lib/floristone';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const dates = await getDeliveryDates(context.env.FLORISTONE_API_KEY);
  return Response.json({ dates });
};
