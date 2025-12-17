import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { pretty } from '@/src/helper/prettyLog';

export const createRepairReport = createAsyncThunk(
  'repairReports/create',
  async (formData, { rejectWithValue }) => {
    try {
      console.log('[req] --> ', formData)
      const { data } = await http.post('/api/repairreports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[res] <-- ', data)
      return data; // object report
    } catch (err) {
      const res = err?.response;
      console.log('ơ]ơ]', pretty(err?.response.data.detail))
      const message =
        res?.data?.detail ||
        err?.message ||
        'Tạo báo cáo sửa chữa thất bại';
      return rejectWithValue({ status: res?.status, message });
    }
  }
);

export const fetchRepairReportByAppointment = createAsyncThunk(
  'repairReports/fetchByAppointment',
  async ({ appointmentId }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await http.get(`/api/repairreports/by-appointment/${appointmentId}`);
      const rid = data?.repairReportId ?? data?.id;
      if (rid == null) return fulfillWithValue({ appointmentId, ids: [], entities: {} });
      return fulfillWithValue({
        appointmentId,
        ids: [rid],
        entities: { [rid]: data },
      });
    } catch (err) {
      const res = err?.response;
      if (res?.status === 404) {
        return fulfillWithValue({ appointmentId, ids: [], entities: {} });
      }
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        err?.message ||
        'Tải báo cáo sửa chữa thất bại';
      return rejectWithValue({ appointmentId, message, status: res?.status });
    }
  }
);


export const fetchRepairReportById = createAsyncThunk(
  'repairReports/fetchById',
  async (reportId, { rejectWithValue }) => {
    try {
      const { data } = await http.get(`/api/repairreports/${reportId}`);
      return data;
    } catch (err) {
      const res = err?.response;
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        err?.message ||
        'Tải chi tiết báo cáo thất bại';
      return rejectWithValue({ reportId, message, status: res?.status });
    }
  }
);
export const checkResidentApproveRepairReport = createAsyncThunk(
  'repairReports/checkResidentApprove',
  async ({ reportId }, { rejectWithValue }) => {
    try {
      const res = await http.get(`/api/reportapproves/resident/check/${reportId}`, {responseType: 'text'});
      const raw = typeof res?.data === 'string' ? res.data.trim() : res?.data;
      if (raw === true || raw === 'true') return { reportId, approved: true };
      if (raw === false || raw === 'false') return { reportId, approved: false };
      return { reportId, approved: Boolean(raw) };
    } catch (err) {
      const res = err?.response;
      if (res?.status === 404) {
        return { reportId, approved: false };
      }

      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        err?.message ||
        'Kiểm tra phê duyệt thất bại';

      return rejectWithValue({ reportId, message, status: res?.status });
    }
  }
);

