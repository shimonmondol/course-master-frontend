import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  enrollInCourse,
  getMyEnrollments,
  completeLesson,
  deleteEnrollment,
} from "../../services/enrollment.api";

export const enrollCourseAsync = createAsyncThunk(
  "enrollment/enrollCourse",
  async ({ courseId, batchId }, { rejectWithValue }) => {
    try {
      const res = await enrollInCourse(courseId, batchId);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to enroll"
      );
    }
  }
);

export const fetchMyEnrollments = createAsyncThunk(
  "enrollment/fetchMyEnrollments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMyEnrollments();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load enrollments"
      );
    }
  }
);

export const completeLessonAsync = createAsyncThunk(
  "enrollment/completeLesson",
  async ({ enrollmentId, lessonId }, { rejectWithValue }) => {
    try {
      const res = await completeLesson(enrollmentId, lessonId);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to complete lesson"
      );
    }
  }
);

export const unenrollCourseAsync = createAsyncThunk(
  "enrollment/unenrollCourse",
  async (enrollmentId, { rejectWithValue }) => {
    try {
      await deleteEnrollment(enrollmentId);
      return enrollmentId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to remove course"
      );
    }
  }
);

const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState: {
    enrollments: [],
    loading: false,
    enrolling: false,
    error: null,
    success: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Enroll Course
      .addCase(enrollCourseAsync.pending, (state) => {
        state.enrolling = true;
        state.error = null;
      })
      .addCase(enrollCourseAsync.fulfilled, (state, action) => {
        state.enrolling = false;
        state.success = "Successfully enrolled!";
        if (action.payload) {
          state.enrollments.push(action.payload);
        }
      })
      .addCase(enrollCourseAsync.rejected, (state, action) => {
        state.enrolling = false;
        state.error = action.payload;
      })

      // Fetch My Enrollments
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.data || [];
      })
      .addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Complete Lesson
      .addCase(completeLessonAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(completeLessonAsync.fulfilled, (state, action) => {
        state.success = "Lesson marked complete!";
        const updated = action.payload;
        if (!updated) return;
        const idx = state.enrollments.findIndex((e) => e._id === updated._id);
        if (idx !== -1) {
          state.enrollments[idx] = updated;
        } else {
          state.enrollments.push(updated);
        }
      })
      .addCase(completeLessonAsync.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Unenroll / Remove Course
      .addCase(unenrollCourseAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(unenrollCourseAsync.fulfilled, (state, action) => {
        state.success = "Course removed successfully!";
        state.enrollments = state.enrollments.filter(
          (e) => e._id !== action.payload
        );
      })
      .addCase(unenrollCourseAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;