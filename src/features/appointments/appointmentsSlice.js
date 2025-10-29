import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { transformAppointment } from "./transform";
import { apiGetAppointmentById } from "./api";


export const fetchAppointmentById = createAsyncThunk(
  "appointments/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const raw = await apiGetAppointmentById(id);
      const data = transformAppointment(raw);
      return { id, data };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Request failed";
      return rejectWithValue({ id, message: msg, status: err?.response?.status });
    }
  }
);

const initialState = {
  byId: {},         
  loadingById: {}, 
  errorById: {},    
};

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    clearAppointment(state, action) {
      const id = String(action.payload);
      delete state.byId[id];
      delete state.loadingById[id];
      delete state.errorById[id];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointmentById.pending, (state, action) => {
        const id = String(action.meta.arg);
        state.loadingById[id] = true;
        state.errorById[id] = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        const id = String(action.payload.id);
        state.byId[id] = action.payload.data;
        state.loadingById[id] = false;
        state.errorById[id] = null;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        const id = String(action.payload?.id || action.meta.arg);
        state.loadingById[id] = false;
        state.errorById[id] = action.payload?.message || "Failed to fetch appointment";
      });
  },
});

export const { clearAppointment } = appointmentsSlice.actions;

// selectors
export const selectAppointmentById = (state, id) => state.appointments.byId[String(id)] || null;
export const selectAppointmentLoading = (state, id) => !!state.appointments.loadingById[String(id)];
export const selectAppointmentError = (state, id) => state.appointments.errorById[String(id)] || null;

export default appointmentsSlice.reducer;
