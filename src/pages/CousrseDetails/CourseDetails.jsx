import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourseById,
  clearCurrentCourse,
} from "../../store/slices/coursesSlice";
import {
  enrollCourseAsync,
  clearSuccess,
  clearError,
  fetchMyEnrollments,
} from "../../store/slices/enrollmentSlice";
import { getMeAsync } from "../../store/slices/authSlice";

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentCourse, detailLoading, error: courseError } = useSelector(
    (state) => state.courses
  );
  const {
    enrolling,
    error: enrollError,
    success,
    enrollments: myEnrollments,
  } = useSelector((state) => state.enrollment);
  const { user: authUser, token: authToken, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const user = authUser || storedUser;
  const token = authToken || localStorage.getItem("token");
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  useEffect(() => {
    dispatch(fetchCourseById(id));
    return () => {
      dispatch(clearCurrentCourse());
      dispatch(clearSuccess()); 
      dispatch(clearError());  
    };
  }, [id, dispatch]);

  // Load user profile if token exists but user state is empty
  useEffect(() => {
    if (token && !authUser) {
      dispatch(getMeAsync());
    }
  }, [token, authUser, dispatch]);

  useEffect(() => {
    if (token) {
      dispatch(fetchMyEnrollments());
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (currentCourse?.batches && currentCourse.batches.length > 0) {
      setSelectedBatchId(currentCourse.batches[0]._id);
    }
  }, [currentCourse]);

  const isCreator = user && currentCourse && user._id === currentCourse.instructorId;
  const isAdmin = user && user.role === "admin";
  const cannotEnroll = isAdmin || isCreator;

  const alreadyEnrolled = !!(
    Array.isArray(myEnrollments) &&
    myEnrollments.find((e) => {
      const courseId = e.course?._id || e.course;
      return String(courseId) === String(id);
    })
  );

  const handleEnroll = async () => {
    if (!user && !token && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (cannotEnroll) return;

    const payload = {
      courseId: id,
      batchId: selectedBatchId || (currentCourse?.batches?.[0]?._id ?? null),
    };

    try {
      await dispatch(enrollCourseAsync(payload)).unwrap();
      navigate("/student");
    } catch (err) {
      console.error("Enrollment error:", err);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
        navigate("/student");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate, dispatch]);

  if (detailLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (courseError || !currentCourse) {
    return (
      <div className="alert alert-error">
        <span>{courseError || "Course not found"}</span>
      </div>
    );
  }

  const course = currentCourse;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body p-4 sm:p-6">
          <h1 className="page-heading wrap-break-words">{course.title}</h1>

          <div className="flex flex-wrap gap-2 mt-3">
            {course.tags?.map((tag, i) => (
              <span
                key={i}
                className="badge badge-outline"
                style={{
                  borderColor: "#78A083",
                  color: "#78A083",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-base-content/70">
            Instructor: <span className="font-semibold">{course.instructorName}</span>
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
            <p
              className="text-2xl sm:text-3xl font-bold"
              style={{
                background: "linear-gradient(135deg, #78A083, #50727B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ৳ {course.price}
            </p>

            <div className="flex flex-col items-start sm:items-end gap-2">
              {isAdmin ? (
                <Link
                  to={`/admin/courses/edit/${id}`}
                  className="btn btn-primary gap-2"
                >
                  📚 Manage Course
                </Link>
              ) : cannotEnroll ? (
                <div className="alert alert-info py-2 px-3 text-sm">
                  <span>Course creators cannot enroll in their own courses.</span>
                </div>
              ) : alreadyEnrolled ? (
                <button
                  onClick={() => navigate("/student")}
                  className="btn btn-outline btn-success gap-2"
                >
                  Go to Dashboard
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn btn-primary gap-2"
                >
                  {enrolling ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Enrolling...
                    </>
                  ) : (
                    "Enroll Now"
                  )}
                </button>
              )}

              {success && (
                <div className="alert alert-success py-1.5 px-3 text-xs">
                  <span>{success}</span>
                </div>
              )}
              {enrollError && (
                <div className="alert alert-error py-1.5 px-3 text-xs">
                  <span>{enrollError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-4 sm:p-6">
          <h2 className="page-heading-h2 mb-2 sm:mb-3">Course Description</h2>
          <p className="text-sm sm:text-base text-base-content/80 leading-relaxed">
            {course.description}
          </p>
        </div>
      </div>

      {/* Available Batches */}
      {course.batches && course.batches.length > 0 && (
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <h2 className="page-heading-h2 mb-4">Available Batches</h2>
            <div className="space-y-2">
              {course.batches.map((batch) => {
                const isSelected = selectedBatchId === batch._id;
                return (
                  <div
                    key={batch._id}
                    onClick={() => setSelectedBatchId(batch._id)}
                    className={`flex justify-between items-center p-3 rounded cursor-pointer transition ${
                      isSelected
                        ? "bg-primary text-primary-content border-2 border-primary"
                        : "bg-base-200 hover:bg-base-300 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedBatchId(batch._id)}
                        className="radio radio-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="font-semibold">{batch.name}</span>
                    </div>
                    <span className="text-sm opacity-80">
                      {batch.startDate
                        ? `Start: ${new Date(batch.startDate).toLocaleDateString()}`
                        : "No start date"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Course Syllabus */}
      {(alreadyEnrolled || isAdmin) && course.syllabus && course.syllabus.length > 0 ? (
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <h2 className="page-heading-h2">Course Syllabus</h2>
              {isAdmin && (
                <Link
                  to={`/admin/courses/edit/${id}`}
                  className="btn btn-sm btn-primary gap-2"
                >
                  ✏️ Edit Syllabus
                </Link>
              )}
            </div>

            <div className="space-y-3 mt-4">
              {course.syllabus.map((module, modIdx) => (
                <div
                  key={module._id || modIdx}
                  className="collapse collapse-arrow border border-base-300"
                >
                  <input type="checkbox" defaultChecked={modIdx === 0} />
                  <div className="collapse-title font-semibold bg-base-200 hover:bg-base-300">
                    📚 {module.title}
                  </div>
                  <div className="collapse-content">
                    <ul className="space-y-2 pt-4 pl-4">
                      {module.lessons?.map((lesson, lesIdx) => (
                        <li
                          key={lesson._id || lesIdx}
                          className="flex items-start gap-3 p-2 rounded hover:bg-base-200"
                        >
                          <span className="badge badge-outline">{lesIdx + 1}</span>
                          <div className="flex-1">
                            <p className="font-medium">{lesson.title}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {lesson.videoUrl && (
                                <a
                                  href={lesson.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary text-sm hover:underline"
                                >
                                  🎬 Watch Video
                                </a>
                              )}
                              {lesson.liveClassLink && (
                                <div className="flex items-center gap-1">
                                  <span className="badge badge-info badge-sm">
                                    🔴 Live Class
                                  </span>
                                  {lesson.liveClassDate && (
                                    <span className="text-xs text-base-content/70">
                                      {new Date(
                                        lesson.liveClassDate
                                      ).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        !alreadyEnrolled &&
        !isAdmin &&
        course.syllabus &&
        course.syllabus.length > 0 && (
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="page-heading-h2">Course Syllabus</h2>
              <div className="alert alert-info mt-4">
                <span>
                  📚 Enroll in this course to view the complete syllabus and access all lessons.
                </span>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}