const slice = createSlice({
  name: 'repairReports',
  initialState: {
    byId: {},                   
    byAppointmentId: {},      
    loadingByAppointmentId: {}, 
    loadingById: {},            
    error: null,

    creating: false,
    createError: null,

    checkingApproveByReportId: {},
    checkApproveErrorByReportId: {},
    approveResultByReportId: {},
  },
  reducers: {},
  extraReducers: (b) => {
    // CREATE
    b.addCase(createRepairReport.pending, (s) => {
      s.creating = true;
      s.createError = null;
    });
    b.addCase(createRepairReport.fulfilled, (s, a) => {
      s.creating = false;
      const r = a.payload;
      const rid = r?.repairReportId ?? r?.id;
      const apptId = r?.appointmentId;
      if (rid != null) s.byId[rid] = r;
      if (apptId != null) {
        const arr = s.byAppointmentId[apptId] || [];
        if (!arr.includes(rid)) s.byAppointmentId[apptId] = [rid, ...arr];
      }
    });
    b.addCase(createRepairReport.rejected, (s, a) => {
      s.creating = false;
      s.createError = a.payload || a.error;
    });


    b.addCase(fetchRepairReportByAppointment.pending, (s, a) => {
      const apptId = Number(a.meta?.arg?.appointmentId);
      if (Number.isFinite(apptId)) s.loadingByAppointmentId[apptId] = true;
    });
    b.addCase(fetchRepairReportByAppointment.fulfilled, (s, a) => {
      const { appointmentId, ids = [], entities = {} } = a.payload || {};
      const apptId = Number(appointmentId);
      if (!Number.isFinite(apptId)) return;
      s.loadingByAppointmentId[apptId] = false;

      Object.entries(entities).forEach(([rid, obj]) => {
        s.byId[rid] = obj;
      });

      s.byAppointmentId[apptId] = ids;
    });
    b.addCase(fetchRepairReportByAppointment.rejected, (s, a) => {
      const apptId = Number(a.payload?.appointmentId ?? a.meta?.arg?.appointmentId);
      if (Number.isFinite(apptId)) s.loadingByAppointmentId[apptId] = false;
      if ((a.payload?.status || 0) !== 404) {
        s.error = a.payload?.message || a.error?.message || null;
      }
    });

    // BY ID
    b.addCase(fetchRepairReportById.pending, (s, a) => {
      const id = Number(a.meta?.arg);
      if (Number.isFinite(id)) s.loadingById[id] = true;
    });
    b.addCase(fetchRepairReportById.fulfilled, (s, a) => {
      const r = a.payload;
      const rid = r?.repairReportId ?? r?.id;
      const apptId = r?.appointmentId;
      if (rid != null) s.byId[rid] = r;
      if (Number.isFinite(rid)) s.loadingById[rid] = false;
      if (Number.isFinite(apptId)) {
        const arr = s.byAppointmentId[apptId] || [];
        if (!arr.includes(rid)) s.byAppointmentId[apptId] = [rid, ...arr];
      }
    });
    b.addCase(fetchRepairReportById.rejected, (s, a) => {
      const id = Number(a.payload?.reportId ?? a.meta?.arg);
      if (Number.isFinite(id)) s.loadingById[id] = false;
      s.error = a.payload?.message || a.error?.message || null;
    });

    // CHECK RESIDENT APPROVE
    b.addCase(checkResidentApproveRepairReport.pending, (s, a) => {
      const reportId = Number(a.meta?.arg?.reportId);
      if (Number.isFinite(reportId)) {
        s.checkingApproveByReportId[reportId] = true;
        s.checkApproveErrorByReportId[reportId] = null;
      }
    });

    b.addCase(checkResidentApproveRepairReport.fulfilled, (s, a) => {
      const reportId = Number(a.payload?.reportId);
      if (Number.isFinite(reportId)) {
        s.checkingApproveByReportId[reportId] = false;
        s.checkApproveErrorByReportId[reportId] = null;
        s.approveResultByReportId[reportId] = !!a.payload?.approved;
      }
    });

    b.addCase(checkResidentApproveRepairReport.rejected, (s, a) => {
      const reportId = Number(a.payload?.reportId ?? a.meta?.arg?.reportId);
      if (Number.isFinite(reportId)) {
        s.checkingApproveByReportId[reportId] = false;
        s.checkApproveErrorByReportId[reportId] =
          a.payload?.message || a.error?.message || null;
      } else {
        s.error = a.payload?.message || a.error?.message || null;
      }
    });

  },
});

export default slice.reducer;


export const selectRepairReportIdsByAppointment = (s, appointmentId) =>
  s.repairReports?.byAppointmentId?.[Number(appointmentId)] || [];

export const selectRepairReportById = (s, id) =>
  s.repairReports?.byId?.[Number(id)] || null;

export const selectRepairReportLoadingByAppointment = (s, appointmentId) =>
  !!s.repairReports?.loadingByAppointmentId?.[Number(appointmentId)];
export const selectRepairReportByIdLoading = (s, id) =>
  !!s.repairReports?.loadingById?.[Number(id)];

export const selectRepairReportCreating = (s) => !!s.repairReports?.creating;
export const selectRepairReportCreateError = (s) => s.repairReports?.createError;

export const selectCheckingResidentApproveById = (s, reportId) =>
  !!s.repairReports?.checkingApproveByReportId?.[Number(reportId)];

export const selectResidentApproveResultById = (s, reportId) =>
  s.repairReports?.approveResultByReportId?.[Number(reportId)];

export const selectResidentApproveErrorById = (s, reportId) =>
  s.repairReports?.checkApproveErrorByReportId?.[Number(reportId)] || null;
