import http from "@/src/services/http";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchInspectionReportById = createAsyncThunk(
  'inspectionReport/fetchById',
  async (reportId, { rejectWithValue }) => {
    try {
      const {data} = await http.get(
        `/api/inspectionreports/get-inspection-report-by-id/${reportId}`,
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.detail || 'Tải chi tiết báo cáo thất bại',
      );
    }
  }
);

const slice = createSlice({
  name: 'inspectionReports',
  initialState: {
    byId: {},
    loadingById: {},
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchInspectionReportById.pending, (state, action) => {
      const id = Number(action.meta.arg);
      state.loadingById[id] = true;
    });
    b.addCase(fetchInspectionReportById.fulfilled, (state, action) => {
      const report = action.payload;
      const id = report?.inspectionReportId ?? report?.id;
      if (id != null) state.byId[id] = report;
      state.loadingById[id] = false;
    });
    b.addCase(fetchInspectionReportById.rejected, (state, action) => {
      const id = Number(action.meta.arg);
      state.loadingById[id] = false;
      state.error = action.payload || action.error?.message || null;
    });
  }
});

export default slice.reducer;   

export const selectReportById = (s, id) => s.inspectionReports?.byId?.[Number(id)] || null;
export const selectReportLoadingById = (s, id) =>
  !!s.inspectionReports?.loadingById?.[Number(id)];
export const selectReportError = (s) => s.inspectionReports?.error || null;
