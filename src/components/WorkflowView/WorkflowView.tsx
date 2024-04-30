import React, { useState } from "react";
import { Props as ListProps } from "payload/dist/admin/components/views/collections/List/types";
import Meta from "payload/dist/admin/components/utilities/Meta";
import { Gutter } from "payload/dist/admin/components/elements/Gutter";
import { useTranslation } from "react-i18next";
import { SelectField } from "payload/types";
import WorkflowViewHeader from "../WorkflowViewHeader/WorkflowViewHeader";
import Board from "../Board/Board";

import "./styles.scss";
import { getTranslation } from "payload/utilities";
import { requests } from "payload/dist/admin/api";
import { PluginCollectionConfig } from "../../index";
import {
  useAuth,
  useConfig,
  useDocumentInfo,
} from "payload/components/utilities";
import {
  SelectionProvider,
  useSelection,
} from "payload/dist/admin/components/views/collections/List/SelectionProvider";
import { ListControls } from "payload/dist/admin/components/elements/ListControls";
import DefaultList from "payload/dist/admin/components/views/collections/List/Default";
import { useLocation } from "react-router";
import { ToastContainer, toast, Slide } from "react-toastify";

const baseClass = "scrumboard";

const WorkflowView = (config: PluginCollectionConfig) => (props: ListProps) => {
  const {
    collection,
    collection: {
      slug: collectionSlug,
      fields: collectionFields,
      labels: { plural: pluralLabel },
      admin: {} = {},
    },
    handleWhereChange,
    hasCreatePermission,
    newDocumentURL,
    modifySearchParams,
    handleSortChange,
    resetParams,
    data,
    titleField,
    handleSearchChange,
  } = props;

  const { permissions } = useAuth();
  const location = useLocation();
  const isFromSamePage = location.pathname.includes(collectionSlug);
  const dragEnabled = permissions.collections[collectionSlug]?.fields
    ?.kanbanStatus?.update.permission as boolean;

  const hasReadAccess = permissions.collections[collectionSlug]?.fields
    ?.kanbanStatus?.read.permission as boolean;

  const { i18n } = useTranslation("general");
  const {
    routes: { api },
    serverURL,
  } = useConfig();

  const [showingWorkflow, setShowingWorkflow] = useState(true);
  const statusDefinition: SelectField = collectionFields.find(
    (field: any) => field?.name === "kanbanStatus"
  ) as SelectField;

  const handleDocumentkanbanStatusChange = (
    documentId: string,
    kanbanStatus: string,
    kanbanOrderRank: string
  ) => {
    requests.patch(`${serverURL}${api}/${collectionSlug}/${documentId}`, {
      body: JSON.stringify({
        kanbanStatus: kanbanStatus === "null" ? null : kanbanStatus,
        kanbanOrderRank: kanbanOrderRank,
      }),
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": i18n.language,
      },
    });
  };

  return (
    <>
      <Meta title={getTranslation(pluralLabel, i18n)} />
      <SelectionProvider docs={data.docs} totalDocs={data.totalDocs}>
        <Gutter className={`${baseClass}__wrap`}>
          {!hasReadAccess || !isFromSamePage ? (
            <DefaultList {...props} />
          ) : !showingWorkflow ? (
            <DefaultList
              customHeader={
                <WorkflowViewHeader
                  hasCreatePermission={hasCreatePermission}
                  newDocumentURL={newDocumentURL}
                  pluralLabel={pluralLabel}
                  isShowingWorkflow={showingWorkflow}
                  onWorkflowViewSwitch={() => setShowingWorkflow(true)}
                />
              }
              {...props}
            />
          ) : (
            <>
              <WorkflowViewHeader
                hasCreatePermission={hasCreatePermission}
                newDocumentURL={newDocumentURL}
                pluralLabel={pluralLabel}
                isShowingWorkflow={showingWorkflow}
                onWorkflowViewSwitch={() => setShowingWorkflow(false)}
              />

              <ListControls
                collection={collection}
                handleSearchChange={handleSearchChange}
                handleSortChange={handleSortChange}
                handleWhereChange={handleWhereChange}
                modifySearchQuery={modifySearchParams}
                resetParams={resetParams}
                titleField={titleField}
              />

              <Board
                collection={collection}
                documents={data.docs}
                hideNoStatusColumn={config.hideNoStatusColumn}
                statusDefinition={statusDefinition}
                onDocumentkanbanStatusChange={handleDocumentkanbanStatusChange}
                dragEnabled={dragEnabled}
                config={config}
              />
            </>
          )}
        </Gutter>
      </SelectionProvider>
      <ToastContainer
        icon={false}
        position="bottom-center"
        transition={Slide}
      />
    </>
  );
};

export default WorkflowView;
