import { webpackBundler } from "@payloadcms/bundler-webpack";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { slateEditor } from "@payloadcms/richtext-slate";
import path from 'path';
import { buildConfig } from 'payload/config';
import Categories from './collections/Categories';
import Media from './collections/Media';
import Posts from './collections/Posts';
import Tags from './collections/Tags';
import Users from './collections/Users';

import { payloadKanbanBoard } from "../../src/index";

export default buildConfig({
  serverURL: 'http://localhost:4000',

  editor: slateEditor({}),
  db: mongooseAdapter({
    url: `${ process.env.MONGODB_URI }`,
  }),
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    webpack: (config) => {
      config.plugins = [
        ...config.plugins as [],
      ];
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          react: path.join(__dirname, '../node_modules/react'),
          'react-dom': path.join(__dirname, '../node_modules/react-dom'),
          'react-router': path.join(__dirname, '../node_modules/react-router'),
          'react-router-dom': path.join(__dirname, '../node_modules/react-router-dom'),
          'react-i18next': path.join(__dirname, '../node_modules/react-i18next'),
          payload: path.join(__dirname, '../node_modules/payload'),
        }
      };

      return config
    }
  },
  collections: [
    Categories,
    Posts,
    Tags,
    Users,
    Media,
  ],
  plugins: [
    payloadKanbanBoard({
      [Posts.slug]: {
        statuses: [
          {value: 'draft', label: 'Draft' , dropValidation:({
            data,
            user
          })=>{
            if("title" in data){
              return {
                dropAble: true,
                message:"Data Updated"
              }
            }
            return {
              dropAble: false,
              message:"You are not authorised for this action"
            }
          }},
          {value: 'in-progress', label: 'In Progress'},
          {value: 'ready-for-review', label: 'Ready for review'},
          {value: 'published', label: 'Published'},
        ],
        fieldAccess:{
          create:() => false,
          // update:() => false
        },
        fieldAdmin: {
          hidden:true
        },
        defaultStatus: 'draft',
        hideNoStatusColumn: false,
      } 
    })
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
});
