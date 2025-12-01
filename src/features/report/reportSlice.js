import http from '@/src/services/http';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchCommonAreaObjects = createAsyncThunk(
  'report/fetchCommonAreaObjects',
  async (commonAreaId, { rejectWithValue }) => {
    try {
      const res = await http.get(
        `/api/commonareaobjects?commonAreaId=${commonAreaId}`
      );
      const values = res?.data?.items?.$values || [];
      return values;
    } catch (err) {
      return rejectWithValue(err?.response?.data || 'Lỗi tải đối tượng khu vực chung');
    }
  }
);

export const fetchMyReports = createAsyncThunk(
  'report/fetchMyReports',
  async (params, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        size = 20,
        search = '',
        filter = '',
        sortBy = 'date_desc',
        fromDate = '',
        toDate = '',
        commonAreaObjectId,
      } = params || {};

      const query = new URLSearchParams();

      query.append('page', String(page));
      query.append('size', String(size));
      if (search) query.append('search', search);
      if (filter) query.append('filter', filter);
      if (sortBy) query.append('sortBy', sortBy);
      if (fromDate) query.append('Fromdate', fromDate);
      if (toDate) query.append('Todate', toDate);
      if (commonAreaObjectId) {
        query.append('CommonAreaObjectId', String(commonAreaObjectId));
      }

      const res = await http.get(`/api/reports/my-reports?${query.toString()}`);
      const payload = res?.data || {};
      const items = payload?.items?.$values || [];

      return {
        page: payload.page || page,
        size: payload.size || size,
        total: payload.total || items.length,
        totalPages: payload.totalPages || 1,
        items,
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data || 'Lỗi tải danh sách báo cáo');
    }
  }
);

export const createReport = createAsyncThunk(
  'report/createReport',
  async (payload, { rejectWithValue }) => {
    try {
      const { commonAreaObjectId, title, description, files } = payload;

      const formData = new FormData();
      formData.append('CommonAreaObjectId', String(commonAreaObjectId));
      formData.append('Title', title);
      if (description) {
        formData.append('Description', description);
      }

      (files || []).forEach((file) => {
        formData.append('Files', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        });
      });

      const res = await http.post(`/api/reports`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data || 'Lỗi tạo báo cáo');
    }
  }
);
export const fetchReportDetail = createAsyncThunk(
  'report/fetchReportDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await http.get(`/api/reports/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data || 'Lỗi tải chi tiết báo cáo');
    }
  }
);

export const updateReport = createAsyncThunk(
  'report/updateReport',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await http.put(`/api/reports/${id}`, data);
      return { id, data: res.data };
    } catch (err) {
      return rejectWithValue(err?.response?.data || 'Lỗi cập nhật báo cáo');
    }
  }
);

