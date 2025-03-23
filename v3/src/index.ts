import {
  APIError,
  type CollectionConfig,
  type CollectionSlug,
  type Config,
  type Field,
  type SelectField,
} from 'payload'
import generateOrderRank from './hooks/generateOrderRank.js'

// Reusing the v2 PluginCollectionConfig interface
export interface PluginCollectionConfig {
  statuses: {
    label: Record<string, string> | string
    value: string
    dropValidation?: ({ data, user }: { data: any; user: any }) => {
      dropAble: boolean
      message?: string
    }
  }[]
  defaultStatus?: string
  hideNoStatusColumn?: boolean
  fieldAccess?: any // FieldBase["access"]
  fieldAdmin?: any // FieldBase["admin"]
  fieldHooks?: any // FieldBase["hooks"]
}

// Updated KanbanV3Config to include detailed collection config
export type KanbanV3Config = {
  collections: Partial<
    Record<
      CollectionSlug,
      {
        enabled: boolean
        config: PluginCollectionConfig // Include the full config here
      }
    >
  >
  disabled?: boolean
}

export const kanbanV3 =
  (pluginOptions: KanbanV3Config) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    if (pluginOptions.collections) {
      config.collections = config.collections.map((collection) => {
        const pluginConfig = pluginOptions.collections[collection.slug]
        if (!pluginConfig || !pluginConfig.enabled) {
          return collection
        }

        // Prepare statuses for the kanbanStatus field
        const statuses = pluginConfig.config.statuses.map((status) => ({
          label: status.label,
          value: status.value,
        }))

        // Add kanban-specific fields
        const updatedFields = [
          ...(collection.fields || []),
          {
            name: 'kanbanStatus',
            label: 'Kanban status',
            type: 'select' as const, // Use const assertion to specify literal type
            options: statuses,
            defaultValue: pluginConfig.config.defaultStatus,
            admin: {
              ...pluginConfig.config.fieldAdmin,
              position: 'sidebar',
            },
            access: pluginConfig.config.fieldAccess || {},
            hooks: {
              ...pluginConfig.config.fieldHooks,
              beforeValidate: [
                ...(pluginConfig.config.fieldHooks?.beforeChange || []),
                async ({ value, data, req }: { value: any; data: any; req: any }) => {
                  // Find the collection configuration for the current collection
                  const statusList = pluginConfig.config.statuses

                  if (!statusList) {
                    return // No configuration found, skip validation
                  }

                  // Find the status object that matches the new value
                  const newStatus = statusList.find((status) => status.value === value)

                  if (!newStatus) {
                    throw new Error(`Invalid status: ${value}`) // New status is not in the allowed list
                  }

                  // If the status has a dropValidation function, call it
                  if (newStatus.dropValidation) {
                    const validationResult = newStatus.dropValidation({ data, user: req.user })

                    if (validationResult) {
                      data.kanbanMeta = validationResult

                      if (!validationResult?.dropAble) {
                        throw new APIError('Access not granted', 401)
                      }
                    }
                  }
                }, // Add the custom hook here
              ],
            },
          } as SelectField,
          {
            name: 'kanbanOrderRank',
            type: 'text' as const,
            admin: {
              hidden: true,
            },
          },
        ] as Field[]

        // Update hooks
        const updatedHooks = {
          ...collection.hooks,
          beforeChange: [...(collection.hooks?.beforeChange || []), generateOrderRank],
        }

        // Update admin configuration
        const updatedAdmin = {
          ...collection.admin,
          pagination: {
            ...collection.admin?.pagination,
            defaultLimit: collection.admin?.pagination?.defaultLimit ?? 100,
          },
          components: {
            ...collection.admin?.components,
            views: {
              ...collection.admin?.components?.views,
              ...(pluginConfig.enabled
                ? {
                    list: {
                      Component: 'payload-kanban-board/client#WorkflowView',
                      props: { config: pluginConfig.config, pluginConfig: pluginConfig.config }, // Pass the config as a prop
                    },
                  }
                : {}),
            },
          },
          custom: {
            hideNoStatusColumn: pluginConfig.config.hideNoStatusColumn || false,
          },
        }

        return {
          ...collection,
          fields: updatedFields,
          hooks: updatedHooks,
          admin: updatedAdmin,
        } as CollectionConfig
      }) as CollectionConfig[]
    }

    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }
    }

    return config
  }
