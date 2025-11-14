import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import http from '@/src/services/http';

export const fetchInvoicesByRepairRequestId = createAsyncThunk(
  'invoices/fetchByRepairRequestId',
  async (repairRequestId, { rejectWithValue }) => {
    try {
      const res = await http.get(`/api/invoices/${repairRequestId}`);
      const raw = res?.data;
      const list = Array.isArray(raw) ? raw : raw?.$values || [];
      return { repairRequestId, invoices: list };
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Lỗi tải danh sách hóa đơn';
      return rejectWithValue({ repairRequestId, message: msg });
    }
  }
);

export const createInternalInvoice = createAsyncThunk(
  'invoices/createInternal',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await http.post(`/api/invoices/internal`, payload);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Tạo hóa đơn nội bộ thất bại';
      return rejectWithValue(msg);
    }
  }
);

export const createExternalInvoice = createAsyncThunk(
  'invoices/createExternal',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await http.post(`/api/invoices/external`, payload);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Tạo hóa đơn bên thứ ba thất bại';
      return rejectWithValue(msg);
    }
  }
);

export const createInvoicePaymentLink = createAsyncThunk(
  'invoices/createPaymentLink',
  async (invoiceId, { rejectWithValue }) => {
    try {
      const res = await http.post(`/api/invoices/${invoiceId}/payment-link`);
      return { invoiceId, data: res.data };
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Tạo link thanh toán thất bại';
      return rejectWithValue({ invoiceId, message: msg });
    }
  }
);

const initialState = {
  byId: {},                   
  idsByRepairRequest: {}, 
  loadingByRepairRequest: {}, 
  errorByRepairRequest: {},

  creatingInternal: false,
  creatingInternalError: null,

  creatingExternal: false,
  creatingExternalError: null,

  paymentLinkByInvoiceId: {},
  paymentLinkLoading: {},      
  paymentLinkError: {}, 
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    clearInvoiceErrorByRepairRequest(state, action) {
      const rrId = action.payload;
      delete state.errorByRepairRequest[rrId];
    },
  },
  extraReducers: (builder) => {
    // --- fetchInvoicesByRepairRequestId ---
    builder
      .addCase(fetchInvoicesByRepairRequestId.pending, (state, action) => {
        const rrId = action.meta.arg;
        state.loadingByRepairRequest[rrId] = true;
        state.errorByRepairRequest[rrId] = null;
      })
      .addCase(fetchInvoicesByRepairRequestId.fulfilled, (state, action) => {
        const { repairRequestId, invoices } = action.payload;
        state.loadingByRepairRequest[repairRequestId] = false;
        state.errorByRepairRequest[repairRequestId] = null;

        const ids = [];
        invoices.forEach((inv) => {
          if (!inv || inv.invoiceId == null) return;
          state.byId[inv.invoiceId] = inv;
          ids.push(inv.invoiceId);
        });
        state.idsByRepairRequest[repairRequestId] = ids;
      })
      .addCase(fetchInvoicesByRepairRequestId.rejected, (state, action) => {
        const rrId = action.payload?.repairRequestId ?? action.meta.arg;
        state.loadingByRepairRequest[rrId] = false;
        state.errorByRepairRequest[rrId] = action.payload?.message || 'Lỗi tải hóa đơn';
      });

    // --- createInternalInvoice ---
    builder
      .addCase(createInternalInvoice.pending, (state) => {
        state.creatingInternal = true;
        state.creatingInternalError = null;
      })
      .addCase(createInternalInvoice.fulfilled, (state) => {
        state.creatingInternal = false;
        state.creatingInternalError = null;
      })
      .addCase(createInternalInvoice.rejected, (state, action) => {
        state.creatingInternal = false;
        state.creatingInternalError =
          action.payload || 'Tạo hóa đơn nội bộ thất bại';
      });

    // --- createExternalInvoice ---
    builder
      .addCase(createExternalInvoice.pending, (state) => {
        state.creatingExternal = true;
        state.creatingExternalError = null;
      })
      .addCase(createExternalInvoice.fulfilled, (state) => {
        state.creatingExternal = false;
        state.creatingExternalError = null;
      })
      .addCase(createExternalInvoice.rejected, (state, action) => {
        state.creatingExternal = false;
        state.creatingExternalError =
          action.payload || 'Tạo hóa đơn bên thứ ba thất bại';
      });

    // --- createInvoicePaymentLink ---
    builder
      .addCase(createInvoicePaymentLink.pending, (state, action) => {
        const invoiceId = action.meta.arg;
        state.paymentLinkLoading[invoiceId] = true;
        state.paymentLinkError[invoiceId] = null;
      })
      .addCase(createInvoicePaymentLink.fulfilled, (state, action) => {
        const { invoiceId, data } = action.payload;
        state.paymentLinkLoading[invoiceId] = false;
        state.paymentLinkError[invoiceId] = null;
        state.paymentLinkByInvoiceId[invoiceId] = data;
      })
      .addCase(createInvoicePaymentLink.rejected, (state, action) => {
        const invoiceId = action.payload?.invoiceId ?? action.meta.arg;
        state.paymentLinkLoading[invoiceId] = false;
        state.paymentLinkError[invoiceId] =
          action.payload?.message || 'Tạo link thanh toán thất bại';
      });
  },
});


export const selectInvoiceById = (state, invoiceId) =>
  state.invoices.byId[invoiceId] || null;

export const selectInvoiceIdsByRepairRequest = (state, repairRequestId) =>
  state.invoices.idsByRepairRequest[repairRequestId] || [];

export const selectInvoicesByRepairRequest = (state, repairRequestId) => {
  const ids =
    state.invoices.idsByRepairRequest[repairRequestId] || [];
  return ids.map((id) => state.invoices.byId[id]).filter(Boolean);
};

export const selectInvoicesLoadingByRepairRequest = (state, repairRequestId) =>
  !!state.invoices.loadingByRepairRequest[repairRequestId];

export const selectInvoicesErrorByRepairRequest = (state, repairRequestId) =>
  state.invoices.errorByRepairRequest[repairRequestId] || null;

export const selectCreatingInternalInvoice = (state) =>
  state.invoices.creatingInternal;

export const selectCreatingInternalInvoiceError = (state) =>
  state.invoices.creatingInternalError;

export const selectCreatingExternalInvoice = (state) =>
  state.invoices.creatingExternal;

export const selectCreatingExternalInvoiceError = (state) =>
  state.invoices.creatingExternalError;

export const selectPaymentLinkForInvoice = (state, invoiceId) =>
  state.invoices.paymentLinkByInvoiceId[invoiceId] || null;

export const selectPaymentLinkLoading = (state, invoiceId) =>
  !!state.invoices.paymentLinkLoading[invoiceId];

export const selectPaymentLinkError = (state, invoiceId) =>
  state.invoices.paymentLinkError[invoiceId] || null;


export const { clearInvoiceErrorByRepairRequest } = invoicesSlice.actions;

export default invoicesSlice.reducer;