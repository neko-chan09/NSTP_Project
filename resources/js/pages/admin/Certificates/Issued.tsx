// src/pages/admin/Certificates/Issued.tsx
import React, { useState, useMemo } from "react";
import { useCertificates } from "../../hooks/useCertificates";
import RefreshButton from "../../components/common/RefreshButton";

const IssuedCertificates: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const {
    data: certificates = [],
    isLoading,
    error,
    refresh,
    isRefreshing,
  } = useCertificates();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterComponent, setFilterComponent] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterSection, setFilterSection] = useState("");

  // Get unique values for filters
  const certificateTypes = useMemo(() => {
    const types = new Set(certificates.map((c) => c.certificate_type));
    return Array.from(types);
  }, [certificates]);

  const statuses = useMemo(() => {
    const statuses = new Set(certificates.map((c) => c.status));
    return Array.from(statuses);
  }, [certificates]);

  const components = useMemo(() => {
  const comps = new Set<string>();
  certificates.forEach((c) => {
    const comp = c.student?.nstp_component_selected;
    if (comp) comps.add(comp);
  });
  return Array.from(comps);
}, [certificates]);

  const courses = useMemo(() => {
    const courses = new Set(
      certificates.map((c) => c.student?.course).filter(Boolean),
    );
    return Array.from(courses);
  }, [certificates]);

  const sections = useMemo(() => {
    const sections = new Set(
      certificates.map((c) => c.student?.section).filter(Boolean),
    );
    return Array.from(sections);
  }, [certificates]);

  // Filter certificates
  const filteredCertificates = certificates.filter((cert) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const studentName =
        `${cert.student?.user?.first_name || ""} ${cert.student?.user?.last_name || ""}`.toLowerCase();
      const certNumber = cert.certificate_number?.toLowerCase() || "";
      const studentId = cert.student?.student_id?.toLowerCase() || "";

      if (
        !studentName.includes(search) &&
        !certNumber.includes(search) &&
        !studentId.includes(search)
      ) {
        return false;
      }
    }

    // Type filter
    if (filterType && cert.certificate_type !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus && cert.status !== filterStatus) {
      return false;
    }

    // Component filter
    if (
      filterComponent &&
      cert.student?.nstp_component_selected !== filterComponent
    ) {
      return false;
    }

    // Course filter
    if (filterCourse && cert.student?.course !== filterCourse) {
      return false;
    }

    // Section filter
    if (filterSection && cert.student?.section !== filterSection) {
      return false;
    }

    return true;
  });

  const handleDownload = async (id: number) => {
    window.open(`${API_URL}/student/certificates/${id}/download`, "_blank");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterStatus("");
    setFilterComponent("");
    setFilterCourse("");
    setFilterSection("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading certificates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Failed to load certificates: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            Issued Certificates
          </h2>
          <p className="text-sm text-slate-500">
            Total:{" "}
            <span className="font-semibold text-navy-900">
              {certificates.length}
            </span>
            {filteredCertificates.length !== certificates.length && (
              <span className="ml-2">
                • Showing:{" "}
                <span className="font-semibold text-gold-600">
                  {filteredCertificates.length}
                </span>
              </span>
            )}
          </p>
        </div>
        <RefreshButton onRefresh={refresh} isLoading={isRefreshing} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by name, ID, or certificate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {certificateTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
          >
            <option value="">All Components</option>
            {components.map((comp) => (
              <option key={comp} value={comp}>
                {comp?.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
          >
            <option value="">All Sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                Section {section}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
          {(filterType ||
            filterStatus ||
            filterComponent ||
            filterCourse ||
            filterSection ||
            searchTerm) && (
            <button
              className="text-sm text-gold-600 hover:text-gold-700"
              onClick={clearFilters}
            >
              <i className="fas fa-times mr-1" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Certificate Number</th>
                <th>Student</th>
                <th>Course</th>
                <th>Section</th>
                <th>Component</th>
                <th>Type</th>
                <th>Status</th>
                <th>Issued Date</th>
                <th>QR</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500">
                    <i className="fas fa-certificate text-3xl text-slate-300 block mb-3" />
                    No certificates found
                    {(filterType ||
                      filterStatus ||
                      filterComponent ||
                      filterCourse ||
                      filterSection ||
                      searchTerm) && (
                      <p className="text-sm mt-2">
                        Try adjusting your filters
                        <button
                          className="text-gold-600 hover:text-gold-700 ml-2"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id}>
                    <td className="font-bold text-navy-900">
                      {cert.certificate_number}
                    </td>
                    <td>
                      <div>
                        <div className="font-medium text-navy-900">
                          {cert.student?.user?.first_name}{" "}
                          {cert.student?.user?.last_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {cert.student?.student_id}
                        </div>
                      </div>
                    </td>
                    <td>{cert.student?.course || "-"}</td>
                    <td>{cert.student?.section || "-"}</td>
                    <td>
                      {cert.student?.nstp_component_selected ? (
                        <span className="badge badge-info">
                          {cert.student.nstp_component_selected.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {cert.certificate_type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${cert.status === "issued" ? "badge-success" : cert.status === "draft" ? "badge-warning" : "badge-danger"}`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td>
                      {cert.issued_at
                        ? new Date(cert.issued_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {cert.qr_code_path ? (
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() =>
                            window.open(
                              `${API_URL}/storage/${cert.qr_code_path}`,
                              "_blank",
                            )
                          }
                          title="View QR Code"
                        >
                          <i className="fas fa-qrcode" />
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleDownload(cert.id)}
                      >
                        <i className="fas fa-download" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IssuedCertificates;
