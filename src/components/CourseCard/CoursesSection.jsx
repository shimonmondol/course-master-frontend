import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getCourses } from "../../services/courses.api";
import CoursesFilters from "./CoursesFilters";
import CoursesGrid from "./CoursesGrid";
import CoursesPagination from "./CoursesPagination";

export default function CoursesSection() {
  const { user } = useSelector((state) => state.auth || {});
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const currentUser = user || storedUser;
  const [courses, setCourses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Query states
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        search: search ? search.trim() : undefined,
        sort: sort || undefined,
        category: category || undefined,
        tags: tags || undefined,
      };

      const res = await getCourses(params);

      const coursesList =
        res.data?.courses ||
        res.data?.data?.courses ||
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);

      const pages =
        res.data?.totalPages ||
        res.data?.data?.totalPages ||
        res.data?.pagination?.totalPages ||
        1;

      setCourses(coursesList);
      setTotalPages(pages);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sort, category, tags]);

  useEffect(() => {
    fetchCourses();
  }, [page, sort, category, tags, fetchCourses]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <CoursesFilters
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={handleFilterChange(setSort)}
        category={category}
        setCategory={handleFilterChange(setCategory)}
        tags={tags}
        setTags={handleFilterChange(setTags)}
        onSearchSubmit={onSearchSubmit}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert alert-error shadow-sm">
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <div className="rounded-xl border border-primary/20 bg-base-200 p-8 text-center">
          <h3 className="text-lg font-semibold text-primary">No courses found</h3>
          <p className="mt-1 text-base-content/70">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && courses.length > 0 && (
        <>
          <CoursesGrid courses={courses} />

          {currentUser?.role === "admin" && (
            <div className="flex justify-center pt-4">
              <Link to="/admin/courses" className="btn btn-primary btn-wide shadow-md">
                Manage Courses
              </Link>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <CoursesPagination
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      )}
    </div>
  );
}