export const deleteReport = createAsyncThunk(
  'report/deleteReport',
  async (id, { rejectWithValue }) => {
    try {
      const res = await http.delete(`/api/reports/${id}`);
      return { id, data: res.data };
    } catch (err) {
      return rejectWithValue(err?.response?.data || 'Lỗi xoá báo cáo');
    }
  }
);
const reportSlice = createSlice({
  name: 'report',
  initialState: {
    commonAreaObjects: [],
    loadingObjects: false,
    objectsError: null,

    creating: false,
    createError: null,
    createdReport: null,

    selectedObject: null,

    // My reports
    myReports: [],
    myReportsPage: 1,
    myReportsSize: 20,
    myReportsTotal: 0,
    myReportsTotalPages: 1,
    loadingMyReports: false,
    myReportsError: null,

    myReportsSearch: '',
    myReportsStatus: 'All',
    myReportsSortBy: 'date_desc',
    myReportsFromDate: '',
    myReportsToDate: '',

    //  Detail
    reportDetail: null,
    loadingReportDetail: false,
    reportDetailError: null,
    updatingReport: false,
    updatingError: null,
    deletingReport: false,
    deletingError: null,
  },
  reducers: {
    setSelectedObject(state, action) {
      state.selectedObject = action.payload;
    },
    resetReportState(state) {
      state.commonAreaObjects = [];
      state.loadingObjects = false;
      state.objectsError = null;
      state.creating = false;
      state.createError = null;
      state.createdReport = null;
      state.selectedObject = null;
    },

    // My reports filters ...
    setMyReportsSearch(state, action) {
      state.myReportsSearch = action.payload;
    },
    setMyReportsStatus(state, action) {
      state.myReportsStatus = action.payload;
    },
    setMyReportsSortBy(state, action) {
      state.myReportsSortBy = action.payload;
    },
    setMyReportsFromDate(state, action) {
      state.myReportsFromDate = action.payload;
    },
    setMyReportsToDate(state, action) {
      state.myReportsToDate = action.payload;
    },
    setMyReportsPage(state, action) {
      state.myReportsPage = action.payload;
    },
    clearMyReportsFilters(state) {
      state.myReportsSearch = '';
      state.myReportsStatus = 'All';
      state.myReportsSortBy = 'date_desc';
      state.myReportsFromDate = '';
      state.myReportsToDate = '';
      state.myReportsPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommonAreaObjects.pending, (state) => {
        state.loadingObjects = true;
        state.objectsError = null;
      })
      .addCase(fetchCommonAreaObjects.fulfilled, (state, action) => {
        state.loadingObjects = false;
        state.commonAreaObjects = action.payload;
      })
      .addCase(fetchCommonAreaObjects.rejected, (state, action) => {
        state.loadingObjects = false;
        state.objectsError = action.payload || 'Lỗi tải đối tượng khu vực chung';
      });

    builder
      .addCase(createReport.pending, (state) => {
        state.creating = true;
        state.createError = null;
        state.createdReport = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.creating = false;
        state.createdReport = action.payload;
      })
      .addCase(createReport.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload || 'Lỗi tạo báo cáo';
      });

    //  MyReports
    builder
      .addCase(fetchMyReports.pending, (state) => {
        state.loadingMyReports = true;
        state.myReportsError = null;
      })
      .addCase(fetchMyReports.fulfilled, (state, action) => {
        state.loadingMyReports = false;
        state.myReports = action.payload.items || [];
        state.myReportsPage = action.payload.page;
        state.myReportsSize = action.payload.size;
        state.myReportsTotal = action.payload.total;
        state.myReportsTotalPages = action.payload.totalPages;
      })
      .addCase(fetchMyReports.rejected, (state, action) => {
        state.loadingMyReports = false;
        state.myReportsError = action.payload || 'Lỗi tải danh sách báo cáo';
      })
    builder
      .addCase(fetchReportDetail.pending, (state) => {
        state.loadingReportDetail = true;
        state.reportDetailError = null;
      })
      .addCase(fetchReportDetail.fulfilled, (state, action) => {
        state.loadingReportDetail = false;
        state.reportDetail = action.payload;
      })
      .addCase(fetchReportDetail.rejected, (state, action) => {
        state.loadingReportDetail = false;
        state.reportDetailError = action.payload || 'Lỗi tải chi tiết báo cáo';
      });

    //  Update
    builder
      .addCase(updateReport.pending, (state) => {
        state.updatingReport = true;
        state.updatingError = null;
      })
      .addCase(updateReport.fulfilled, (state) => {
        state.updatingReport = false;
        // gọi lại fetchReportDetail ở màn detail nên không cần chỉnh state ở đây
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.updatingReport = false;
        state.updatingError = action.payload || 'Lỗi cập nhật báo cáo';
      });

    //  Delete
    builder
      .addCase(deleteReport.pending, (state) => {
        state.deletingReport = true;
        state.deletingError = null;
      })
      .addCase(deleteReport.fulfilled, (state) => {
        state.deletingReport = false;
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.deletingReport = false;
        state.deletingError = action.payload || 'Lỗi xoá báo cáo';
      });
  },
});

export const {
  setSelectedObject,
  resetReportState,
  setMyReportsSearch,
  setMyReportsStatus,
  setMyReportsSortBy,
  setMyReportsFromDate,
  setMyReportsToDate,
  setMyReportsPage,
  clearMyReportsFilters,
} = reportSlice.actions;

export default reportSlice.reducer;