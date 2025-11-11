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

export const fetchInspectionReportByAppointmentId = createAsyncThunk(
  'inspectionReport/fetchByAppointmentId',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const { data } = await http.get(
        `/api/inspectionreports/inspection-report/by-appointment-id/${appointmentId}`
      );
      return data; 
    } catch (error) {
      const msg = error?.response?.status === 404
        ? 'Chưa có báo cáo khảo sát cho cuộc hẹn này'
        : (error?.response?.data?.detail || 'Tải báo cáo khảo sát theo cuộc hẹn thất bại');
      return rejectWithValue({ message: msg, code: error?.response?.status });
    }
  }
);

export const generateInspectionReport = createAsyncThunk(
  'inspectionReport/generate',
  async (payload, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      // required fields
      fd.append('AppointmentId', String(payload.appointmentId));
      fd.append('FaultOwner', String(payload.faultOwner));
      fd.append('SolutionType', String(payload.solutionType));
      // optional fields
      if (payload.description != null) {
        fd.append('Description', payload.description);
      }
      if (payload.solution != null) {
        fd.append('Solution', payload.solution);
      }
      // files
      if (Array.isArray(payload.Files)) {
        payload.Files.forEach((file) => {
          fd.append('Files', {
            uri: file.uri,
            name: file.name || 'photo.jpg',
            type: file.type || 'image/jpeg',
          });
        });
      }
      console.log('[sdfsdfsdf]',)
      // const { data, status } = await http.post('/api/inspectionreports/inspection-report', fd, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });
      // return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.detail || 'Tạo báo cáo khảo sát thất bại'
      );
    }
  }
);

const slice = createSlice({
  name: 'inspectionReports',
  initialState: {
    byId: {},
    loadingById: {},
    byAppointmentId: {}, 
    loadingByAppointmentId: {},
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

      // nếu api có trả appointmentId thì gắn vào luôn cho đồng bộ
      const apptId = report?.appointmentId;
      if (apptId != null) {
        const arr = state.byAppointmentId[apptId] || [];
        if (!arr.includes(id)) {
          state.byAppointmentId[apptId] = [...arr, id];
        }
      }
    });
    b.addCase(fetchInspectionReportById.rejected, (state, action) => {
      const id = Number(action.meta.arg);
      state.loadingById[id] = false;
      state.error = action.payload || action.error?.message || null;
    });
    // byAppointmentId
    b.addCase(fetchInspectionReportByAppointmentId.pending, (state, action) => {
      const appointmentId = Number(action.meta.arg);
      state.loadingByAppointmentId[appointmentId] = true;
    });
    b.addCase(fetchInspectionReportByAppointmentId.fulfilled, (state, action) => {
      const inspectionReport = action.payload;
      const inspectionReportId = inspectionReport?.inspectionReportId ?? inspectionReport?.id;
      const appointmentId = inspectionReport?.appointmentId;
      if (inspectionReportId != null) state.byId[inspectionReportId] = inspectionReport;
      // gắn vào map appointmentId -> [inspectionReportId]
      if (appointmentId != null) {
        const arr = state.byAppointmentId[appointmentId] || [];
        if (!arr.includes(inspectionReportId)) {
          state.byAppointmentId[appointmentId] = [...arr, inspectionReportId];
        }
      }
      state.loadingByAppointmentId[appointmentId] = false;
    });
    b.addCase(fetchInspectionReportByAppointmentId.rejected, (state, action) => {
      const appointmentId = Number(action.meta.arg);
      state.loadingByAppointmentId[appointmentId] = false;
      if (action.payload?.code !== 404) {
        state.error = action.payload?.message || action.error?.message || null;
      } else {
        // 404 → chưa có báo cáo: set mảng rỗng cho lần sau render không bị undefined
        state.byAppointmentId[appointmentId] = [];
      }
    });

    // để gán vào list luôn khi vừa tạo mới
    b.addCase(generateInspectionReport.fulfilled, (state, action) => {
      const report = action.payload;
      const reportId = report?.inspectionReportId ?? report?.id;
      const appointmentId = report?.appointmentId;
      if (reportId != null) {
        state.byId[reportId] = report;
      }
      if (appointmentId != null) {
        const arr = state.byAppointmentId[appointmentId] || [];
        if (!arr.includes(reportId)) {
          state.byAppointmentId[appointmentId] = [...arr, reportId];
        }
      }
    });
  }
});

export default slice.reducer;   

// Selectors
export const selectReportById = (s, id) => s.inspectionReports?.byId?.[Number(id)] || null;
export const selectReportLoadingById = (s, id) =>
  !!s.inspectionReports?.loadingById?.[Number(id)];
export const selectReportError = (s) => s.inspectionReports?.error || null;


export const selectReportIdByAppointment = (s, appointmentId) =>
  s.inspectionReports?.byAppointmentId?.[Number(appointmentId)] ?? null;
export const selectReportByAppointment = (s, appointmentId) => {
  const rid = selectReportIdByAppointment(s, appointmentId);
  return rid ? s.inspectionReports?.byId?.[rid] || null : null;
};
export const selectReportLoadingByAppointment = (s, appointmentId) =>
  !!s.inspectionReports?.loadingByAppointment?.[Number(appointmentId)];
//byAppointmentId là mảng id, không phải object
export const selectReportIdsByAppointment = (s, appointmentId) =>
  s.inspectionReports?.byAppointmentId?.[Number(appointmentId)] || [];