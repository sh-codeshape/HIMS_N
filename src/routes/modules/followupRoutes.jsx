import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { FollowUpList } from "../../pages/followup";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION } = ROLES;

export const followupRoutes = [
  <Route
    key="fu-list"
    path="/follow-up/list"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <FollowUpList />
      </ProtectedRoute>
    }
  />,
];
