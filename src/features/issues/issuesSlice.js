import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "@/src/services/http";
import { dotnetArr } from "@/src/helper/dotnetArr";

export const fetchIssues = createAsyncThunk(
  "issues/fetchIssues",
  async ({ page = 1, size = 100 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await http.get("/api/issues", { params: { page, size } });
      return data;
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Không lấy được danh sách sự cố";
      return rejectWithValue(msg);
    }
  }
);

const slice = createSlice({
  name: "issues",
  initialState: {
    raw: null,
    items: [],      // [{issueId, name, isEmergency, techniqueId, ...}]
    loading: false,
    error: null,
    pageInfo: { page: 1, size: 0, total: 0, totalPages: 0 },
  },
  reducers: {
    clearIssues(s) {
      s.raw = null; s.items = []; s.loading = false; s.error = null;
      s.pageInfo = { page: 1, size: 0, total: 0, totalPages: 0 };
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchIssues.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchIssues.fulfilled, (s, a) => {
      s.loading = false;
      s.raw = a.payload;
      const items = dotnetArr(a.payload?.items);
      s.items = items.map((x) => ({
        issueId: x?.issueId,
        name: x?.name,
        isEmergency: !!x?.isEmergency,
        techniqueId: x?.techniqueId,
        requiredTechnician: x?.requiredTechnician,
        estimatedDuration: x?.estimatedDuration,
        status: x?.status,
      }));
      s.pageInfo = {
        page: a.payload?.page ?? 1,
        size: a.payload?.size ?? items.length,
        total: a.payload?.total ?? items.length,
        totalPages: a.payload?.totalPages ?? 1,
      };
    });
    b.addCase(fetchIssues.rejected, (s, a) => {
      s.loading = false; s.error = a.payload || a.error?.message;
    });
  },
});

export const { clearIssues } = slice.actions;

export const selectIssuesLoading = (s) => s.issues.loading;
export const selectIssuesError   = (s) => s.issues.error;
export const selectIssues        = (s) => s.issues.items;      // mảng gọn gàng
export const selectIssuesRaw     = (s) => s.issues.raw;        // nếu muốn xem raw

export default slice.reducer;
