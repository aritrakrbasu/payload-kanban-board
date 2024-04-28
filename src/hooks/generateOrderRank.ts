import { LexoRank } from "lexorank";
import { CollectionBeforeChangeHook } from "payload/types";


/**
 * Generates the initial 'Lexorank'/orderRank based on the last known document in the same status.
 */
const generateOrderRank: CollectionBeforeChangeHook = async ({data, req}) => {
  const {payload, collection,} = req;

  if (!collection || !!data.kanbanOrderRank || !data.kanbanStatus) {
    return;
  }

  const collectionData = await payload.find({
    collection: collection.config.slug,
    where: {
      kanbanStatus: data.kanbanStatus
    },
    sort: '-kanbanOrderRank',
    limit: 1,
  });

  const lastOrderRank = collectionData.docs[0]?.kanbanOrderRank ?? null;

  const lastRank =
    lastOrderRank && typeof lastOrderRank === 'string'
      ? LexoRank.parse(lastOrderRank)
      : LexoRank.min()

  const nextRank = lastRank.genNext().genNext();
  data.kanbanOrderRank = nextRank.toString();

  return data;
}


export default generateOrderRank;
