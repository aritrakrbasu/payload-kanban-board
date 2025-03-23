'use client'

import {
  Button,
  DefaultListView,
  Gutter,
  ListControls,
  ListHeader,
  RenderCustomComponent,
  SelectionProvider,
  TableColumnsProvider,
  useAuth,
  useConfig,
  useListQuery,
  useTranslation,
  useWindowInfo,
  ViewDescription,
} from '@payloadcms/ui'
import { usePathname } from 'next/navigation.js'
import { ClientCollectionConfig, SelectField } from 'payload'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { Board } from '../../exports/client.js'
import { KanbanV3Config } from '../../index.js'
import './styles.scss'

const baseClass = 'scrumboard'

interface CollectionPermissions {
  read?: boolean
  update?: boolean
}

interface Permissions {
  collections: {
    [key: string]: CollectionPermissions
  }
}

interface AuthData {
  user?: any
  permissions?: Permissions
}

interface CollectionConfig {
  fields: any[]
  labels: {
    plural: string
  }
  admin?: {
    description?: string
    custom?: {
      hideNoStatusColumn?: boolean
    }
  }
}

interface RoutesConfig {
  api?: string
}

interface ConfigData {
  routes?: RoutesConfig
  serverURL?: string
}

interface WorkflowViewProps {
  config: KanbanV3Config
  fieldConfig: any
  collectionSlug: string
  hideNoStatusColumn?: boolean
  hasCreatePermission?: boolean
  newDocumentURL: string
  listMenuItems?: any[]
  renderedFilters?: any
  resolvedFilterOptions?: any
  columnState?: any
  Description?: React.ReactNode
}

interface ListData {
  docs: any[]
  totalDocs: number
}

