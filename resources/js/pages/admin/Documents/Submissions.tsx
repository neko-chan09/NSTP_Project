// src/pages/admin/Documents/Submissions.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDocuments, useVerifyDocument } from "../../hooks/useDocuments";
import RefreshButton from "../../components/common/RefreshButton";
import ScannerModal from "../../components/common/ScannerModal";
import toast from "react-hot-toast";
import { API_URL } from "../../../services/api";
import type { Document } from "../../../types/api";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface StudentGroup {
  student: any;
  docs: Document[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface SectionGroup {
  section: string;
  students: StudentGroup[];
  totalDocs: number;
  pendingCount: number;
}

interface CourseGroup {
  course: string;
  sections: SectionGroup[];
  totalDocs: number;
  totalStudents: number;
  pendingCount: number;
}

interface ComponentGroup {
  key: string;
  label: string;
  icon: string;
  courses: CourseGroup[];
  totalDocs: number;
  totalStudents: number;
  pendingCount: number;
}

const COMPONENTS = [
  { key: "cwts", label: "CWTS", icon: "fa-hands-helping" },
  { key: "rotc", label: "ROTC", icon: "fa-shield" },
  { key: "lts", label: "LTS", icon: "fa-chalkboard-teacher" },
] as const;

const DocumentSubmissions: React.FC = () => {
  const api_url = API_URL;

  const {
    data: docResponse,
    isLoading,
    error,
    refresh,
    isRefreshing,
  } = useDocuments();
  const documents = docResponse?.data || [];

  const verifyMut = useVerifyDocument();

  // ---------- UI state ----------
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [componentFilter, setComponentFilter] = useState<string>("all");

  // Scanner modal state
  const [scannerModal, setScannerModal] = useState<{
    open: boolean;
    file: File | Blob | null;
    fileName: string;
    documentId: number;
  } | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{
    documentId: number;
    fileName: string;
    studentName: string;
    reason: string;
  } | null>(null);

  // Bulk-select state for approve
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // Filtered documents
  // ============================================================
  const filteredDocuments = useMemo(() => {
    let list = documents;

    if (statusFilter !== "all") {
      list = list.filter((d) => d.status === statusFilter);
    }

    if (componentFilter !== "all") {
      list = list.filter(
        (d) => d.student?.nstp_component_selected === componentFilter
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((d) => {
        const name = `${d.student?.user?.first_name || ""} ${
          d.student?.user?.last_name || ""
        }`.toLowerCase();
        const sid = (d.student?.student_id || "").toLowerCase();
        const fname = (d.file_name || "").toLowerCase();
        const dtype = (d.document_type || "").toLowerCase();
        return (
          name.includes(q) ||
          sid.includes(q) ||
          fname.includes(q) ||
          dtype.includes(q)
        );
      });
    }

    return list;
  }, [documents, statusFilter, componentFilter, searchTerm]);

  // ============================================================
  // Build nested tree
  // ============================================================
  const tree = useMemo<ComponentGroup[]>(() => {
    const componentMap: Record<string, ComponentGroup> = {};

    filteredDocuments.forEach((doc) => {
      if (!doc.student) return;

      const compKey = doc.student.nstp_component_selected || "unassigned";
      const compLabel =
        compKey === "unassigned" ? "Unassigned" : compKey.toUpperCase();
      const compIcon =
        COMPONENTS.find((c) => c.key === compKey)?.icon ||
        "fa-question-circle";

      if (!componentMap[compKey]) {
        componentMap[compKey] = {
          key: compKey,
          label: compLabel,
          icon: compIcon,
          courses: [],
          totalDocs: 0,
          totalStudents: 0,
          pendingCount: 0,
        };
      }
      const compGroup = componentMap[compKey];

      // Course
      const courseKey = doc.student.course || "Unassigned";
      let courseGroup = compGroup.courses.find((c) => c.course === courseKey);
      if (!courseGroup) {
        courseGroup = {
          course: courseKey,
          sections: [],
          totalDocs: 0,
          totalStudents: 0,
          pendingCount: 0,
        };
        compGroup.courses.push(courseGroup);
      }

      // Section
      const sectionKey = doc.student.section || "Unassigned";
      let sectionGroup = courseGroup.sections.find(
        (s) => s.section === sectionKey
      );
      if (!sectionGroup) {
        sectionGroup = {
          section: sectionKey,
          students: [],
          totalDocs: 0,
          pendingCount: 0,
        };
        courseGroup.sections.push(sectionGroup);
      }

      // Student
      let studentGroup = sectionGroup.students.find(
        (s) => s.student?.id === doc.student?.id
      );
      if (!studentGroup) {
        studentGroup = {
          student: doc.student,
          docs: [],
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
        };
        sectionGroup.students.push(studentGroup);
      }
      studentGroup.docs.push(doc);

      // Aggregates
      if (doc.status === "pending") {
        compGroup.pendingCount++;
        courseGroup.pendingCount++;
        sectionGroup.pendingCount++;
        studentGroup.pendingCount++;
      } else if (doc.status === "approved") {
        studentGroup.approvedCount++;
      } else if (doc.status === "rejected") {
        studentGroup.rejectedCount++;
      }

      compGroup.totalDocs++;
      courseGroup.totalDocs++;
      sectionGroup.totalDocs++;
    });

    // Compute totals
    Object.values(componentMap).forEach((comp) => {
      const studentSet = new Set<number>();
      comp.courses.forEach((course) => {
        const courseStudentSet = new Set<number>();
        course.sections.forEach((sec) => {
          sec.students.forEach((sg) => {
            studentSet.add(sg.student.id);
            courseStudentSet.add(sg.student.id);
          });
        });
        course.totalStudents = courseStudentSet.size;
      });
      comp.totalStudents = studentSet.size;
    });

    // Sort sections and students
    Object.values(componentMap).forEach((comp) => {
      comp.courses.forEach((course) => {
        course.sections.sort((a, b) =>
          a.section.localeCompare(b.section, undefined, { numeric: true })
        );
        course.sections.forEach((sec) => {
          sec.students.sort((a, b) =>
            (a.student.user?.last_name || "").localeCompare(
              b.student.user?.last_name || ""
            )
          );
        });
      });
    });

    // Sort: assigned components first (cwts, rotc, lts), then unassigned
    const order = ["cwts", "rotc", "lts", "unassigned"];
    return order
      .map((k) => componentMap[k])
      .filter(Boolean) as ComponentGroup[];
  }, [filteredDocuments]);

  // ============================================================
  // Expand/collapse
  // ============================================================
  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isOpen = (key: string) => expanded.has(key);

  const expandAll = () => {
    const keys: string[] = [];
    tree.forEach((comp) => {
      keys.push(`comp:${comp.key}`);
      comp.courses.forEach((course) => {
        keys.push(`course:${comp.key}:${course.course}`);
        course.sections.forEach((sec) => {
          keys.push(`sec:${comp.key}:${course.course}:${sec.section}`);
        });
      });
    });
    setExpanded(new Set(keys));
  };

  const collapseAll = () => setExpanded(new Set());

  // ============================================================
  // Scanner (OCR)
  // ============================================================
  const handleOCR = async (doc: Document) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${api_url}/admin/documents/${doc.id}/download`,  // <-- changed from /student/documents
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      if (response.status === 404) {
        toast.error("File not found on server");
      } else if (response.status === 401) {
        toast.error("Please login again");
      } else if (response.status === 403) {
        toast.error("You do not have permission to access this file");
      } else {
        toast.error(`Server error: ${response.status}`);
      }
      return;
    }

    const blob = await response.blob();
    setScannerModal({
      open: true,
      file: blob,
      fileName: doc.file_name,
      documentId: doc.id,
    });
  } catch (err) {
    toast.error("Failed to access file");
  }
};

  // ============================================================
  // Verify actions
  // ============================================================
  const handleApprove = async (doc: Document) => {
    try {
      await verifyMut.mutateAsync({
        id: doc.id,
        status: "approved",
      });
      toast.success(`Approved: ${doc.file_name}`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    }
  };

  const handleRejectClick = (doc: Document, studentName: string) => {
    setRejectModal({
      documentId: doc.id,
      fileName: doc.file_name,
      studentName,
      reason: "",
    });
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    if (!rejectModal.reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      await verifyMut.mutateAsync({
        id: rejectModal.documentId,
        status: "rejected",
        rejection_reason: rejectModal.reason.trim(),
      });
      toast.success(`Rejected: ${rejectModal.fileName}`);
      setRejectModal(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedDocs.size === 0) return;
    const confirmed = window.confirm(
      `Approve ${selectedDocs.size} selected document${
        selectedDocs.size !== 1 ? "s" : ""
      }?`
    );
    if (!confirmed) return;

    let success = 0;
    let failed = 0;
    for (const id of selectedDocs) {
      try {
        await verifyMut.mutateAsync({ id, status: "approved" });
        success++;
      } catch {
        failed++;
      }
    }

    toast.success(`Approved ${success} document${success !== 1 ? "s" : ""}${
      failed > 0 ? ` • ${failed} failed` : ""
    }`);
    setSelectedDocs(new Set());
    refresh();
  };

  const toggleSelectDoc = (docId: number) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const selectAllPending = () => {
    const pending = filteredDocuments
      .filter((d) => d.status === "pending")
      .map((d) => d.id);
    setSelectedDocs(new Set(pending));
  };

  // ============================================================
  // Status helpers
  // ============================================================
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "badge-warning",
      approved: "badge-success",
      rejected: "badge-danger",
    };
    return map[status] || "badge-secondary";
  };

  const getStatusIcon = (status: string) => {
    const map: Record<string, string> = {
      pending: "fa-clock",
      approved: "fa-check-circle",
      rejected: "fa-times-circle",
    };
    return map[status] || "fa-file";
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
    };
    return map[status] || status;
  };

  // ============================================================
  // Render helpers
  // ============================================================
  const renderDocument = (doc: Document, studentName: string) => {
    const isImage = doc.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isScannable = doc.file_name?.match(/\.(jpg|jpeg|png|gif|webp|bmp|tif|tiff|pdf)$/i);
    const isSelected = selectedDocs.has(doc.id);
    const isActing =
      verifyMut.isPending && verifyMut.variables?.id === doc.id;

    return (
      <div
        key={doc.id}
        className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors ${
          isSelected
            ? "bg-gold-50 border-gold-300"
            : "bg-white border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox (pending only) */}
          {doc.status === "pending" && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelectDoc(doc.id)}
              className="mt-1 w-4 h-4 accent-gold-500 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* File icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              doc.file_name?.match(/\.pdf$/i)
                ? "bg-red-50 text-red-500"
                : isImage
                ? "bg-purple-50 text-purple-500"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <i
              className={`fas ${
                doc.file_name?.match(/\.pdf$/i)
                  ? "fa-file-pdf"
                  : isImage
                  ? "fa-file-image"
                  : "fa-file"
              }`}
            />
          </div>

          {/* File details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              {/* File name link */}
<a
  href={`${api_url}/admin/documents/${doc.id}/download`}
  target="_blank"
  rel="noopener"
  className="text-sm font-medium text-navy-900 hover:text-gold-600 hover:underline truncate"
  onClick={(e) => e.stopPropagation()}
>
  {doc.file_name}
</a>
              <span className={`badge ${getStatusBadge(doc.status)}`}>
                <i className={`fas ${getStatusIcon(doc.status)} mr-1`} />
                {getStatusLabel(doc.status)}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
              <span>
                <i className="fas fa-tag mr-1" />
                {doc.document_type}
              </span>
              {doc.file_size && (
                <span>
                  <i className="fas fa-hdd mr-1" />
                  {doc.file_size < 1024
                    ? `${doc.file_size} B`
                    : doc.file_size < 1024 * 1024
                    ? `${(doc.file_size / 1024).toFixed(1)} KB`
                    : `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`}
                </span>
              )}
              <span>
                <i className="fas fa-calendar mr-1" />
                {new Date(doc.created_at).toLocaleDateString()}
              </span>
              {doc.extracted_text && (
                <span className="text-emerald-600">
                  <i className="fas fa-file-alt mr-1" />
                  Text extracted
                </span>
              )}
            </div>

            {/* Rejection reason */}
            {doc.status === "rejected" && doc.rejection_reason && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <i className="fas fa-info-circle mr-1" />
                <strong>Reason:</strong> {doc.rejection_reason}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {doc.status === "pending" && (
              <>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleApprove(doc)}
                  disabled={isActing}
                  title="Approve"
                >
                  {isActing ? (
                    <i className="fas fa-spinner fa-spin" />
                  ) : (
                    <>
                      <i className="fas fa-check" /> Approve
                    </>
                  )}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRejectClick(doc, studentName)}
                  disabled={isActing}
                  title="Reject"
                >
                  <i className="fas fa-times" /> Reject
                </button>
              </>
            )}
            {isScannable && (
              <button
                className="btn btn-info btn-sm"
                onClick={() => handleOCR(doc)}
                title="Scan and select document text"
              >
                <i className="fas fa-file-scan" /> Scan
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStudent = (
    studentGroup: StudentGroup,
    parentKey: string
  ) => {
    const studentName = `${studentGroup.student.user?.first_name || ""} ${
      studentGroup.student.user?.last_name || ""
    }`;
    const key = `${parentKey}:stu:${studentGroup.student.id}`;
    const open = isOpen(key);

    return (
      <div key={key} className="ml-6">
        <button
          className={`w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-left ${
            open ? "bg-slate-50" : "hover:bg-slate-50"
          }`}
          onClick={() => toggle(key)}
        >
          <i
            className={`fas fa-chevron-right text-xs text-slate-400 transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          <div className="w-7 h-7 rounded-full bg-navy-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {studentGroup.student.user?.first_name?.[0] || "?"}
            {studentGroup.student.user?.last_name?.[0] || ""}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-navy-900 truncate">
              {studentName || "Unknown"}
            </div>
            <div className="text-xs text-slate-400">
              {studentGroup.student.student_id || "N/A"}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {studentGroup.pendingCount > 0 && (
              <span className="badge badge-warning text-[10px]">
                {studentGroup.pendingCount} pending
              </span>
            )}
            {studentGroup.approvedCount > 0 && (
              <span className="badge badge-success text-[10px]">
                {studentGroup.approvedCount} ✓
              </span>
            )}
            {studentGroup.rejectedCount > 0 && (
              <span className="badge badge-danger text-[10px]">
                {studentGroup.rejectedCount} ✗
              </span>
            )}
          </div>
        </button>

        {open && (
          <div className="ml-6 mt-2 space-y-2">
            {studentGroup.docs.map((doc) =>
              renderDocument(doc, studentName)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (sectionGroup: SectionGroup, parentKey: string) => {
    const key = `${parentKey}:sec:${sectionGroup.section}`;
    const open = isOpen(key);

    return (
      <div key={key} className="ml-4">
        <button
          className={`w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-left ${
            open ? "bg-slate-50" : "hover:bg-slate-50"
          }`}
          onClick={() => toggle(key)}
        >
          <i
            className={`fas fa-chevron-right text-xs text-slate-400 transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          <i className="fas fa-users text-slate-500" />
          <span className="font-medium text-navy-900 flex-1">
            Section {sectionGroup.section}
          </span>
          <div className="flex items-center gap-1.5">
            {sectionGroup.pendingCount > 0 && (
              <span className="badge badge-warning text-[10px]">
                {sectionGroup.pendingCount} pending
              </span>
            )}
            <span className="badge badge-secondary text-[10px]">
              {sectionGroup.students.length} student
              {sectionGroup.students.length !== 1 ? "s" : ""}
            </span>
            <span className="badge badge-secondary text-[10px]">
              {sectionGroup.totalDocs} file
              {sectionGroup.totalDocs !== 1 ? "s" : ""}
            </span>
          </div>
        </button>

        {open && (
          <div className="space-y-1 mt-1">
            {sectionGroup.students.map((sg) => renderStudent(sg, key))}
          </div>
        )}
      </div>
    );
  };

  const renderCourse = (courseGroup: CourseGroup, parentKey: string) => {
    const key = `${parentKey}:course:${courseGroup.course}`;
    const open = isOpen(key);

    return (
      <div key={key} className="ml-4">
        <button
          className={`w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-left ${
            open ? "bg-slate-50" : "hover:bg-slate-50"
          }`}
          onClick={() => toggle(key)}
        >
          <i
            className={`fas fa-chevron-right text-xs text-slate-400 transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          <i className="fas fa-graduation-cap text-slate-500" />
          <span className="font-medium text-navy-900 flex-1">
            {courseGroup.course}
          </span>
          <div className="flex items-center gap-1.5">
            {courseGroup.pendingCount > 0 && (
              <span className="badge badge-warning text-[10px]">
                {courseGroup.pendingCount} pending
              </span>
            )}
            <span className="badge badge-secondary text-[10px]">
              {courseGroup.totalStudents} student
              {courseGroup.totalStudents !== 1 ? "s" : ""}
            </span>
            <span className="badge badge-secondary text-[10px]">
              {courseGroup.totalDocs} file
              {courseGroup.totalDocs !== 1 ? "s" : ""}
            </span>
          </div>
        </button>

        {open && (
          <div className="space-y-1 mt-1">
            {courseGroup.sections.map((sec) => renderSection(sec, key))}
          </div>
        )}
      </div>
    );
  };

  const renderComponent = (comp: ComponentGroup) => {
    const key = `comp:${comp.key}`;
    const open = isOpen(key);

    return (
      <div
        key={key}
        className="border border-slate-200 rounded-xl overflow-hidden bg-white"
      >
        <button
          className={`w-full flex items-center gap-3 p-4 cursor-pointer transition-colors text-left ${
            open ? "bg-slate-50" : "hover:bg-slate-50"
          }`}
          onClick={() => toggle(key)}
        >
          <i
            className={`fas fa-chevron-right text-xs text-slate-400 transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              comp.key === "cwts"
                ? "bg-blue-100 text-blue-600"
                : comp.key === "rotc"
                ? "bg-red-100 text-red-600"
                : comp.key === "lts"
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <i className={`fas ${comp.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-navy-900">{comp.label}</div>
            <div className="text-xs text-slate-500">
              {comp.courses.length} course
              {comp.courses.length !== 1 ? "s" : ""} • {comp.totalStudents}{" "}
              student{comp.totalStudents !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {comp.pendingCount > 0 && (
              <span className="badge badge-warning">
                <i className="fas fa-clock mr-1" />
                {comp.pendingCount} pending
              </span>
            )}
            <span className="badge badge-secondary">
              {comp.totalDocs} file{comp.totalDocs !== 1 ? "s" : ""}
            </span>
          </div>
        </button>

        {open && (
          <div className="p-4 pt-0 space-y-1">
            {comp.courses.map((course) => renderCourse(course, key))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // Loading / error
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Failed to load documents: {(error as Error).message}
      </div>
    );
  }

  // ============================================================
  // Stats summary
  // ============================================================
  const pendingTotal = documents.filter((d) => d.status === "pending").length;
  const approvedTotal = documents.filter((d) => d.status === "approved").length;
  const rejectedTotal = documents.filter((d) => d.status === "rejected").length;

  return (
    <div className="space-y-5">
      {/* ============================================================
          HEADER
         ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-file-upload text-gold-500 mr-2" />
            Document Submissions
          </h2>
          <p className="text-sm text-slate-500">
            <i className="fas fa-file-scan text-gold-500 mr-1" />
            Review, scan, and verify student-submitted documents
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton onRefresh={refresh} isLoading={isRefreshing} />
        </div>
      </div>

      {/* ============================================================
          STATS STRIP
         ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          className={`text-left p-3 rounded-xl border-l-4 bg-white shadow-sm transition-all hover:shadow ${
            statusFilter === "pending"
              ? "border-amber-500 ring-2 ring-amber-200"
              : "border-amber-500"
          }`}
          onClick={() =>
            setStatusFilter(statusFilter === "pending" ? "all" : "pending")
          }
        >
          <span className="block text-xs text-slate-500 uppercase tracking-wider">
            Pending
          </span>
          <span className="text-2xl font-bold text-amber-600">
            {pendingTotal}
          </span>
        </button>
        <button
          className={`text-left p-3 rounded-xl border-l-4 bg-white shadow-sm transition-all hover:shadow ${
            statusFilter === "approved"
              ? "border-emerald-500 ring-2 ring-emerald-200"
              : "border-emerald-500"
          }`}
          onClick={() =>
            setStatusFilter(statusFilter === "approved" ? "all" : "approved")
          }
        >
          <span className="block text-xs text-slate-500 uppercase tracking-wider">
            Approved
          </span>
          <span className="text-2xl font-bold text-emerald-600">
            {approvedTotal}
          </span>
        </button>
        <button
          className={`text-left p-3 rounded-xl border-l-4 bg-white shadow-sm transition-all hover:shadow ${
            statusFilter === "rejected"
              ? "border-red-500 ring-2 ring-red-200"
              : "border-red-500"
          }`}
          onClick={() =>
            setStatusFilter(statusFilter === "rejected" ? "all" : "rejected")
          }
        >
          <span className="block text-xs text-slate-500 uppercase tracking-wider">
            Rejected
          </span>
          <span className="text-2xl font-bold text-red-600">
            {rejectedTotal}
          </span>
        </button>
        <button
          className={`text-left p-3 rounded-xl border-l-4 bg-white shadow-sm transition-all hover:shadow ${
            statusFilter === "all"
              ? "border-navy-600 ring-2 ring-slate-200"
              : "border-navy-600"
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <span className="block text-xs text-slate-500 uppercase tracking-wider">
            Total
          </span>
          <span className="text-2xl font-bold text-navy-700">
            {documents.length}
          </span>
        </button>
      </div>

      {/* ============================================================
          TOOLBAR
         ============================================================ */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="search-box flex-1 min-w-[240px]">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search student name, ID, file name, or document type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="text-slate-400 hover:text-slate-600 px-2"
                onClick={() => setSearchTerm("")}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          {/* Component filter */}
          <select
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
          >
            <option value="all">All Components</option>
            <option value="cwts">CWTS</option>
            <option value="rotc">ROTC</option>
            <option value="lts">LTS</option>
          </select>

          {/* Expand/collapse */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              className="px-3 py-1.5 rounded text-sm font-medium text-slate-600 hover:text-navy-700 flex items-center gap-1.5"
              onClick={expandAll}
              title="Expand all"
            >
              <i className="fas fa-expand-alt" /> Expand
            </button>
            <button
              className="px-3 py-1.5 rounded text-sm font-medium text-slate-600 hover:text-navy-700 flex items-center gap-1.5"
              onClick={collapseAll}
              title="Collapse all"
            >
              <i className="fas fa-compress-alt" /> Collapse
            </button>
          </div>
        </div>

        {/* Active filters indicator */}
        {(searchTerm ||
          statusFilter !== "all" ||
          componentFilter !== "all") && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Active filters:</span>
            {searchTerm && (
              <span className="badge badge-info">
                Search: "{searchTerm}"
              </span>
            )}
            {statusFilter !== "all" && (
              <span className={`badge ${getStatusBadge(statusFilter)}`}>
                Status: {getStatusLabel(statusFilter)}
              </span>
            )}
            {componentFilter !== "all" && (
              <span className="badge badge-secondary">
                Component: {componentFilter.toUpperCase()}
              </span>
            )}
            <button
              className="text-gold-600 hover:text-gold-700 ml-auto"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setComponentFilter("all");
              }}
            >
              <i className="fas fa-times mr-1" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* ============================================================
          BULK ACTION BAR
         ============================================================ */}
      {selectedDocs.size > 0 && (
        <div className="bg-gold-50 border border-gold-300 rounded-xl p-3 flex flex-wrap items-center gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-2 text-sm text-gold-800">
            <i className="fas fa-check-square" />
            <strong>{selectedDocs.size}</strong> document
            {selectedDocs.size !== 1 ? "s" : ""} selected
          </div>
          <div className="ml-auto flex gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedDocs(new Set())}
            >
              Clear
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={handleBulkApprove}
              disabled={verifyMut.isPending}
            >
              {verifyMut.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1" /> Approving...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-1" /> Approve{" "}
                  {selectedDocs.size}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          QUICK ACTIONS
         ============================================================ */}
      {pendingTotal > 0 && selectedDocs.size === 0 && (
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">
            <i className="fas fa-lightbulb text-gold-500 mr-1" />
            <strong>{pendingTotal}</strong> pending document
            {pendingTotal !== 1 ? "s" : ""} to review
          </span>
          <button
            className="ml-auto btn btn-secondary btn-sm"
            onClick={selectAllPending}
          >
            <i className="fas fa-check-double mr-1" />
            Select all pending
          </button>
        </div>
      )}

      {/* ============================================================
          TREE
         ============================================================ */}
      <div className="space-y-3">
        {tree.length === 0 ? (
          <div className="empty-state bg-white rounded-xl border border-slate-200">
            <i className="fas fa-folder-open text-4xl text-slate-300 block mb-3" />
            <p className="text-slate-500">
              {documents.length === 0
                ? "No student documents submitted yet"
                : "No documents match your filters"}
            </p>
            {(searchTerm ||
              statusFilter !== "all" ||
              componentFilter !== "all") && (
              <button
                className="btn btn-secondary mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setComponentFilter("all");
                }}
              >
                <i className="fas fa-times mr-1" /> Clear all filters
              </button>
            )}
          </div>
        ) : (
          tree.map((comp) => renderComponent(comp))
        )}
      </div>

      {/* ============================================================
          REJECT MODAL
         ============================================================ */}
      {rejectModal && (
        <div
          className="modal-overlay"
          onClick={() => !verifyMut.isPending && setRejectModal(null)}
        >
          <div
            className="modal max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="text-lg font-semibold text-navy-900">
                  <i className="fas fa-times-circle text-red-500 mr-2" />
                  Reject Document
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rejectModal.fileName}
                </p>
                <p className="text-xs text-slate-400">
                  Student: {rejectModal.studentName}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setRejectModal(null)}
                disabled={verifyMut.isPending}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <label className="label">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Explain why this document is being rejected so the student can fix it..."
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal({ ...rejectModal, reason: e.target.value })
                }
                autoFocus
                disabled={verifyMut.isPending}
              />
              <p className="text-xs text-slate-500 mt-2">
                <i className="fas fa-info-circle mr-1" />
                The student will receive a notification with this reason.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setRejectModal(null)}
                disabled={verifyMut.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectSubmit}
                disabled={verifyMut.isPending || !rejectModal.reason.trim()}
              >
                {verifyMut.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1" /> Rejecting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-times mr-1" /> Reject Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SCANNER MODAL
         ============================================================ */}
      {scannerModal && (
        <ScannerModal
          isOpen={scannerModal.open}
          onClose={() => setScannerModal(null)}
          file={scannerModal.file}
          fileName={scannerModal.fileName}
          documentId={scannerModal.documentId}
          documentType="student"
          onTextExtracted={(text) => {
            toast.success("Selected text ready");
          }}
        />
      )}
    </div>
  );
};

export default DocumentSubmissions;
