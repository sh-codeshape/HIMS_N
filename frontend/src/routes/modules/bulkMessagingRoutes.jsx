import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { BulkMessaging } from "../../pages/bulkMessaging";

const { SUPER_ADMIN, ADMIN, RECEPTION } = ROLES;

export const bulkMessagingRoutes = [
  <Route
    key="bm-send"
    path="/bulk-messaging"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <BulkMessaging />
      </ProtectedRoute>
    }
  />,
];
