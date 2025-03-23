'use server'

export async function validateReadyForReviewDrop({ user, data }) {
  // Your validation logic here
  return { dropAble: false, message: 'error' }
}
