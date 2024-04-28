import { Config, Plugin } from "payload/config";
import { CollectionConfig, FieldBase, OptionObject } from "payload/types";
import generateOrderRank from "./hooks/generateOrderRank";
import WorkflowView from "./components/WorkflowView/WorkflowView";

export interface PluginCollectionConfig {
  statuses: OptionObject[],
  defaultStatus?: string;
  hideNoStatusColumn?: boolean;
  fieldAccess : FieldBase["access"]
  fieldAdmin : FieldBase["admin"],
}

const extendCollectionConfig = (
  pluginConfig: Record<string, PluginCollectionConfig>,
  collections: CollectionConfig[]
): CollectionConfig[] => collections.map((collection: CollectionConfig) => {
  if (!(collection.slug in pluginConfig)) {
    return collection;
  }

  const collectionPluginConfig = pluginConfig[collection.slug];

  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeChange: [
        ...(collection.hooks?.beforeChange ?? []),
        generateOrderRank
      ],
    },
    fields: [
      ...collection.fields,
      {
        name: 'kanbanStatus',
        label: 'Workflow status',
        type: "select",
        options: collectionPluginConfig.statuses,
        defaultValue: collectionPluginConfig.defaultStatus,
        admin: {
          ...collectionPluginConfig.fieldAdmin,
          position: 'sidebar'
        },
        access:{
          ...collectionPluginConfig.fieldAccess
        }
      },
      {
        name: 'kanbanOrderRank',
        type: 'text',
        admin: {
          hidden: true
        }
      }
    ],
    admin: {
      ...collection.admin,
      pagination: {
        ...collection.admin?.pagination,
        defaultLimit: collection.admin?.pagination?.defaultLimit ?? 100
      },
      components: {
        ...collection?.admin?.components || {},
        views: {
          ...collection?.admin?.components?.views || {},
          List: WorkflowView(collectionPluginConfig)
        }
      }
    }
  }
});

export const payloadWorkflow = (pluginConfig: Record<string, PluginCollectionConfig>): Plugin =>
  (incomingConfig: Config): Config => {

    return {
      ...incomingConfig,
      collections: extendCollectionConfig(pluginConfig, incomingConfig.collections ?? [])
    };
  }