const WorkflowView: React.FC<WorkflowViewProps> = ({
  config,
  fieldConfig,
  collectionSlug,
  hasCreatePermission = false,
  newDocumentURL,
  listMenuItems,
  renderedFilters,
  resolvedFilterOptions,
  columnState,
  Description,
  ...props
}) => {
  const authData = useAuth() as AuthData | null
  const {
    data: listData,
    handleSearchChange,
    handleSortChange,
    handleWhereChange,
  } = useListQuery() as {
    data: ListData
    handleSearchChange: (search: string) => void
    handleSortChange: (sort: any) => void
    handleWhereChange: (where: any) => void
  }
  const { user } = useAuth() as { user: any }

  const docs = useMemo(() => {
    return listData.docs
  }, [listData.docs])

  const { permissions } = authData || {}
  const pathname = usePathname()
  const isFromSamePage = pathname.includes(collectionSlug)
  const dragEnabled = permissions?.collections[collectionSlug]?.update || false
  const hasReadAccess = permissions?.collections[collectionSlug]?.read || false

  const { i18n, t } = useTranslation()
  const fulldata = useConfig() as ConfigData | null
  const { getEntityConfig } = useConfig() as {
    getEntityConfig: (params: { collectionSlug: string }) => ClientCollectionConfig
  }
  const { routes, serverURL } = fulldata || {}
  const collection = getEntityConfig({ collectionSlug })
  const collectionConfig = getEntityConfig({ collectionSlug })

  const hideNoStatusColumn = collectionConfig.admin?.custom?.hideNoStatusColumn

  const {
    fields: collectionFields,
    labels: { plural: pluralLabel },
  } = collection || { fields: [], labels: { plural: '' } }

  const { api } = routes || {}

  const [showingWorkflow, setShowingWorkflow] = useState<boolean>(true)
  const statusDefinition = collectionFields.find(
    (field: any) => field?.name === 'kanbanStatus',
  ) as SelectField

  const handleDocumentKanbanStatusChange = async (
    documentId: string,
    kanbanStatus: string,
    kanbanOrderRank: string,
  ): Promise<number> => {
    const url = `/api/${collectionSlug}/${documentId}`

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        body: JSON.stringify({
          kanbanStatus: kanbanStatus === 'null' ? null : kanbanStatus,
          kanbanOrderRank,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language,
        },
      })

      // Return the status code from the response
      return response.status
    } catch (error) {
      console.error('Error updating kanban status:', error)
      // Return a non-200 status code to indicate failure
      return 500
    }
  }

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo() as unknown as { breakpoints: { s: boolean } }

  // Empty callback that could be implemented later
  const openBulkUpload = useCallback((): void => {}, [])

  const toggleView = (): void => setShowingWorkflow(!showingWorkflow)

  // View toggle button component
  const ViewToggleButton = (
    <Button buttonStyle="secondary" onClick={toggleView}>
      {showingWorkflow ? 'Switch to table view' : 'Switch to kanban view'}
    </Button>
  )

  // If no read access or not on the same page, return default view
  if (!hasReadAccess || !isFromSamePage)
    return (
      <DefaultListView
        collectionSlug={''}
        columnState={[]}
        hasCreatePermission={true}
        newDocumentURL={''}
        Table={undefined}
        {...props}
      />
    )

  // If showing table view
  if (!showingWorkflow) {
    return (
      <div className={`${baseClass}_wrapper`}>
        <DefaultListView
          collectionSlug={''}
          columnState={[]}
          hasCreatePermission={true}
          newDocumentURL={''}
          Table={undefined}
          Description={<div style={{ marginLeft: 'auto' }}>{ViewToggleButton}</div>}
          {...props}
        />
      </div>
    )
  }

  // If showing kanban view
  return (
    <Fragment>
      <TableColumnsProvider
        docs={docs}
        preferenceKey={`${collectionSlug}`}
        collectionSlug={collectionSlug}
        columnState={columnState}
        setTable={() => {}}
      >
        <div className={`collection-list collection-list--${collectionSlug}`}>
          <SelectionProvider docs={docs} totalDocs={listData.totalDocs} user={user}>
            <Gutter className="collection-list__wrap">
              {collectionConfig && (
                <ListHeader
                  collectionConfig={collectionConfig}
                  className={`${baseClass}_header`}
                  Description={
                    <div style={{ marginLeft: 'auto' }}>
                      <RenderCustomComponent
                        CustomComponent={ViewToggleButton}
                        Fallback={
                          <ViewDescription description={collectionConfig?.admin?.description} />
                        }
                      />
                    </div>
                  }
                  hasCreatePermission={hasCreatePermission}
                  i18n={i18n}
                  isBulkUploadEnabled={false}
                  newDocumentURL={newDocumentURL}
                  openBulkUpload={openBulkUpload}
                  smallBreak={smallBreak}
                  t={function (
                    key:
                      | 'authentication:account'
                      | 'authentication:accountOfCurrentUser'
                      | 'authentication:accountVerified'
                      | 'authentication:alreadyActivated'
                      | 'authentication:alreadyLoggedIn'
                      | 'authentication:apiKey'
                      | 'authentication:authenticated'
                      | 'authentication:backToLogin'
                      | 'authentication:beginCreateFirstUser'
                      | 'authentication:changePassword'
                      | 'authentication:checkYourEmailForPasswordReset'
                      | 'authentication:confirmGeneration'
                      | 'authentication:confirmPassword'
                      | 'authentication:createFirstUser'
                      | 'authentication:emailNotValid'
                      | 'authentication:emailOrUsername'
                      | 'authentication:emailSent'
                      | 'authentication:emailVerified'
                      | 'authentication:enableAPIKey'
                      | 'authentication:failedToUnlock'
                      | 'authentication:forceUnlock'
                      | 'authentication:forgotPassword'
                      | 'authentication:forgotPasswordEmailInstructions'
                      | 'authentication:forgotPasswordUsernameInstructions'
                      | 'authentication:usernameNotValid'
                      | 'authentication:forgotPasswordQuestion'
                      | 'authentication:generate'
                      | 'authentication:generateNewAPIKey'
                      | 'authentication:generatingNewAPIKeyWillInvalidate'
                      | 'authentication:logBackIn'
                      | 'authentication:loggedIn'
                      | 'authentication:loggedInChangePassword'
                      | 'authentication:loggedOutInactivity'
                      | 'authentication:loggedOutSuccessfully'
                      | 'authentication:loggingOut'
                      | 'authentication:login'
                      | 'authentication:logOut'
                      | 'authentication:logout'
                      | 'authentication:logoutSuccessful'
                      | 'authentication:logoutUser'
                      | 'authentication:newAPIKeyGenerated'
                      | 'authentication:newPassword'
                      | 'authentication:passed'
                      | 'authentication:passwordResetSuccessfully'
                      | 'authentication:resetPassword'
                      | 'authentication:stayLoggedIn'
                      | 'authentication:successfullyRegisteredFirstUser'
                      | 'authentication:successfullyUnlocked'
                      | 'authentication:tokenRefreshSuccessful'
                      | 'authentication:unableToVerify'
                      | 'authentication:username'
                      | 'authentication:verified'
                      | 'authentication:verifiedSuccessfully'
                      | 'authentication:verify'
                      | 'authentication:verifyUser'
                      | 'authentication:youAreInactive'
                      | 'error:autosaving'
                      | 'error:correctInvalidFields'
                      | 'error:deletingTitle'
                      | 'error:emailOrPasswordIncorrect'
                      | 'error:invalidFileType'
                      | 'error:invalidRequestArgs'
                      | 'error:loadingDocument'
                      | 'error:logoutFailed'
                      | 'error:noMatchedField'
                      | 'error:notAllowedToAccessPage'
                      | 'error:previewing'
                      | 'error:tokenNotProvided'
                      | 'error:unableToDeleteCount'
                      | 'error:unableToReindexCollection'
                      | 'error:unableToUpdateCount'
                      | 'error:unauthorized'
                      | 'error:unauthorizedAdmin'
                      | 'error:unknown'
                      | 'error:unPublishingDocument'
                      | 'error:unspecific'
                      | 'error:userEmailAlreadyRegistered'
                      | 'error:usernameAlreadyRegistered'
                      | 'error:usernameOrPasswordIncorrect'
                      | 'fields:block'
                      | 'fields:blocks'
                      | 'fields:addLabel'
                      | 'fields:addLink'
                      | 'fields:addNew'
                      | 'fields:addNewLabel'
                      | 'fields:addRelationship'
                      | 'fields:addUpload'
                      | 'fields:blockType'
                      | 'fields:chooseBetweenCustomTextOrDocument'
                      | 'fields:chooseDocumentToLink'
                      | 'fields:chooseFromExisting'
                      | 'fields:collapseAll'
                      | 'fields:customURL'
                      | 'fields:editLink'
                      | 'fields:editRelationship'
                      | 'fields:enterURL'
                      | 'fields:internalLink'
                      | 'fields:itemsAndMore'
                      | 'fields:labelRelationship'
                      | 'fields:latitude'
                      | 'fields:linkedTo'
                      | 'fields:linkType'
                      | 'fields:longitude'
                      | 'fields:openInNewTab'
                      | 'fields:passwordsDoNotMatch'
                      | 'fields:removeRelationship'
                      | 'fields:removeUpload'
                      | 'fields:saveChanges'
                      | 'fields:searchForBlock'
                      | 'fields:selectFieldsToEdit'
                      | 'fields:showAll'
                      | 'fields:swapRelationship'
                      | 'fields:swapUpload'
                      | 'fields:textToDisplay'
                      | 'fields:toggleBlock'
                      | 'fields:uploadNewLabel'
                      | 'general:of'
                      | 'general:language'
                      | 'general:error'
                      | 'general:username'
                      | 'general:notFound'
                      | 'general:unauthorized'
                      | 'general:aboutToDelete'
                      | 'general:addBelow'
                      | 'general:addFilter'
                      | 'general:adminTheme'
                      | 'general:all'
                      | 'general:allCollections'
                      | 'general:and'
                      | 'general:anotherUser'
                      | 'general:anotherUserTakenOver'
                      | 'general:applyChanges'
                      | 'general:ascending'
                      | 'general:automatic'
                      | 'general:backToDashboard'
                      | 'general:cancel'
                      | 'general:changesNotSaved'
                      | 'general:clearAll'
                      | 'general:close'
                      | 'general:collapse'
                      | 'general:collections'
                      | 'general:columns'
                      | 'general:columnToSort'
                      | 'general:confirm'
                      | 'general:confirmCopy'
                      | 'general:confirmDeletion'
                      | 'general:confirmDuplication'
                      | 'general:confirmReindex'
                      | 'general:confirmReindexAll'
                      | 'general:confirmReindexDescription'
                      | 'general:confirmReindexDescriptionAll'
                      | 'general:copied'
                      | 'general:copy'
                      | 'general:copying'
                      | 'general:copyWarning'
                      | 'general:create'
                      | 'general:created'
                      | 'general:createdAt'
                      | 'general:createNew'
                      | 'general:createNewLabel'
                      | 'general:creating'
                      | 'general:creatingNewLabel'
                      | 'general:currentlyEditing'
                      | 'general:custom'
                      | 'general:dark'
                      | 'general:dashboard'
                      | 'general:delete'
                      | 'general:deletedCountSuccessfully'
                      | 'general:deletedSuccessfully'
                      | 'general:deleting'
                      | 'general:depth'
                      | 'general:descending'
                      | 'general:deselectAllRows'
                      | 'general:document'
                      | 'general:documentLocked'
                      | 'general:documents'
                      | 'general:duplicate'
                      | 'general:duplicateWithoutSaving'
                      | 'general:edit'
                      | 'general:editedSince'
                      | 'general:editing'
                      | 'general:editingTakenOver'
                      | 'general:editLabel'
                      | 'general:email'
                      | 'general:emailAddress'
                      | 'general:enterAValue'
                      | 'general:errors'
                      | 'general:fallbackToDefaultLocale'
                      | 'general:false'
                      | 'general:filters'
                      | 'general:filterWhere'
                      | 'general:globals'
                      | 'general:goBack'
                      | 'general:isEditing'
                      | 'general:lastModified'
                      | 'general:leaveAnyway'
                      | 'general:leaveWithoutSaving'
                      | 'general:light'
                      | 'general:livePreview'
                      | 'general:loading'
                      | 'general:locale'
                      | 'general:menu'
                      | 'general:moveDown'
                      | 'general:moveUp'
                      | 'general:next'
                      | 'general:noDateSelected'
                      | 'general:noFiltersSet'
                      | 'general:noLabel'
                      | 'general:none'
                      | 'general:noOptions'
                      | 'general:noResults'
                      | 'general:nothingFound'
                      | 'general:noUpcomingEventsScheduled'
                      | 'general:noValue'
                      | 'general:only'
                      | 'general:open'
                      | 'general:or'
                      | 'general:order'
                      | 'general:overwriteExistingData'
                      | 'general:pageNotFound'
                      | 'general:password'
                      | 'general:payloadSettings'
                      | 'general:perPage'
                      | 'general:previous'
                      | 'general:reindex'
                      | 'general:reindexingAll'
                      | 'general:remove'
                      | 'general:reset'
                      | 'general:resetPreferences'
                      | 'general:resetPreferencesDescription'
                      | 'general:resettingPreferences'
                      | 'general:row'
                      | 'general:rows'
                      | 'general:save'
                      | 'general:saving'
                      | 'general:schedulePublishFor'
                      | 'general:searchBy'
                      | 'general:selectAll'
                      | 'general:selectAllRows'
                      | 'general:selectedCount'
                      | 'general:selectValue'
                      | 'general:showAllLabel'
                      | 'general:sorryNotFound'
                      | 'general:sort'
                      | 'general:sortByLabelDirection'
                      | 'general:stayOnThisPage'
                      | 'general:submissionSuccessful'
                      | 'general:submit'
                      | 'general:submitting'
                      | 'general:success'
                      | 'general:successfullyCreated'
                      | 'general:successfullyDuplicated'
                      | 'general:successfullyReindexed'
                      | 'general:takeOver'
                      | 'general:thisLanguage'
                      | 'general:time'
                      | 'general:titleDeleted'
                      | 'general:true'
                      | 'general:unsavedChanges'
                      | 'general:unsavedChangesDuplicate'
                      | 'general:untitled'
                      | 'general:upcomingEvents'
                      | 'general:updatedAt'
                      | 'general:updatedCountSuccessfully'
                      | 'general:updatedSuccessfully'
                      | 'general:updating'
                      | 'general:uploading'
                      | 'general:uploadingBulk'
                      | 'general:user'
                      | 'general:users'
                      | 'general:value'
                      | 'general:viewReadOnly'
                      | 'general:welcome'
                      | 'localization:cannotCopySameLocale'
                      | 'localization:copyFrom'
                      | 'localization:copyFromTo'
                      | 'localization:copyTo'
                      | 'localization:copyToLocale'
                      | 'localization:localeToPublish'
                      | 'localization:selectLocaleToCopy'
                      | 'operators:contains'
                      | 'operators:equals'
                      | 'operators:exists'
                      | 'operators:intersects'
                      | 'operators:near'
                      | 'operators:within'
                      | 'operators:isGreaterThan'
                      | 'operators:isGreaterThanOrEqualTo'
                      | 'operators:isIn'
                      | 'operators:isLessThan'
                      | 'operators:isLessThanOrEqualTo'
                      | 'operators:isLike'
                      | 'operators:isNotEqualTo'
                      | 'operators:isNotIn'
                      | 'upload:addFile'
                      | 'upload:addFiles'
                      | 'upload:bulkUpload'
                      | 'upload:crop'
                      | 'upload:cropToolDescription'
                      | 'upload:dragAndDrop'
                      | 'upload:editImage'
                      | 'upload:fileName'
                      | 'upload:fileSize'
                      | 'upload:filesToUpload'
                      | 'upload:fileToUpload'
                      | 'upload:focalPoint'
                      | 'upload:focalPointDescription'
                      | 'upload:height'
                      | 'upload:pasteURL'
                      | 'upload:previewSizes'
                      | 'upload:selectCollectionToBrowse'
                      | 'upload:selectFile'
                      | 'upload:setCropArea'
                      | 'upload:setFocalPoint'
                      | 'upload:sizes'
                      | 'upload:sizesFor'
                      | 'upload:width'
                      | 'validation:username'
                      | 'validation:emailAddress'
                      | 'validation:fieldHasNo'
                      | 'validation:greaterThanMax'
                      | 'validation:limitReached'
                      | 'validation:longerThanMin'
                      | 'validation:required'
                      | 'validation:requiresAtLeast'
                      | 'validation:shorterThanMax'
                      | 'version:version'
                      | 'version:type'
                      | 'version:aboutToPublishSelection'
                      | 'version:aboutToRestore'
                      | 'version:aboutToRestoreGlobal'
                      | 'version:aboutToRevertToPublished'
                      | 'version:aboutToUnpublish'
                      | 'version:aboutToUnpublishSelection'
                      | 'version:autosave'
                      | 'version:autosavedSuccessfully'
                      | 'version:autosavedVersion'
                      | 'version:changed'
                      | 'version:compareVersion'
                      | 'version:confirmPublish'
                      | 'version:confirmRevertToSaved'
                      | 'version:confirmUnpublish'
                      | 'version:confirmVersionRestoration'
                      | 'version:currentDraft'
                      | 'version:currentPublishedVersion'
                      | 'version:draft'
                      | 'version:draftSavedSuccessfully'
                      | 'version:lastSavedAgo'
                      | 'version:noFurtherVersionsFound'
                      | 'version:noRowsFound'
                      | 'version:noRowsSelected'
                      | 'version:preview'
                      | 'version:previouslyPublished'
                      | 'version:problemRestoringVersion'
                      | 'version:publish'
                      | 'version:publishChanges'
                      | 'version:published'
                      | 'version:publishIn'
                      | 'version:publishing'
                      | 'version:restoreAsDraft'
                      | 'version:restoredSuccessfully'
                      | 'version:restoreThisVersion'
                      | 'version:restoring'
                      | 'version:reverting'
                      | 'version:revertToPublished'
                      | 'version:saveDraft'
                      | 'version:scheduledSuccessfully'
                      | 'version:schedulePublish'
                      | 'version:selectLocales'
                      | 'version:selectVersionToCompare'
                      | 'version:showLocales'
                      | 'version:status'
                      | 'version:unpublish'
                      | 'version:unpublishing'
                      | 'version:versionCreatedOn'
                      | 'version:versionID'
                      | 'version:versions'
                      | 'version:viewingVersion'
                      | 'version:viewingVersionGlobal'
                      | 'version:viewingVersions'
                      | 'version:viewingVersionsGlobal'
                      | 'general:aboutToDeleteCount'
                      | 'general:editingLabel'
                      | 'fields:relationTo'
                      | 'fields:chooseLabel'
                      | 'fields:editLabelData'
                      | 'fields:newLabel'
                      | 'fields:relatedDocument'
                      | 'fields:selectExistingLabel'
                      | 'upload:dragAndDropHere'
                      | 'upload:lessInfo'
                      | 'upload:moreInfo'
                      | 'authentication:lockUntil'
                      | 'authentication:loginAttempts'
                      | 'authentication:loginUser'
                      | 'authentication:loginWithAnotherUser'
                      | 'authentication:newAccountCreated'
                      | 'authentication:resetPasswordExpiration'
                      | 'authentication:resetPasswordToken'
                      | 'authentication:resetYourPassword'
                      | 'authentication:verifyYourEmail'
                      | 'authentication:youAreReceivingResetPassword'
                      | 'authentication:youDidNotRequestPassword'
                      | 'error:accountAlreadyActivated'
                      | 'error:deletingFile'
                      | 'error:incorrectCollection'
                      | 'error:invalidFileTypeValue'
                      | 'error:missingEmail'
                      | 'error:missingIDOfDocument'
                      | 'error:missingIDOfVersion'
                      | 'error:missingRequiredData'
                      | 'error:noFilesUploaded'
                      | 'error:notAllowedToPerformAction'
                      | 'error:notFound'
                      | 'error:noUser'
                      | 'error:problemUploadingFile'
                      | 'error:tokenInvalidOrExpired'
                      | 'error:userLocked'
                      | 'error:valueMustBeUnique'
                      | 'error:verificationTokenInvalid'
                      | 'error:followingFieldsInvalid'
                      | 'error:localesNotSaved'
                      | 'general:filter'
                      | 'general:newPassword'
                      | 'general:locales'
                      | 'validation:enterNumber'
                      | 'validation:invalidInput'
                      | 'validation:invalidSelection'
                      | 'validation:invalidSelections'
                      | 'validation:lessThanMin'
                      | 'validation:notValidDate'
                      | 'validation:requiresNoMoreThan'
                      | 'validation:requiresTwoNumbers'
                      | 'validation:trueOrFalse'
                      | 'validation:validUploadID'
                      | 'version:currentDocumentStatus'
                      | 'version:showingVersionsFor'
                      | 'version:versionCount_none'
                      | 'version:versionCount',
                    options?: Record<string, any>,
                  ): string {
                    throw new Error('Function not implemented.')
                  }}
                />
              )}

              <ListControls
                collectionConfig={collectionConfig}
                collectionSlug={collectionSlug}
                renderedFilters={renderedFilters}
              />

              <Board
                collection={collection}
                documents={listData.docs}
                hideNoStatusColumn={hideNoStatusColumn}
                statusDefinition={statusDefinition}
                onDocumentkanbanStatusChange={handleDocumentKanbanStatusChange}
                dragEnabled={dragEnabled}
                collectionSlug={collectionSlug}
              />
            </Gutter>
          </SelectionProvider>
        </div>
      </TableColumnsProvider>
    </Fragment>
  )
}

export { WorkflowView }
