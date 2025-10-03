import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '../../services/http';

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

export const createRequest = createAsyncThunk('requests/create', async (payload) => {
  const { data } = await http.post('/requests', payload);
  return data;
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
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMyRequests.pending, (s) => { s.status = 'loading'; })
     .addCase(fetchMyRequests.fulfilled, (s, a) => { s.status = 'succeeded'; s.list = a.payload; })
     .addCase(fetchMyRequests.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; })
     .addCase(createRequest.fulfilled, (s, a) => { s.list.unshift(a.payload); })
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
