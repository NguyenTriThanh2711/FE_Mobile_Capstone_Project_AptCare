import { createSlice, createAsyncThunk, isRejectedWithValue } from '@reduxjs/toolkit';
import http from '@/src/services/http';

const initialState = {
  list: [],
  current: null,
  status: 'idle',
  error: null,
};

export const fetchMyRequests = createAsyncThunk('requests/fetchMy', async () => {
  const { data } = await http.get('/requests/my');
  return data; // []
});

export const createNormalRepairRequest = createAsyncThunk('requests/createNormalRepairRequest', 
  async (payload, { rejectWithValue }) => {
  try {
    const fd = new FormData();
    //requried
    fd.append('ApartmentId', String(payload.ApartmentId));
    fd.append('Object', payload.Object ?? '');
    fd.append('Description', payload.Description ?? '');
    //optional
    if(payload.ParentRequestId!= null) { fd.append('ParentRequestId', String(payload.ParentRequestId)); }
    if(payload.IssueId != null) { fd.append('IssueId', String(payload.IssueId)); }
    if(payload.PreferredAppointment != null) { fd.append('PreferredAppointment', payload.PreferredAppointment); }
    if(payload.Note != null) { fd.append('Note', payload.Note); }
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
    const { data, status } = await http.post("/api/repairrequests/normal", fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return { data, status };
  } catch (error) {
    console.log('create repair request nomal error', error)
    const res = error?.response;
    const message =
      res?.data?.detail || res?.data?.message || res?.data || error?.message || "Gửi yêu cầu thất bại";
    return rejectWithValue({ status: res?.status, message });
  }
});

export const updateRequest = createAsyncThunk('requests/update', async ({ id, patch }) => {
  const { data } = await http.patch(`/requests/${id}`, patch);
  return data;
});

export const cancelRequest = createAsyncThunk('requests/cancel', async (id) => {
  const { data } = await http.post(`/requests/${id}/cancel`);
  return { id, data };
});

export const getRequest = createAsyncThunk('requests/get', async (id) => {
  const { data } = await http.get(`/requests/${id}`);
  return data;
});

const slice = createSlice({
  name: 'requests',
  initialState: {
    list: [],
    creating: false,
    createError: null,
    lastCreateResult: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMyRequests.pending, (s) => { s.status = 'loading'; })
     .addCase(fetchMyRequests.fulfilled, (s, a) => { s.status = 'succeeded'; s.list = a.payload; })
     .addCase(fetchMyRequests.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; })
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
     .addCase(updateRequest.fulfilled, (s, a) => {
        s.list = s.list.map((r) => (r.id === a.payload.id ? a.payload : r));
     })
     .addCase(cancelRequest.fulfilled, (s, a) => {
        s.list = s.list.map((r) => (r.id === a.payload.id ? { ...r, status: 'cancelled' } : r));
     })
     .addCase(getRequest.fulfilled, (s, a) => { s.current = a.payload; });
  },
});

export default slice.reducer;

export const selectRequestCreating = (s) => s.requests.creating;
export const selectRequestCreateError = (s) => s.requests.createError;
export const selectRequestCreateResult = (s) => s.requests.lastCreateResult;