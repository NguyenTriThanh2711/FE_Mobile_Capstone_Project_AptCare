import { createSlice, createAsyncThunk, isRejectedWithValue } from '@reduxjs/toolkit';
import http from '@/src/services/http';
import { dotnetArr } from '@/src/helper/dotnetArr';
import { bool } from 'yup';

export const createNormalRepairRequest = createAsyncThunk(
  'requests/createNormalRepairRequest',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      const fd = new FormData();
      //requried
      fd.append('ApartmentId', String(payload.ApartmentId));
      fd.append('Object', payload.Object ?? '');
      fd.append('Description', payload.Description ?? '');
      //optional
      if (payload.ParentRequestId != null) {
        fd.append('ParentRequestId', String(payload.ParentRequestId));
      }
      if (payload.IssueId != null) {
        fd.append('IssueId', String(payload.IssueId));
      }
      if (payload.PreferredAppointment != null) {
        fd.append('PreferredAppointment', payload.PreferredAppointment);
      }
      if (payload.Note != null) {
        fd.append('Note', payload.Note);
      }
      //files
      if (Array.isArray(payload.Files)) {
        payload.Files.forEach((file) => {
          fd.append('Files', {
            uri: file.uri,
            name: file.name || 'photo.jpg',
            type: file.type || 'image/jpeg',
          });
        });
      }
      console.log('[req create]', fd)
      const { data, status } = await http.post('/api/repairrequests/normal', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const state = getState();
      const apartments = dotnetArr(state?.auth?.user?.apartments ?? []);
      const apartmentIds = apartments.map((a) => a.apartmentId).filter(Boolean);
      if (apartmentIds.length) {
        dispatch(fetchRecentAccrossApartments({ apartmentIds, perAptSize: 5, take: 3 }));
      }
      return { data, status };
    } catch (error) {
      console.log('create repair request nomal error', error);
      const res = error?.response;
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        error?.message ||
        'Gửi yêu cầu thất bại';
      return rejectWithValue({ status: res?.status, message });
    }
  }
);
export const createEmergencyRepairRequest = createAsyncThunk(
  'requests/createEmergencyRepairRequest',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      const fd = new FormData();
      //requried
      fd.append('ApartmentId', String(payload.ApartmentId));
      fd.append('Object', payload.Object ?? '');
      fd.append('Description', payload.Description ?? '');
      fd.append('IssueId', String(payload.IssueId));
      //files
      if (Array.isArray(payload.Files)) {
        payload.Files.forEach((file) => {
          fd.append('Files', {
            uri: file.uri,
            name: file.name || 'photo.jpg',
            type: file.type || 'image/jpeg',
          });
        });
      }
      const { data, status } = await http.post('/api/repairrequests/emergency', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const state = getState();
      const apartments = dotnetArr(state?.auth?.user?.apartments ?? []);
      const apartmentIds = apartments.map((a) => a.apartmentId).filter(Boolean);
      if (apartmentIds.length) {
        dispatch(fetchRecentAccrossApartments({ apartmentIds, perAptSize: 5, take: 3 }));
      }
      return { data, status };
    } catch (error) {
      console.log('create repair request emergency error', error);
      const res = error?.response;
      const message =
        res?.data?.detail ||
        res?.data?.message ||
        res?.data ||
        error?.message ||
        'Gửi yêu cầu thất bại';
      return rejectWithValue({ status: res?.status, message });
    }
  }
);
export const fetchRepairRequests = createAsyncThunk(
  'requests/fetchRepairRequests',
  async (params = {}) => {
    const { data } = await http.get('/api/repairrequests/paginate', { params });
    console.log('http.get("/api/repairrequests/paginate",', data);
    return data || []; // []
  }
);
// recent
export const fetchRecentAccrossApartments = createAsyncThunk(
  'requests/fetchRecentAccrossApartments',
  async ({ apartmentIds, perAptSize = 5, take = 3 }) => {
    if (!Array.isArray(apartmentIds) || apartmentIds.length === 0) return [];

    const calls = apartmentIds.map((apartmentId) =>
      http.get('/api/repairrequests/paginate', {
        params: { page: 1, size: perAptSize, apartmentId },
      })
    );
    const all = await Promise.all(calls);
    const perAptItems = all.map((res) => dotnetArr(res?.data?.items));
    // console.log('perAptItems', perAptItems);
    const merged = perAptItems.flat();
    merged.sort((a, b) => {
      const aTime = (dotnetArr(a?.requestTrackings)[0]?.updatedAt ?? a?.createdAt) || '';
      const bTime = (dotnetArr(b?.requestTrackings)[0]?.updatedAt ?? b?.createdAt) || '';
      return new Date(bTime) - new Date(aTime);
    });
    return merged.slice(0, take);
  }
);
export const cancelRequest = createAsyncThunk('requests/cancel', async (id) => {
  const { data } = await http.post(`/requests/${id}/cancel`);
  return { id, data };
});

