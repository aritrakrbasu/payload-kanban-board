export const sortAndFilterDocumentsForStatus = (documents: any[] = [], status: string = '') => {
  return documents
    .filter((_doc) => _doc.kanbanStatus === status)
    .sort((a, b) => {
      const aOrderRank = a.kanbanOrderRank || '0'
      const bOrderRank = b.kanbanOrderRank || '0'

      return aOrderRank.localeCompare(bOrderRank)
    });
};

export const sortAndFilterDocumentsWithoutStatus = (documents: any[] = []) => {
  return documents
    .filter((_doc) => !_doc.kanbanStatus || _doc.kanbanStatus === 'null')
    .sort((a, b) => {
      const aOrderRank = a.kanbanOrderRank || '0'
      const bOrderRank = b.kanbanOrderRank || '0'

      return aOrderRank.localeCompare(bOrderRank)
    });
}