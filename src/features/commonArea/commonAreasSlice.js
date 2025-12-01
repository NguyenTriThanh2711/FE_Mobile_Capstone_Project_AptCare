import http from '@/src/services/http';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchCommonAreas = createAsyncThunk(
  'commonAreas/fetchList',
  async (_, { rejectWithValue, getState }) => {
    try {
      const res = await http.get('/api/commonareas/list');
      const list = res?.data?.$values || [];
      return list;
    } catch (err) {
      return rejectWithValue(err?.response?.data || 'Lỗi tải khu vực chung');
    }
  }
);

function applyFilter(state) {
  const { items, search, statusFilter } = state;
  return (items || []).filter((item) => {
    const text = (search || '').toLowerCase();
    const matchSearch =
      !text ||
      item?.name?.toLowerCase().includes(text) ||
      item?.areaCode?.toLowerCase().includes(text) ||
      item?.location?.toLowerCase().includes(text);

    const st = (item?.status || '').toLowerCase();
    const matchStatus =
      statusFilter === 'All' ? true : st === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });
}

const commonAreasSlice = createSlice({
  name: 'commonAreas',
  initialState: {
    items: [],
    filteredItems: [],
    loading: false,
    error: null,
    search: '',
    statusFilter: 'Active',
    selectedCommonArea: null,
  },
  reducers: {
    setSearch(state, action) {
      state.search = action.payload;
      state.filteredItems = applyFilter(state);
    },
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
      state.filteredItems = applyFilter(state);
    },
    setSelectedCommonArea(state, action) {
      state.selectedCommonArea = action.payload;
    },
    clearCommonAreasState(state) {
      state.search = '';
      state.statusFilter = 'Active';
      state.selectedCommonArea = null;
      state.filteredItems = state.items;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommonAreas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommonAreas.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.filteredItems = applyFilter(state);
      })
      .addCase(fetchCommonAreas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Lỗi tải khu vực chung';
      });
  },
});

export const {
  setSearch,
  setStatusFilter,
  setSelectedCommonArea,
  clearCommonAreasState,
} = commonAreasSlice.actions;

export default commonAreasSlice.reducer;