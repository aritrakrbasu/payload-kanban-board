'use client'

import { useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import { useRouter } from 'next/navigation.js'
import { ClientCollectionConfig } from 'payload'
import React, { forwardRef } from 'react'
import './styles.scss'

const baseClass = 'board-card'

interface BoardCardProps {
  collection: ClientCollectionConfig
  data: any
}

const BoardCard = forwardRef((props: BoardCardProps, ref: React.Ref<any>) => {
  const { collection, data, ...rest } = props

  const {
    config: {
      admin: { dateFormat },
    },
  } = useConfig()
  const { slug, admin } = collection
  const { i18n } = useTranslation()
  const router = useRouter()
  console.log('document data', data)

  if (data)
    return (
      <div className={baseClass} ref={ref} {...rest}>
        <div className={`${baseClass}__title`}>
          <div
            onClick={() => {
              router.push(`/admin/collections/${slug}/${data.id}`)
            }}
          >
            <span
              style={{
                cursor: 'pointer',
              }}
            >
              {admin?.useAsTitle && data[admin.useAsTitle]}
            </span>
            {!admin?.useAsTitle && data.id}
          </div>
        </div>
        <small>{formatDate({ date: data?.createdAt, i18n, pattern: dateFormat })}</small>
      </div>
    )
})

export default BoardCard
