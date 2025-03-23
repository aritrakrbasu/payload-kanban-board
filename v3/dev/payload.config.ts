import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { kanbanV3 } from 'payload-kanban-board'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import Posts from 'collections/Posts.js'
import { devUser } from './helpers/credentials.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

export default buildConfig({
  admin: {
    autoLogin: devUser,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Posts,
    {
      slug: 'media',
      fields: [],
      upload: {
        staticDir: path.resolve(dirname, 'media'),
      },
    },
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  editor: lexicalEditor(),
  email: testEmailAdapter,
  onInit: async (payload) => {
    await seed(payload)
  },
  plugins: [
    kanbanV3({
      collections: {
        posts: {
          enabled: true,
          config: {
            statuses: [
              {
                value: 'draft',
                label: 'Draft',
              },
              { value: 'in-progress', label: 'In Progress' },
              {
                value: 'ready-for-review',
                label: 'Ready for review',
                dropValidation: ({ user, data }) => {
                  return { dropAble: false, message: 'error' }
                },
              },
              { value: 'published', label: 'Published' },
            ],

            defaultStatus: 'todo',
            hideNoStatusColumn: true,
          },
        },
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
