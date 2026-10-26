import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { BedMatrixGrid } from "./components";

export default function BedAllotment() {
  return (
    <PageContainer
      title="IPD Bed Allotment & Ward Matrix"
     
    >
      <BedMatrixGrid />
    </PageContainer>
  );
}
