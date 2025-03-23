'use client'

import { getTranslation } from '@payloadcms/translations'
import { Button } from '@payloadcms/ui'
import { useTranslation } from 'react-i18next'
import './styles.scss'

const baseClass = 'kanban-view-header'

interface WorkflowViewHeaderProps {
  pluralLabel: Record<string, string> | string
  newDocumentURL: string
  hasCreatePermission: boolean
  isShowingWorkflow: boolean
  onWorkflowViewSwitch: () => void
}

const WorkflowViewHeader = (props: WorkflowViewHeaderProps) => {
  const {
    pluralLabel,
    newDocumentURL,
    hasCreatePermission,
    isShowingWorkflow,
    onWorkflowViewSwitch,
  } = props
  const { t, i18n } = useTranslation('general')

  return (
    <header className={`${baseClass} ${isShowingWorkflow ? 'is-kanban-view' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <h1>{getTranslation(pluralLabel, i18n)}</h1>
        {hasCreatePermission && (
          <Button buttonStyle="pill" to={newDocumentURL}>
            {t('Create New')}
          </Button>
        )}
      </div>

      <Button buttonStyle="secondary" onClick={() => onWorkflowViewSwitch()}>
        {isShowingWorkflow && 'Switch to table view'}
        {!isShowingWorkflow && 'Switch to kanban view'}
      </Button>
    </header>
  )
}

export { WorkflowViewHeader }
