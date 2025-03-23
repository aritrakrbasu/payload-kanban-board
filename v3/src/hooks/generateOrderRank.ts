import { LexoRank } from 'lexorank'
import { type CollectionBeforeChangeHook, type PayloadRequest } from 'payload' // Import PayloadRequest

// Extend PayloadRequest to include collection
interface KanbanRequest extends PayloadRequest {
  collection: {
    slug: string
  }
}

/**
 * Generates the initial 'Lexorank'/orderRank based on the last known document in the same status.
 */
const generateOrderRank: CollectionBeforeChangeHook = async ({ data, req }) => {
  const { payload, collection } = req as KanbanRequest // Type assertion

  // Skip if no collection, or if kanbanOrderRank already exists, or no kanbanStatus
  if (!collection || data.kanbanOrderRank || !data.kanbanStatus) {
    return data
  }

  // Fetch the last document with the same kanbanStatus, sorted by kanbanOrderRank
  const collectionData = await payload.find({
    collection: collection.slug,
    where: {
      kanbanStatus: {
        equals: data.kanbanStatus,
      },
    },
    sort: '-kanbanOrderRank',
    limit: 1,
  })

  const lastOrderRank = collectionData.docs[0]?.kanbanOrderRank ?? null

  const lastRank =
    lastOrderRank && typeof lastOrderRank === 'string'
      ? LexoRank.parse(lastOrderRank)
      : LexoRank.min()

  const nextRank = lastRank.genNext().genNext()
  data.kanbanOrderRank = nextRank.toString()

  return data
}

export default generateOrderRank