export const getRequest = createAsyncThunk('requests/get', async (id) => {
  const { data } = await http.get(`/api/repairrequests/${id}`);
  return data;
});

const slice = createSlice({
  name: 'requests',
  initialState: {
    items: [],
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
    current: null,
    //create stảte
    creating: false,
    createError: null,
    lastCreateResult: null,

    //recent merged state
    recent: [],
    recentLoading: false,
    recentError: null,
  },
  reducers: {
    setCurrentRequest(state, action) {
      state.current = action.payload || null;
    },
    resetCurrentRequest(state) {
      state.current = null;
    },
  },
  extraReducers: (b) => {
    b
      //normal
      .addCase(createNormalRepairRequest.pending, (s) => {
        s.creating = true;
        s.createError = null;
        s.lastCreateResult = null;
      })
      .addCase(createNormalRepairRequest.fulfilled, (s, a) => {
        s.creating = false;
        s.lastCreateResult = a.payload; // giữ nguyên
      })
      .addCase(createNormalRepairRequest.rejected, (s, a) => {
        s.creating = false;
        s.createError = a.payload || a.error;
      })
      //emergency
      .addCase(createEmergencyRepairRequest.pending, (s) => {
        s.creating = true;
        s.createError = null;
        s.lastCreateResult = null;
      })
      .addCase(createEmergencyRepairRequest.fulfilled, (s, a) => {
        s.creating = false;
        s.lastCreateResult = a.payload; // giữ nguyên
      })
      .addCase(createEmergencyRepairRequest.rejected, (s, a) => {
        s.creating = false;
        s.createError = a.payload || a.error;
      })

      //fetch list paginate
      .addCase(fetchRepairRequests.pending, (s, a) => {
        s.loading = true;
        s.error = null;
        const reqPage = a.meta?.arg?.page || 1;
        if (reqPage === 1) {
          s.items = []; // reset nếu trang 1
        }
      })
      .addCase(fetchRepairRequests.fulfilled, (s, a) => {
        s.loading = false;
        const { items, page, size, total, totalPages } = a.payload || {};
        s.page = page ?? 1;
        s.size = size ?? 10;
        s.total = total ?? 0;
        s.totalPages = totalPages ?? 0;
        const arr = dotnetArr(items);
        if ((page ?? 1) > 1) {
          s.items = [...s.items, ...arr];
        } else {
          s.items = arr;
        }
      })
      .addCase(fetchRepairRequests.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || 'Tải danh sách thất bại';
      })
      //recent
      .addCase(fetchRecentAccrossApartments.pending, (s) => {
        s.recentLoading = true;
        s.recentError = null;
        s.recent = [];
      })
      .addCase(fetchRecentAccrossApartments.fulfilled, (s, a) => {
        s.recentLoading = false;
        s.recent = a.payload || [];
      })
      .addCase(fetchRecentAccrossApartments.rejected, (s, a) => {
        s.recentLoading = false;
        s.recentError = a.error?.message || 'Tải danh sách gần đây thất bại';
      })

      .addCase(cancelRequest.fulfilled, (s, a) => {
        // để sau sửa
        s.items = s.items.map((r) => (r.id === a.payload.id ? { ...r, status: 'cancelled' } : r));
      })
      .addCase(getRequest.fulfilled, (s, a) => {
        s.current = a.payload;
      });
  },
});

export default slice.reducer;
export const { setCurrentRequest, clearCurrentRequest } = slice.actions;

export const selectRequestCreating = (s) => s.requests.creating;
export const selectRequestCreateError = (s) => s.requests.createError;
export const selectRequestCreateResult = (s) => s.requests.lastCreateResult;
//slelectors for list
export const selectRequests = (s) => s.requests.items;
export const selectRequestsLoading = (s) => s.requests.loading;
export const selectRequestsError = (s) => s.requests.error;
export const selectRequestsPageData = (s) => ({
  page: s.requests.page,
  size: s.requests.size,
  total: s.requests.total,
  totalPages: s.requests.totalPages,
});
//Selector for detail
export const selectCurrentRequest = (s) => s.requests.current;
//selectors for recent
export const selectRecentRequests = (s) => s.requests.recent;
export const selectRecentRequestsLoading = (s) => s.requests.recentLoading;
export const selectRecentRequestsError = (s) => s.requests.recentError;
